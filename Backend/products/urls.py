"""
products/urls.py
----------------
URL patterns for the products app.

Mounted at /api/products/ in config/urls.py.
"""
from django.urls import path
from .views import (
    CategoryListCreateView,
    CategoryDetailView,
    ProductListCreateView,
    ProductDetailView,
)

urlpatterns = [
    # Categories
    path('categories/', CategoryListCreateView.as_view(), name='category_list_create'),
    path('categories/<int:pk>/', CategoryDetailView.as_view(), name='category_detail'),

    # Products
    path('', ProductListCreateView.as_view(), name='product_list_create'),
    path('<int:pk>/', ProductDetailView.as_view(), name='product_detail'),
]
