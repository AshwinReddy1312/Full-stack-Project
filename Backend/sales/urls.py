"""
sales/urls.py
-------------
Mounted at /api/sales/ in config/urls.py
"""
from django.urls import path
from .views import (
    CSVUploadView,
    CSVConfirmView,
    UploadListView,
    UploadDetailView,
    UploadErrorsView,
)

urlpatterns = [
    # Upload & process
    path('upload/',                    CSVUploadView.as_view(),    name='csv_upload'),
    path('upload/<int:pk>/confirm/',   CSVConfirmView.as_view(),   name='csv_confirm'),

    # History
    path('uploads/',                   UploadListView.as_view(),   name='upload_list'),
    path('uploads/<int:pk>/',          UploadDetailView.as_view(), name='upload_detail'),
    path('uploads/<int:pk>/errors/',   UploadErrorsView.as_view(), name='upload_errors'),
]
