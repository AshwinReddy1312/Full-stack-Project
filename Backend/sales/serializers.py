"""
sales/serializers.py
--------------------
SalesUploadSerializer   – list/detail view of upload batches
SalesRecordSerializer   – individual record (used in preview + stored data)
"""
from rest_framework import serializers
from .models import SalesUpload, SalesRecord


class SalesRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = SalesRecord
        fields = (
            'id', 'sale_date', 'product_name', 'category',
            'customer_name', 'quantity',
            'cost_price', 'selling_price', 'total_amount',
            'profit', 'profit_margin', 'created_at',
        )


class SalesUploadSerializer(serializers.ModelSerializer):
    upload_id      = serializers.CharField(read_only=True)
    uploaded_by_name = serializers.SerializerMethodField()
    success_rate   = serializers.SerializerMethodField()

    class Meta:
        model = SalesUpload
        fields = (
            'id', 'upload_id', 'filename', 'status',
            'total_rows', 'imported_count', 'failed_count', 'duplicate_count',
            'processing_time', 'error_log',
            'uploaded_by', 'uploaded_by_name', 'success_rate',
            'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'upload_id', 'created_at', 'updated_at')

    def get_uploaded_by_name(self, obj):
        if obj.uploaded_by:
            name = f'{obj.uploaded_by.first_name} {obj.uploaded_by.last_name}'.strip()
            return name or obj.uploaded_by.email
        return None

    def get_success_rate(self, obj):
        if obj.total_rows == 0:
            return 0
        return round((obj.imported_count / obj.total_rows) * 100, 1)
