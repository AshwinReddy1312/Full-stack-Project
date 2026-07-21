"""
products/admin.py
-----------------
Registers ProductCategory and Product in Django Admin with
search, filters, ordering and list_display configured.
"""
from django.contrib import admin
from django.utils.html import format_html
from .models import Product, ProductCategory


@admin.register(ProductCategory)
class ProductCategoryAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'product_count', 'created_at')
    search_fields = ('name',)
    ordering = ('name',)

    def product_count(self, obj):
        return obj.products.count()
    product_count.short_description = 'Products'


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'thumbnail', 'name', 'sku', 'category',
        'cost_price', 'selling_price',
        'stock_quantity', 'minimum_stock', 'status',
        'created_by', 'created_at',
    )
    list_filter = ('status', 'category', 'created_at')
    search_fields = ('name', 'sku', 'barcode')
    ordering = ('-created_at',)
    readonly_fields = ('created_at', 'updated_at', 'created_by')
    autocomplete_fields = ('category',)

    fieldsets = (
        ('Basic Info', {
            'fields': ('name', 'sku', 'barcode', 'description', 'category', 'status')
        }),
        ('Pricing', {
            'fields': ('cost_price', 'selling_price')
        }),
        ('Stock', {
            'fields': ('stock_quantity', 'minimum_stock')
        }),
        ('Media', {
            'fields': ('product_image',)
        }),
        ('Audit', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )

    def thumbnail(self, obj):
        if obj.product_image:
            return format_html(
                '<img src="{}" width="40" height="40" style="object-fit:cover;border-radius:4px;" />',
                obj.product_image.url
            )
        return '—'
    thumbnail.short_description = 'Image'

    def save_model(self, request, obj, form, change):
        # Auto-assign created_by on first save
        if not obj.pk:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)
