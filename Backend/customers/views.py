"""
customers/views.py
------------------
CustomerListCreateView  – GET (paginated, searchable, filterable) + POST
CustomerDetailView      – GET single + PUT + DELETE
CustomerStatusToggleView – PATCH toggle Active/Inactive quickly
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.pagination import PageNumberPagination
from django.db.models import Q

from .models import Customer
from .serializers import CustomerSerializer, CustomerListSerializer, CustomerWriteSerializer


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

class CustomerPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


def ok(message, data, http_status=status.HTTP_200_OK):
    return Response({'success': True, 'message': message, 'data': data}, status=http_status)


def err(message, errors=None, http_status=status.HTTP_400_BAD_REQUEST):
    return Response({'success': False, 'message': message, 'data': {}, 'errors': errors or {}}, status=http_status)


# ---------------------------------------------------------------------------
# List + Create
# ---------------------------------------------------------------------------

class CustomerListCreateView(APIView):
    """
    GET  /api/customers/  – paginated list with search & filters
    POST /api/customers/  – create new customer
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        qs = Customer.objects.select_related('created_by').all()

        # ── Search ────────────────────────────────────────────
        search = request.query_params.get('search', '').strip()
        if search:
            qs = qs.filter(
                Q(first_name__icontains=search)  |
                Q(last_name__icontains=search)   |
                Q(email__icontains=search)        |
                Q(phone_number__icontains=search) |
                Q(pk__icontains=search)           # customer_id numeric part
            )

        # ── Filters ───────────────────────────────────────────
        customer_type = request.query_params.get('customer_type')
        if customer_type:
            qs = qs.filter(customer_type__iexact=customer_type)

        cust_status = request.query_params.get('status')
        if cust_status:
            qs = qs.filter(status__iexact=cust_status)

        city = request.query_params.get('city', '').strip()
        if city:
            qs = qs.filter(city__icontains=city)

        # ── Ordering ──────────────────────────────────────────
        ordering = request.query_params.get('ordering', '-created_at')
        allowed  = ['first_name', '-first_name', 'created_at', '-created_at', 'last_name', '-last_name']
        if ordering in allowed:
            qs = qs.order_by(ordering)

        # ── Pagination ────────────────────────────────────────
        paginator = CustomerPagination()
        page = paginator.paginate_queryset(qs, request)
        serializer = CustomerListSerializer(page, many=True, context={'request': request})
        return Response({
            'success': True,
            'message': 'Customers retrieved successfully',
            'data': {
                'results':      serializer.data,
                'count':        paginator.page.paginator.count,
                'total_pages':  paginator.page.paginator.num_pages,
                'current_page': paginator.page.number,
                'next':         paginator.get_next_link(),
                'previous':     paginator.get_previous_link(),
            }
        }, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = CustomerWriteSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            customer = serializer.save(created_by=request.user)
            return ok(
                'Customer created successfully',
                CustomerSerializer(customer, context={'request': request}).data,
                status.HTTP_201_CREATED
            )
        return err('Validation failed', serializer.errors)


# ---------------------------------------------------------------------------
# Retrieve + Update + Delete
# ---------------------------------------------------------------------------

class CustomerDetailView(APIView):
    """
    GET    /api/customers/{id}/
    PUT    /api/customers/{id}/
    DELETE /api/customers/{id}/
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def _get(self, pk):
        try:
            return Customer.objects.select_related('created_by').get(pk=pk)
        except Customer.DoesNotExist:
            return None

    def get(self, request, pk):
        customer = self._get(pk)
        if not customer:
            return err('Customer not found', http_status=status.HTTP_404_NOT_FOUND)
        return ok('Customer retrieved successfully',
                  CustomerSerializer(customer, context={'request': request}).data)

    def put(self, request, pk):
        customer = self._get(pk)
        if not customer:
            return err('Customer not found', http_status=status.HTTP_404_NOT_FOUND)
        serializer = CustomerWriteSerializer(
            customer, data=request.data, partial=True, context={'request': request}
        )
        if serializer.is_valid():
            customer = serializer.save()
            return ok('Customer updated successfully',
                      CustomerSerializer(customer, context={'request': request}).data)
        return err('Validation failed', serializer.errors)

    def delete(self, request, pk):
        customer = self._get(pk)
        if not customer:
            return err('Customer not found', http_status=status.HTTP_404_NOT_FOUND)
        name = customer.full_name
        customer.delete()
        return ok(f'Customer "{name}" deleted successfully', {})


# ---------------------------------------------------------------------------
# Quick status toggle
# ---------------------------------------------------------------------------

class CustomerStatusToggleView(APIView):
    """
    PATCH /api/customers/{id}/toggle-status/
    Toggles Active ↔ Inactive without needing the full PUT payload.
    """
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            customer = Customer.objects.get(pk=pk)
        except Customer.DoesNotExist:
            return err('Customer not found', http_status=status.HTTP_404_NOT_FOUND)

        customer.status = 'Inactive' if customer.status == 'Active' else 'Active'
        customer.save(update_fields=['status', 'updated_at'])
        return ok(
            f'Customer status changed to {customer.status}',
            {'id': customer.pk, 'status': customer.status}
        )
