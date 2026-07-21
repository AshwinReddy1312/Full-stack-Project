"""
ai_insights/models.py
---------------------
AIInsightReport – stores each AI-generated analysis report.
One report is generated per request and cached for 24 hours
so we don't make unnecessary OpenAI API calls.
"""
from django.db import models
from django.conf import settings


class AIInsightReport(models.Model):
    """Stores a complete AI-generated business insight report."""

    class ReportType(models.TextChoices):
        FULL          = 'full',          'Full Business Analysis'
        REVENUE       = 'revenue',       'Revenue Analysis'
        PRODUCTS      = 'products',      'Product Performance'
        CUSTOMERS     = 'customers',     'Customer Insights'
        RECOMMENDATIONS = 'recommendations', 'Business Recommendations'

    class Status(models.TextChoices):
        PENDING   = 'pending',   'Pending'
        COMPLETED = 'completed', 'Completed'
        FAILED    = 'failed',    'Failed'

    # Who requested it
    requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='ai_reports'
    )

    # Report metadata
    report_type  = models.CharField(max_length=20, choices=ReportType.choices, default=ReportType.FULL)
    period       = models.CharField(max_length=10, default='30d', help_text='e.g. 7d, 30d, 90d, all')
    status       = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)

    # The data summary sent to OpenAI (stored for debugging / audit)
    data_summary = models.JSONField(default=dict, blank=True)

    # OpenAI response — structured JSON
    insights     = models.JSONField(default=dict, blank=True,
                                    help_text='Structured insights returned by OpenAI')

    # Token usage tracking
    tokens_used  = models.PositiveIntegerField(default=0)
    model_used   = models.CharField(max_length=50, default='gpt-4o-mini')

    # Error message if failed
    error        = models.TextField(blank=True, null=True)

    # Timestamps
    created_at   = models.DateTimeField(auto_now_add=True)
    updated_at   = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'AI Insight Report'
        verbose_name_plural = 'AI Insight Reports'

    def __str__(self):
        return f'{self.get_report_type_display()} — {self.period} — {self.status} ({self.created_at.strftime("%Y-%m-%d %H:%M")})'

    @property
    def report_id(self):
        return f'AI-{self.pk:05d}'
