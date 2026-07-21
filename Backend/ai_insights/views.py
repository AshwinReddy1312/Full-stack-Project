"""
ai_insights/views.py
--------------------
POST /api/ai/generate/          – generate new AI report (calls OpenAI)
GET  /api/ai/reports/           – list all reports for this user
GET  /api/ai/reports/<id>/      – fetch single report detail
DELETE /api/ai/reports/<id>/    – delete a report
GET  /api/ai/reports/latest/    – get the most recent completed report
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination

from .models import AIInsightReport
from .ai_engine import generate_insights


# ── Helpers ───────────────────────────────────────────────────────────────────

def ok(msg, data, http_status=status.HTTP_200_OK):
    return Response({'success': True, 'message': msg, 'data': data}, status=http_status)

def err(msg, errors=None, http_status=status.HTTP_400_BAD_REQUEST):
    return Response({'success': False, 'message': msg, 'data': {}, 'errors': errors or {}}, status=http_status)


def _serialise_report(report, include_summary=False):
    d = {
        'id':           report.pk,
        'report_id':    report.report_id,
        'report_type':  report.report_type,
        'report_type_display': report.get_report_type_display(),
        'period':       report.period,
        'status':       report.status,
        'insights':     report.insights,
        'tokens_used':  report.tokens_used,
        'model_used':   report.model_used,
        'error':        report.error,
        'created_at':   report.created_at.isoformat(),
        'updated_at':   report.updated_at.isoformat(),
    }
    if include_summary:
        d['data_summary'] = report.data_summary
    return d


class ReportPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'


# ── Generate ─────────────────────────────────────────────────────────────────

class GenerateInsightView(APIView):
    """
    POST /api/ai/generate/
    Body: { "period": "30d", "report_type": "full" }
    Calls OpenAI and stores the result.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        period      = request.data.get('period', '30d')
        report_type = request.data.get('report_type', 'full')

        # Validate inputs
        valid_periods = ['7d', '30d', '90d', '180d', '365d', 'all']
        valid_types   = [c[0] for c in AIInsightReport.ReportType.choices]

        if period not in valid_periods:
            return err(f'Invalid period. Choose from: {valid_periods}')
        if report_type not in valid_types:
            return err(f'Invalid report type. Choose from: {valid_types}')

        # Create a pending report record
        report = AIInsightReport.objects.create(
            requested_by=request.user,
            report_type=report_type,
            period=period,
            status=AIInsightReport.Status.PENDING,
        )

        try:
            result = generate_insights(period=period, report_type=report_type)

            report.status       = AIInsightReport.Status.COMPLETED
            report.insights     = result['insights']
            report.tokens_used  = result['tokens_used']
            report.model_used   = result['model']
            report.data_summary = result['data_summary']
            report.save()

            return ok('AI insights generated successfully.', _serialise_report(report), status.HTTP_201_CREATED)

        except ValueError as e:
            report.status = AIInsightReport.Status.FAILED
            report.error  = str(e)
            report.save()
            return err(str(e), http_status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            report.status = AIInsightReport.Status.FAILED
            report.error  = str(e)
            report.save()
            return err(f'AI generation failed: {str(e)}', http_status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ── List ─────────────────────────────────────────────────────────────────────

class ReportListView(APIView):
    """GET /api/ai/reports/ – paginated list of reports for this user."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = AIInsightReport.objects.filter(requested_by=request.user)

        paginator = ReportPagination()
        page = paginator.paginate_queryset(qs, request)

        reports = [_serialise_report(r) for r in page]
        return Response({
            'success': True,
            'message': 'Reports retrieved.',
            'data': {
                'results':      reports,
                'count':        paginator.page.paginator.count,
                'total_pages':  paginator.page.paginator.num_pages,
                'current_page': paginator.page.number,
                'next':         paginator.get_next_link(),
                'previous':     paginator.get_previous_link(),
            }
        })


# ── Detail + Delete ───────────────────────────────────────────────────────────

class ReportDetailView(APIView):
    """
    GET    /api/ai/reports/<id>/
    DELETE /api/ai/reports/<id>/
    """
    permission_classes = [IsAuthenticated]

    def _get(self, pk, user):
        try:
            return AIInsightReport.objects.get(pk=pk, requested_by=user)
        except AIInsightReport.DoesNotExist:
            return None

    def get(self, request, pk):
        report = self._get(pk, request.user)
        if not report:
            return err('Report not found.', http_status=status.HTTP_404_NOT_FOUND)
        return ok('Report retrieved.', _serialise_report(report, include_summary=True))

    def delete(self, request, pk):
        report = self._get(pk, request.user)
        if not report:
            return err('Report not found.', http_status=status.HTTP_404_NOT_FOUND)
        ref = report.report_id
        report.delete()
        return ok(f'Report {ref} deleted.', {})


# ── Latest report ─────────────────────────────────────────────────────────────

class LatestReportView(APIView):
    """GET /api/ai/reports/latest/ – most recent completed report."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        report = AIInsightReport.objects.filter(
            requested_by=request.user,
            status=AIInsightReport.Status.COMPLETED
        ).first()
        if not report:
            return ok('No reports yet.', None)
        return ok('Latest report retrieved.', _serialise_report(report))
