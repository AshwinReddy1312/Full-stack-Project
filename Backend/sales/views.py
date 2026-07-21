"""
sales/views.py
--------------
Endpoints:
  POST   /api/sales/upload/          – Upload CSV, validate, return validation result + preview
  POST   /api/sales/upload/<id>/confirm/ – Confirm and trigger full processing
  GET    /api/sales/uploads/         – List all upload batches (history)
  GET    /api/sales/uploads/<id>/    – Upload detail + summary
  DELETE /api/sales/uploads/<id>/    – Delete upload batch + all its records
  GET    /api/sales/uploads/<id>/errors/ – Download error log for an upload
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.pagination import PageNumberPagination

from .models import SalesUpload, SalesRecord
from .serializers import SalesUploadSerializer, SalesRecordSerializer
from .csv_processor import validate_csv, preview_csv, process_csv


# ── Helpers ───────────────────────────────────────────────────────────────────

def ok(msg, data, http_status=status.HTTP_200_OK):
    return Response({'success': True, 'message': msg, 'data': data}, status=http_status)

def err(msg, errors=None, http_status=status.HTTP_400_BAD_REQUEST):
    return Response({'success': False, 'message': msg, 'data': {}, 'errors': errors or {}}, status=http_status)


class UploadPagination(PageNumberPagination):
    page_size = 15
    page_size_query_param = 'page_size'


# ── Upload View ───────────────────────────────────────────────────────────────

class CSVUploadView(APIView):
    """
    POST /api/sales/upload/
    Accepts a CSV file, validates it, stores it as SalesUpload (Pending),
    returns validation result and preview rows.
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        file = request.FILES.get('file')
        if not file:
            return err('No file provided. Please attach a CSV file.')

        # File type check
        if not file.name.lower().endswith('.csv'):
            return err('Invalid file type. Only CSV files are accepted.')

        # File size guard (20 MB max)
        if file.size > 20 * 1024 * 1024:
            return err('File too large. Maximum allowed size is 20 MB.')

        # ── Validate ──────────────────────────────────────────
        validation = validate_csv(file)

        if not validation['valid']:
            return Response({
                'success': False,
                'message': f'CSV validation failed with {len(validation["errors"])} error(s). Please fix them and re-upload.',
                'data': {
                    'total_rows':  validation['total_rows'],
                    'error_count': len(validation['errors']),
                },
                'errors': validation['errors'],
            }, status=status.HTTP_422_UNPROCESSABLE_ENTITY)

        # ── Store upload record (Pending) ─────────────────────
        file.seek(0)
        upload = SalesUpload.objects.create(
            uploaded_by=request.user,
            file=file,
            filename=file.name,
            status=SalesUpload.Status.PENDING,
            total_rows=validation['total_rows'],
        )

        # ── Generate preview ──────────────────────────────────
        file.seek(0)
        preview_rows = preview_csv(file, validation['column_map'])

        return ok('CSV validated successfully. Review the preview and confirm import.', {
            'upload_id':   upload.pk,
            'upload_ref':  upload.upload_id,
            'filename':    upload.filename,
            'total_rows':  validation['total_rows'],
            'column_map':  validation['column_map'],
            'preview':     preview_rows,
            'preview_count': len(preview_rows),
        }, status.HTTP_201_CREATED)


class CSVConfirmView(APIView):
    """
    POST /api/sales/upload/<id>/confirm/
    Triggers full CSV processing for an upload in Pending status.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            upload = SalesUpload.objects.get(pk=pk, uploaded_by=request.user)
        except SalesUpload.DoesNotExist:
            return err('Upload not found.', http_status=status.HTTP_404_NOT_FOUND)

        if upload.status != SalesUpload.Status.PENDING:
            return err(f'This upload has already been {upload.status.lower()}. Only Pending uploads can be confirmed.')

        # ── Mark processing ───────────────────────────────────
        upload.status = SalesUpload.Status.PROCESSING
        upload.save(update_fields=['status'])

        try:
            # Re-validate column map (re-read file)
            upload.file.seek(0)
            validation = validate_csv(upload.file)
            upload.file.seek(0)

            result = process_csv(
                file_obj=upload.file,
                column_map=validation['column_map'],
                upload_instance=upload,
                uploaded_by=request.user,
            )

            # ── Update upload summary ─────────────────────────
            upload.status           = SalesUpload.Status.COMPLETED
            upload.imported_count   = result['imported']
            upload.failed_count     = result['failed']
            upload.duplicate_count  = result['duplicates']
            upload.processing_time  = result['processing_time']
            upload.error_log        = result['errors']
            upload.save()

            return ok('CSV processed successfully.', {
                'upload_id':       upload.pk,
                'upload_ref':      upload.upload_id,
                'total_rows':      upload.total_rows,
                'imported':        upload.imported_count,
                'failed':          upload.failed_count,
                'duplicates':      upload.duplicate_count,
                'processing_time': f'{upload.processing_time}s',
                'error_count':     len(result['errors']),
            })

        except Exception as e:
            upload.status = SalesUpload.Status.FAILED
            upload.error_log = [{'row': 0, 'column': 'system', 'error': str(e)}]
            upload.save(update_fields=['status', 'error_log'])
            return err(f'Processing failed: {str(e)}', http_status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ── History List ──────────────────────────────────────────────────────────────

class UploadListView(APIView):
    """GET /api/sales/uploads/ – paginated upload history"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = SalesUpload.objects.filter(uploaded_by=request.user).order_by('-created_at')

        paginator = UploadPagination()
        page = paginator.paginate_queryset(qs, request)
        serializer = SalesUploadSerializer(page, many=True)

        return Response({
            'success': True,
            'message': 'Upload history retrieved.',
            'data': {
                'results':      serializer.data,
                'count':        paginator.page.paginator.count,
                'total_pages':  paginator.page.paginator.num_pages,
                'current_page': paginator.page.number,
                'next':         paginator.get_next_link(),
                'previous':     paginator.get_previous_link(),
            }
        })


class UploadDetailView(APIView):
    """
    GET    /api/sales/uploads/<id>/  – upload detail + summary + sample records
    DELETE /api/sales/uploads/<id>/  – delete batch and all associated records
    """
    permission_classes = [IsAuthenticated]

    def _get(self, pk, user):
        try:
            return SalesUpload.objects.get(pk=pk, uploaded_by=user)
        except SalesUpload.DoesNotExist:
            return None

    def get(self, request, pk):
        upload = self._get(pk, request.user)
        if not upload:
            return err('Upload not found.', http_status=status.HTTP_404_NOT_FOUND)

        serializer = SalesUploadSerializer(upload)
        # Include first 10 records as sample
        sample_records = SalesRecord.objects.filter(upload=upload)[:10]
        sample_serializer = SalesRecordSerializer(sample_records, many=True)

        data = serializer.data
        data['sample_records'] = sample_serializer.data
        return ok('Upload retrieved.', data)

    def delete(self, request, pk):
        upload = self._get(pk, request.user)
        if not upload:
            return err('Upload not found.', http_status=status.HTTP_404_NOT_FOUND)

        ref = upload.upload_id
        upload.delete()  # cascades to SalesRecord
        return ok(f'Upload {ref} and all its records deleted.', {})


class UploadErrorsView(APIView):
    """GET /api/sales/uploads/<id>/errors/ – return full error log"""
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            upload = SalesUpload.objects.get(pk=pk, uploaded_by=request.user)
        except SalesUpload.DoesNotExist:
            return err('Upload not found.', http_status=status.HTTP_404_NOT_FOUND)

        return ok('Error log retrieved.', {
            'upload_id': upload.upload_id,
            'filename':  upload.filename,
            'errors':    upload.error_log,
            'error_count': len(upload.error_log),
        })
