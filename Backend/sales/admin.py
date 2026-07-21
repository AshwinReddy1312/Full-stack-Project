"""
sales/admin.py
--------------
Admin registration for SalesUpload and SalesRecord.
"""
from django.contrib import admin
from django.utils.html import format_html
from .models import SalesUpload, SalesRecord


class SalesRecordInline(admin.TabularInline):
    model = SalesRecord
    extra = 0
    readonly_fields = ('sale_date', 'product_name', 'customer_name', 'quantity', 'selling_price', 'total_amount', 'profit')
    can_delete = False
    max_num = 20
    show_change_link = True
    fields = ('sale_date', 'product_name', 'customer_name', 'quantity', 'selling_price', 'total_amount', 'profit')


@admin.register(SalesUpload)
class SalesUploadAdmin(admin.ModelAdmin):
    list_display  = ('upload_id', 'filename', 'status_badge', 'total_rows', 'imported_count', 'failed_count', 'duplicate_count', 'processing_time_display', 'uploaded_by', 'created_at')
    list_filter   = ('status', 'created_at')
    search_fields = ('filename', 'uploaded_by__email')
    ordering      = ('-created_at',)
    readonly_fields = ('upload_id', 'created_at', 'updated_at')
    inlines       = [SalesRecordInline]

    def status_badge(self, obj):
        colors = {
            'Pending':    '#ca8a04',
            'Processing': '#2563eb',
            'Completed':  '#16a34a',
            'Failed':     '#dc2626',
        }
        color = colors.get(obj.status, '#6b7280')
        return format_html(
            '<span style="color:{};font-weight:700;">{}</span>', color, obj.status
        )
    status_badge.short_description = 'Status'

    def processing_time_display(self, obj):
        return f'{obj.processing_time}s'
    processing_time_display.short_description = 'Time'


@admin.register(SalesRecord)
class SalesRecordAdmin(admin.ModelAdmin):
    list_display  = ('id', 'sale_date', 'product_name', 'customer_name', 'quantity', 'selling_price', 'total_amount', 'profit', 'profit_margin')
    list_filter   = ('sale_date', 'category')
    search_fields = ('product_name', 'customer_name')
    ordering      = ('-sale_date',)
    readonly_fields = ('profit', 'profit_margin', 'created_at')
    date_hierarchy  = 'sale_date'
