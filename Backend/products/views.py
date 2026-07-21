"""
products/views.py
-----------------
Category views  : CategoryListCreateView, CategoryDetailView
Product views   : ProductListCreateView, ProductDetailView

All responses follow the project-wide envelope:
  { "success": true/false, "message": "...", "data": {}, "errors": {} }

Search & filter handled by DjangoFilterBackend + SearchFilter + OrderingFilter.
Pagination is built-in via the custom ProductPagination class.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
import django_filters

from .models import Product, ProductCategory
from .serializers import (
    ProductCategorySerializer,
    ProductListSerializer,
    ProductWriteSerializer,
)
from .permissions import IsAdminOrManager


# ---------------------------------------------------------------------------
# Pagination
# ---------------------------------------------------------------------------

class ProductPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


# ---------------------------------------------------------------------------
# Django Filter class for Product
# ---------------------------------------------------------------------------

class ProductFilter(django_filters.FilterSet):
    category = django_filters.NumberFilter(field_name='category__id')
    status = django_filters.CharFilter(field_name='status', lookup_expr='iexact')
    min_price = django_filters.NumberFilter(field_name='selling_price', lookup_expr='gte')
    max_price = django_filters.NumberFilter(field_name='selling_price', lookup_expr='lte')
    low_stock = django_filters.BooleanFilter(method='filter_low_stock')

    class Meta:
        model = Product
        fields = ['category', 'status']

    def filter_low_stock(self, queryset, name, value):
        if value:
            from django.db.models import F
            return queryset.filter(stock_quantity__lte=F('minimum_stock'))
        return queryset


# ---------------------------------------------------------------------------
# Helper: consistent response envelope
# ---------------------------------------------------------------------------

def success_response(message, data, http_status=status.HTTP_200_OK):
    return Response({'success': True, 'message': message, 'data': data}, status=http_status)


def error_response(message, errors=None, http_status=status.HTTP_400_BAD_REQUEST):
    return Response({
        'success': False,
        'message': message,
        'data': {},
        'errors': errors or {},
    }, status=http_status)


# ---------------------------------------------------------------------------
# Category Views
# ---------------------------------------------------------------------------

class CategoryListCreateView(APIView):
    """
    GET  /api/products/categories/  – list all categories
    POST /api/products/categories/  – create (Admin/Manager only)
    """
    permission_classes = [IsAuthenticated, IsAdminOrManager]

    def get(self, request):
        categories = ProductCategory.objects.all()
        serializer = ProductCategorySerializer(categories, many=True)
        return success_response('Categories retrieved successfully', serializer.data)

    def post(self, request):
        serializer = ProductCategorySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return success_response(
                'Category created successfully',
                serializer.data,
                status.HTTP_201_CREATED
            )
        return error_response('Validation failed', serializer.errors)


class CategoryDetailView(APIView):
    """
    GET    /api/products/categories/{id}/
    PUT    /api/products/categories/{id}/
    DELETE /api/products/categories/{id}/
    """
    permission_classes = [IsAuthenticated, IsAdminOrManager]

    def _get_object(self, pk):
        try:
            return ProductCategory.objects.get(pk=pk)
        except ProductCategory.DoesNotExist:
            return None

    def get(self, request, pk):
        category = self._get_object(pk)
        if not category:
            return error_response('Category not found', http_status=status.HTTP_404_NOT_FOUND)
        serializer = ProductCategorySerializer(category)
        return success_response('Category retrieved successfully', serializer.data)

    def put(self, request, pk):
        category = self._get_object(pk)
        if not category:
            return error_response('Category not found', http_status=status.HTTP_404_NOT_FOUND)
        serializer = ProductCategorySerializer(category, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return success_response('Category updated successfully', serializer.data)
        return error_response('Validation failed', serializer.errors)

    def delete(self, request, pk):
        category = self._get_object(pk)
        if not category:
            return error_response('Category not found', http_status=status.HTTP_404_NOT_FOUND)
        # Prevent deletion if products are linked (model uses PROTECT but give a clean message)
        if category.products.exists():
            return error_response(
                'Cannot delete category with existing products. '
                'Re-assign or delete the products first.',
                http_status=status.HTTP_400_BAD_REQUEST
            )
        category.delete()
        return success_response('Category deleted successfully', {})


# ---------------------------------------------------------------------------
# Product Views
# ---------------------------------------------------------------------------

class ProductListCreateView(APIView):
    """
    GET  /api/products/  – paginated, searchable, filterable product list
    POST /api/products/  – create product (Admin/Manager only)
    """
    permission_classes = [IsAuthenticated, IsAdminOrManager]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        queryset = Product.objects.select_related('category', 'created_by').all()

        # --- Search: name or SKU ---
        search = request.query_params.get('search', '').strip()
        if search:
            from django.db.models import Q
            queryset = queryset.filter(
                Q(name__icontains=search) | Q(sku__icontains=search)
            )

        # --- Filter by category ---
        category_id = request.query_params.get('category')
        if category_id:
            queryset = queryset.filter(category__id=category_id)

        # --- Filter by status ---
        status_filter = request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status__iexact=status_filter)

        # --- Filter low stock ---
        low_stock = request.query_params.get('low_stock')
        if low_stock in ('true', '1'):
            from django.db.models import F
            queryset = queryset.filter(stock_quantity__lte=F('minimum_stock'))

        # --- Ordering ---
        ordering = request.query_params.get('ordering', '-created_at')
        allowed_orderings = [
            'selling_price', '-selling_price',
            'stock_quantity', '-stock_quantity',
            'name', '-name',
            'created_at', '-created_at',
        ]
        if ordering in allowed_orderings:
            queryset = queryset.order_by(ordering)

        # --- Pagination ---
        paginator = ProductPagination()
        page = paginator.paginate_queryset(queryset, request)
        serializer = ProductListSerializer(
            page, many=True, context={'request': request}
        )
        return Response({
            'success': True,
            'message': 'Products retrieved successfully',
            'data': {
                'results': serializer.data,
                'count': paginator.page.paginator.count,
                'next': paginator.get_next_link(),
                'previous': paginator.get_previous_link(),
                'total_pages': paginator.page.paginator.num_pages,
                'current_page': paginator.page.number,
            }
        }, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = ProductWriteSerializer(
            data=request.data, context={'request': request}
        )
        if serializer.is_valid():
            product = serializer.save(created_by=request.user)
            read_serializer = ProductListSerializer(product, context={'request': request})
            return success_response(
                'Product created successfully',
                read_serializer.data,
                status.HTTP_201_CREATED
            )
        return error_response('Validation failed', serializer.errors)


class ProductDetailView(APIView):
    """
    GET    /api/products/{id}/
    PUT    /api/products/{id}/
    DELETE /api/products/{id}/
    """
    permission_classes = [IsAuthenticated, IsAdminOrManager]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def _get_object(self, pk):
        try:
            return Product.objects.select_related('category', 'created_by').get(pk=pk)
        except Product.DoesNotExist:
            return None

    def get(self, request, pk):
        product = self._get_object(pk)
        if not product:
            return error_response('Product not found', http_status=status.HTTP_404_NOT_FOUND)
        serializer = ProductListSerializer(product, context={'request': request})
        return success_response('Product retrieved successfully', serializer.data)

    def put(self, request, pk):
        product = self._get_object(pk)
        if not product:
            return error_response('Product not found', http_status=status.HTTP_404_NOT_FOUND)
        serializer = ProductWriteSerializer(
            product, data=request.data, partial=True, context={'request': request}
        )
        if serializer.is_valid():
            product = serializer.save()
            read_serializer = ProductListSerializer(product, context={'request': request})
            return success_response('Product updated successfully', read_serializer.data)
        return error_response('Validation failed', serializer.errors)

    def delete(self, request, pk):
        product = self._get_object(pk)
        if not product:
            return error_response('Product not found', http_status=status.HTTP_404_NOT_FOUND)
        product.delete()
        return success_response('Product deleted successfully', {})
