"""
customers/urls.py
-----------------
Mounted at /api/customers/ in config/urls.py
"""
from django.urls import path
from .views import CustomerListCreateView, CustomerDetailView, CustomerStatusToggleView

urlpatterns = [
    path('',                         CustomerListCreateView.as_view(), name='customer_list_create'),
    path('<int:pk>/',                CustomerDetailView.as_view(),     name='customer_detail'),
    path('<int:pk>/toggle-status/',  CustomerStatusToggleView.as_view(), name='customer_toggle_status'),
]
