"""
dashboard/urls.py
-----------------
Mounted at /api/dashboard/ in config/urls.py
"""
from django.urls import path
from .views import (
    DashboardSummaryView,
    RevenueTrendView,
    SalesByCategoryView,
    TopProductsView,
    TopCustomersView,
    RecentSalesView,
    MonthlySummaryView,
)

urlpatterns = [
    path('summary/',           DashboardSummaryView.as_view(),  name='dashboard_summary'),
    path('revenue-trend/',     RevenueTrendView.as_view(),      name='revenue_trend'),
    path('sales-by-category/', SalesByCategoryView.as_view(),  name='sales_by_category'),
    path('top-products/',      TopProductsView.as_view(),       name='top_products'),
    path('top-customers/',     TopCustomersView.as_view(),      name='top_customers'),
    path('recent-sales/',      RecentSalesView.as_view(),       name='recent_sales'),
    path('monthly-summary/',   MonthlySummaryView.as_view(),    name='monthly_summary'),
]
