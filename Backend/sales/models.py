"""
sales/models.py
---------------
SalesUpload  – tracks each CSV upload batch with status and summary
SalesRecord  – stores individual sales transactions from CSV data
               designed to power Dashboard, Reports, and AI Insights
"""
from django.db import models
from django.conf import settings
from products.models import Product
from customers.models import Customer


class SalesUpload(models.Model):
    """Tracks each CSV file upload batch."""

    class Status(models.TextChoices):
        PENDING    = 'Pending',    'Pending'        # uploaded, awaiting preview confirmation
        PROCESSING = 'Processing', 'Processing'     # actively importing
        COMPLETED  = 'Completed',  'Completed'      # successfully imported
        FAILED     = 'Failed',     'Failed'         # validation errors

    uploaded_by      = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sales_uploads')
    file             = models.FileField(upload_to='uploads/sales/')
    filename         = models.CharField(max_length=255)
    status           = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)

    # Summary metrics (populated after processing)
    total_rows       = models.PositiveIntegerField(default=0)
    imported_count   = models.PositiveIntegerField(default=0)
    failed_count     = models.PositiveIntegerField(default=0)
    duplicate_count  = models.PositiveIntegerField(default=0)
    processing_time  = models.FloatField(default=0.0, help_text='Processing time in seconds')

    # Error tracking
    error_log        = models.JSONField(default=list, blank=True, help_text='List of validation errors: [{row, column, error}, ...]')

    created_at       = models.DateTimeField(auto_now_add=True)
    updated_at       = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Sales Upload'
        verbose_name_plural = 'Sales Uploads'

    def __str__(self):
        return f'{self.filename} — {self.status} ({self.created_at.strftime("%Y-%m-%d %H:%M")})'

    @property
    def upload_id(self):
        """Human-readable upload ID: UPLOAD-00001"""
        return f'UPLOAD-{self.pk:05d}'


class SalesRecord(models.Model):
    """Individual sales transaction record extracted from CSV.
    This is the core analytical data consumed by Dashboard, Reports, and AI modules."""

    upload           = models.ForeignKey(SalesUpload, on_delete=models.CASCADE, related_name='records')
    
    # Core transaction data
    sale_date        = models.DateField()
    product          = models.ForeignKey(Product, on_delete=models.PROTECT, related_name='sales', null=True, blank=True)
    product_name     = models.CharField(max_length=255, help_text='Original product name from CSV')
    category         = models.CharField(max_length=100, blank=True, null=True)
    
    customer         = models.ForeignKey(Customer, on_delete=models.SET_NULL, related_name='purchases', null=True, blank=True)
    customer_name    = models.CharField(max_length=255, help_text='Original customer name from CSV')
    
    quantity         = models.PositiveIntegerField()
    cost_price       = models.DecimalField(max_digits=12, decimal_places=2)
    selling_price    = models.DecimalField(max_digits=12, decimal_places=2)
    total_amount     = models.DecimalField(max_digits=14, decimal_places=2)
    
    # Calculated fields
    profit           = models.DecimalField(max_digits=14, decimal_places=2, default=0, help_text='(selling_price - cost_price) * quantity')
    profit_margin    = models.DecimalField(max_digits=5, decimal_places=2, default=0, help_text='Profit margin percentage')

    # Audit
    created_at       = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-sale_date', '-created_at']
        verbose_name = 'Sales Record'
        verbose_name_plural = 'Sales Records'
        indexes = [
            models.Index(fields=['-sale_date']),
            models.Index(fields=['product', 'sale_date']),
            models.Index(fields=['customer', 'sale_date']),
        ]

    def __str__(self):
        return f'{self.product_name} — {self.quantity} units — {self.sale_date}'

    def save(self, *args, **kwargs):
        # Auto-calculate profit and margin before saving
        self.profit = (self.selling_price - self.cost_price) * self.quantity
        if self.cost_price > 0:
            self.profit_margin = ((self.selling_price - self.cost_price) / self.cost_price) * 100
        super().save(*args, **kwargs)
