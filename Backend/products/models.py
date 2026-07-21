"""
products/models.py
------------------
Defines ProductCategory and Product models.
ProductCategory is a simple lookup table.
Product holds the full product record including FK to category and created_by user.
"""
from django.db import models
from django.conf import settings


class ProductCategory(models.Model):
    """Lookup table for product categories (e.g. Electronics, Apparel)."""
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Product Category'
        verbose_name_plural = 'Product Categories'
        ordering = ['name']

    def __str__(self):
        return self.name


class Product(models.Model):
    """Full product record with pricing, stock, image and audit fields."""

    class Status(models.TextChoices):
        ACTIVE = 'Active', 'Active'
        INACTIVE = 'Inactive', 'Inactive'

    # Core identity
    name = models.CharField(max_length=255)
    sku = models.CharField(max_length=100, unique=True)
    barcode = models.CharField(max_length=100, blank=True, null=True)
    description = models.TextField(blank=True, null=True)

    # Relations
    category = models.ForeignKey(
        ProductCategory,
        on_delete=models.PROTECT,       # prevent accidental category deletion
        related_name='products'
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_products'
    )

    # Pricing
    cost_price = models.DecimalField(max_digits=12, decimal_places=2)
    selling_price = models.DecimalField(max_digits=12, decimal_places=2)

    # Stock
    stock_quantity = models.PositiveIntegerField(default=0)
    minimum_stock = models.PositiveIntegerField(default=0)

    # Image
    product_image = models.ImageField(
        upload_to='products/',
        blank=True,
        null=True
    )

    # Status
    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.ACTIVE
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Product'
        verbose_name_plural = 'Products'

    def __str__(self):
        return f'{self.name} ({self.sku})'

    @property
    def is_low_stock(self):
        """True when current stock is at or below the minimum threshold."""
        return self.stock_quantity <= self.minimum_stock
