"""
ai_insights/urls.py
-------------------
Mounted at /api/ai/ in config/urls.py
"""
from django.urls import path
from .views import (
    GenerateInsightView, ReportListView, ReportDetailView, LatestReportView,
    ChatMessageView, ExecutiveSummaryView,
)

urlpatterns = [
    path('generate/',              GenerateInsightView.as_view(),   name='ai_generate'),
    path('reports/',               ReportListView.as_view(),         name='ai_report_list'),
    path('reports/latest/',        LatestReportView.as_view(),       name='ai_report_latest'),
    path('reports/<int:pk>/',      ReportDetailView.as_view(),       name='ai_report_detail'),
    # Chat
    path('chat/',                  ChatMessageView.as_view(),        name='ai_chat'),
    path('executive-summary/',     ExecutiveSummaryView.as_view(),   name='ai_executive_summary'),
]
