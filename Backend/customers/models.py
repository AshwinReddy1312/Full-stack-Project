"""
customers/models.py
-------------------
Customer model with all personal, contact, address and business fields.
Designed to be linked to Sales, Reports, AI Insights and Purchase History
in future stages via ForeignKey references to this model.
"""
from django.db import models
from django.conf import settings


class Customer(models.Model):

    class Gender(models.TextChoices):
        MALE        = 'Male',        'Male'
        FEMALE      = 'Female',      'Female'
        OTHER       = 'Other',       'Other'
        PREFER_NOT  = 'Prefer not to say', 'Prefer not to say'

    class CustomerType(models.TextChoices):
        INDIVIDUAL = 'Individual', 'Individual'
        BUSINESS   = 'Business',   'Business'

    class Status(models.TextChoices):
        ACTIVE   = 'Active',   'Active'
        INACTIVE = 'Inactive', 'Inactive'

    # ── Personal ────────────────────────────────────────────────
    first_name    = models.CharField(max_length=100)
    last_name     = models.CharField(max_length=100)
    gender        = models.CharField(max_length=20, choices=Gender.choices, blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)
    profile_image = models.ImageField(upload_to='customers/', blank=True, null=True)
    notes         = models.TextField(blank=True, null=True)

    # ── Contact ─────────────────────────────────────────────────
    email        = models.EmailField(unique=True)
    phone_number = models.CharField(max_length=20, unique=True)

    # ── Address ─────────────────────────────────────────────────
    address     = models.TextField(blank=True, null=True)
    city        = models.CharField(max_length=100, blank=True, null=True)
    state       = models.CharField(max_length=100, blank=True, null=True)
    country     = models.CharField(max_length=100, blank=True, null=True)
    postal_code = models.CharField(max_length=20, blank=True, null=True)

    # ── Business ────────────────────────────────────────────────
    customer_type = models.CharField(
        max_length=20, choices=CustomerType.choices,
        default=CustomerType.INDIVIDUAL
    )
    company_name = models.CharField(max_length=200, blank=True, null=True)

    # ── Status & audit ──────────────────────────────────────────
    status     = models.CharField(max_length=10, choices=Status.choices, default=Status.ACTIVE)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL, null=True, related_name='created_customers'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Customer'
        verbose_name_plural = 'Customers'

    def __str__(self):
        return f'{self.first_name} {self.last_name} ({self.email})'

    @property
    def full_name(self):
        return f'{self.first_name} {self.last_name}'.strip()

    @property
    def customer_id(self):
        """Human-readable customer ID: CUS-00001"""
        return f'CUS-{self.pk:05d}'
