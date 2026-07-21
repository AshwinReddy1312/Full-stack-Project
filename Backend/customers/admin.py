"""
customers/admin.py
------------------
Full-featured admin for Customer model.
"""
from django.contrib import admin
from django.utils.html import format_html
from .models import Customer


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = (
        'customer_id_display', 'thumbnail', 'full_name',
        'email', 'phone_number',
        'customer_type', 'city', 'status', 'created_at',
    )
    list_filter  = ('status', 'customer_type', 'gender', 'city', 'country', 'created_at')
    search_fields = ('first_name', 'last_name', 'email', 'phone_number', 'company_name')
    ordering      = ('-created_at',)
    readonly_fields = ('created_at', 'updated_at', 'created_by')

    fieldsets = (
        ('Personal', {
            'fields': ('first_name', 'last_name', 'gender', 'date_of_birth', 'profile_image', 'notes')
        }),
        ('Contact', {
            'fields': ('email', 'phone_number')
        }),
        ('Address', {
            'fields': ('address', 'city', 'state', 'country', 'postal_code')
        }),
        ('Business', {
            'fields': ('customer_type', 'company_name')
        }),
        ('Status & Audit', {
            'fields': ('status', 'created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )

    def customer_id_display(self, obj):
        return obj.customer_id
    customer_id_display.short_description = 'Customer ID'

    def thumbnail(self, obj):
        if obj.profile_image:
            return format_html(
                '<img src="{}" width="36" height="36" '
                'style="object-fit:cover;border-radius:50%;border:2px solid #e5e5e0;" />',
                obj.profile_image.url
            )
        initials = f'{obj.first_name[:1]}{obj.last_name[:1]}'.upper()
        return format_html(
            '<div style="width:36px;height:36px;border-radius:50%;background:#f5c518;'
            'display:flex;align-items:center;justify-content:center;'
            'font-weight:700;font-size:12px;color:#1a1a1a;">{}</div>',
            initials
        )
    thumbnail.short_description = ''

    def save_model(self, request, obj, form, change):
        if not obj.pk:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)
