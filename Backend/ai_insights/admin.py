from django.contrib import admin
from django.utils.html import format_html
from .models import AIInsightReport


@admin.register(AIInsightReport)
class AIInsightReportAdmin(admin.ModelAdmin):
    list_display  = ('report_id', 'report_type', 'period', 'status_badge', 'tokens_used', 'model_used', 'requested_by', 'created_at')
    list_filter   = ('status', 'report_type', 'period', 'created_at')
    search_fields = ('requested_by__email',)
    ordering      = ('-created_at',)
    readonly_fields = ('report_id', 'tokens_used', 'model_used', 'data_summary', 'created_at', 'updated_at')

    def status_badge(self, obj):
        colors = {'pending': '#ca8a04', 'completed': '#16a34a', 'failed': '#dc2626'}
        color  = colors.get(obj.status, '#6b7280')
        return format_html('<span style="color:{};font-weight:700;">{}</span>', color, obj.status.title())
    status_badge.short_description = 'Status'
