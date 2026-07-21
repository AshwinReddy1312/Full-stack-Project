"""
ai_insights/ai_engine.py
------------------------
Two responsibilities:
  1. build_data_summary()  – aggregates SalesRecord data into a compact
                             JSON summary to send to OpenAI (minimises tokens)
  2. generate_insights()   – calls OpenAI API with the summary and a
                             structured prompt, returns parsed JSON insights
"""
import json
from datetime import date, timedelta
from decimal import Decimal
from django.conf import settings
from django.db.models import Sum, Count, Avg, Max, Min
from django.db.models.functions import TruncMonth

from sales.models import SalesRecord


# ── Helpers ───────────────────────────────────────────────────────────────────

def _float(val, default=0.0):
    try:
        return round(float(val or default), 2)
    except (TypeError, ValueError):
        return default


def _get_queryset(period='30d'):
    qs = SalesRecord.objects.all()
    today = date.today()
    days_map = {'7d': 7, '30d': 30, '90d': 90, '180d': 180, '365d': 365}
    if period in days_map:
        qs = qs.filter(sale_date__gte=today - timedelta(days=days_map[period]))
    return qs


# ── Data Summary Builder ──────────────────────────────────────────────────────

def build_data_summary(period='30d'):
    """
    Aggregate SalesRecord data into a compact dict for the OpenAI prompt.
    Keeps token usage minimal while providing rich context.
    """
    qs = _get_queryset(period)
    total_records = qs.count()

    if total_records == 0:
        return {'error': 'no_data', 'period': period, 'total_records': 0}

    # ── Overall KPIs ─────────────────────────────────────────────
    agg = qs.aggregate(
        total_revenue=Sum('total_amount'),
        total_profit=Sum('profit'),
        total_orders=Count('id'),
        total_quantity=Sum('quantity'),
        avg_order_value=Avg('total_amount'),
        avg_profit_margin=Avg('profit_margin'),
        unique_customers=Count('customer_name', distinct=True),
        unique_products=Count('product_name', distinct=True),
    )

    # ── Top 5 Products ────────────────────────────────────────────
    top_products = list(
        qs.values('product_name', 'category')
          .annotate(revenue=Sum('total_amount'), profit=Sum('profit'), qty=Sum('quantity'))
          .order_by('-revenue')[:5]
    )

    # ── Top 5 Categories ─────────────────────────────────────────
    top_categories = list(
        qs.values('category')
          .annotate(revenue=Sum('total_amount'), profit=Sum('profit'), orders=Count('id'))
          .order_by('-revenue')[:5]
    )

    # ── Top 5 Customers ───────────────────────────────────────────
    top_customers = list(
        qs.values('customer_name')
          .annotate(spent=Sum('total_amount'), orders=Count('id'))
          .order_by('-spent')[:5]
    )

    # ── Monthly Trend (last 6 months) ─────────────────────────────
    monthly = list(
        qs.annotate(month=TruncMonth('sale_date'))
          .values('month')
          .annotate(revenue=Sum('total_amount'), profit=Sum('profit'), orders=Count('id'))
          .order_by('month')[:6]
    )

    # ── Low-profit products ───────────────────────────────────────
    low_margin = list(
        qs.values('product_name')
          .annotate(avg_margin=Avg('profit_margin'))
          .filter(avg_margin__lt=10)
          .order_by('avg_margin')[:3]
    )

    # ── Serialise (convert Decimal / date to JSON-safe types) ─────
    def serialise(obj):
        if isinstance(obj, Decimal):
            return float(round(obj, 2))
        if hasattr(obj, 'strftime'):
            return obj.strftime('%b %Y')
        return obj

    def clean(lst):
        return [{k: serialise(v) for k, v in row.items()} for row in lst]

    return {
        'period':           period,
        'total_records':    total_records,
        'kpis': {
            'total_revenue':    _float(agg['total_revenue']),
            'total_profit':     _float(agg['total_profit']),
            'total_orders':     agg['total_orders'] or 0,
            'total_quantity':   agg['total_quantity'] or 0,
            'avg_order_value':  _float(agg['avg_order_value']),
            'avg_profit_margin':_float(agg['avg_profit_margin']),
            'unique_customers': agg['unique_customers'] or 0,
            'unique_products':  agg['unique_products'] or 0,
        },
        'top_products':    clean(top_products),
        'top_categories':  clean(top_categories),
        'top_customers':   clean(top_customers),
        'monthly_trend':   clean(monthly),
        'low_margin_items':clean(low_margin),
    }


# ── OpenAI Prompt Builder ─────────────────────────────────────────────────────

SYSTEM_PROMPT = """You are an expert business analyst and strategic advisor.
You analyse business sales data and provide actionable insights, identify trends,
flag risks, and give prioritised recommendations.
Always respond in valid JSON — no markdown, no extra text, just pure JSON.
Be specific with numbers from the data. Be concise but insightful."""

def _build_user_prompt(summary, report_type):
    data_str = json.dumps(summary, indent=2)

    type_instructions = {
        'full': """Analyse ALL aspects of this business data and return a JSON object with these exact keys:
{
  "executive_summary": "2-3 sentence overview of overall business health",
  "revenue_insights": ["insight 1", "insight 2", "insight 3"],
  "product_insights": ["insight 1", "insight 2", "insight 3"],
  "customer_insights": ["insight 1", "insight 2"],
  "risk_alerts": [{"title": "...", "description": "...", "severity": "high/medium/low"}],
  "opportunities": [{"title": "...", "description": "...", "impact": "high/medium/low"}],
  "recommendations": [
    {"priority": 1, "title": "...", "action": "...", "expected_outcome": "...", "timeframe": "..."},
    {"priority": 2, "title": "...", "action": "...", "expected_outcome": "...", "timeframe": "..."},
    {"priority": 3, "title": "...", "action": "...", "expected_outcome": "...", "timeframe": "..."}
  ],
  "performance_score": <number 0-100>,
  "growth_potential": "high/medium/low",
  "key_metrics_analysis": "2-3 sentences about the most important numbers"
}""",

        'revenue': """Analyse the revenue data and return:
{
  "summary": "...",
  "revenue_trend": "growing/declining/stable with explanation",
  "best_performing_month": "...",
  "profit_margin_analysis": "...",
  "revenue_drivers": ["...", "..."],
  "revenue_risks": ["...", "..."],
  "recommendations": [{"priority":1,"title":"...","action":"..."}]
}""",

        'products': """Analyse product performance and return:
{
  "summary": "...",
  "star_products": [{"name":"...","reason":"..."}],
  "underperforming_products": [{"name":"...","issue":"...","suggestion":"..."}],
  "category_analysis": "...",
  "pricing_insights": "...",
  "inventory_suggestions": ["..."],
  "recommendations": [{"priority":1,"title":"...","action":"..."}]
}""",

        'customers': """Analyse customer data and return:
{
  "summary": "...",
  "customer_segments": "...",
  "top_customer_value": "...",
  "retention_insights": "...",
  "acquisition_suggestions": ["..."],
  "loyalty_opportunities": ["..."],
  "recommendations": [{"priority":1,"title":"...","action":"..."}]
}""",

        'recommendations': """Based on this data, provide ONLY strategic recommendations:
{
  "immediate_actions": [
    {"priority":1,"title":"...","action":"...","expected_outcome":"...","timeframe":"This week"}
  ],
  "short_term": [
    {"priority":1,"title":"...","action":"...","expected_outcome":"...","timeframe":"1 month"}
  ],
  "long_term": [
    {"priority":1,"title":"...","action":"...","expected_outcome":"...","timeframe":"3-6 months"}
  ],
  "key_focus_area": "...",
  "biggest_opportunity": "..."
}""",
    }

    instruction = type_instructions.get(report_type, type_instructions['full'])

    return f"""Here is the business data summary for period: {summary.get('period', 'N/A')}

{data_str}

{instruction}

Return ONLY the JSON object. No explanation, no markdown, no code blocks."""


# ── Main generate function ────────────────────────────────────────────────────

def generate_insights(period='30d', report_type='full'):
    """
    Build data summary → call Groq/OpenAI → return structured insights dict.
    Returns: { insights: dict, tokens_used: int, model: str, data_summary: dict }
    Raises: ValueError if no data, Exception if API call fails.
    """
    import openai

    api_key  = getattr(settings, 'OPENAI_API_KEY', None)
    base_url = getattr(settings, 'OPENAI_BASE_URL', None)
    model    = getattr(settings, 'OPENAI_MODEL', 'llama-3.1-8b-instant')

    if not api_key:
        raise ValueError('OPENAI_API_KEY is not configured in settings. Please add it to your .env file.')

    # Build data summary
    summary = build_data_summary(period)
    if summary.get('error') == 'no_data':
        raise ValueError('No sales data found for the selected period. Please import data first.')

    # Build client — works for both OpenAI and Groq
    client_kwargs = {'api_key': api_key}
    if base_url:
        client_kwargs['base_url'] = base_url

    client = openai.OpenAI(**client_kwargs)

    # Groq / Llama doesn't support response_format json_object on all models
    # so we instruct via the system prompt and parse manually
    response = client.chat.completions.create(
        model=model,
        messages=[
            {'role': 'system', 'content': SYSTEM_PROMPT},
            {'role': 'user',   'content': _build_user_prompt(summary, report_type)},
        ],
        temperature=0.3,
        max_tokens=2000,
    )

    raw_content = response.choices[0].message.content
    tokens_used = response.usage.total_tokens if response.usage else 0
    model_used  = response.model

    # Parse JSON — strip any markdown code fences the model might add
    cleaned = raw_content.strip()
    if cleaned.startswith('```'):
        cleaned = cleaned.split('\n', 1)[-1]  # remove ```json line
        cleaned = cleaned.rsplit('```', 1)[0]  # remove closing ```
        cleaned = cleaned.strip()

    # Find the JSON object within the response
    start = cleaned.find('{')
    end   = cleaned.rfind('}')
    if start != -1 and end != -1:
        cleaned = cleaned[start:end + 1]

    try:
        insights = json.loads(cleaned)
    except json.JSONDecodeError as e:
        raise ValueError(f'AI returned invalid JSON: {str(e)}. Raw: {raw_content[:200]}')

    return {
        'insights':     insights,
        'tokens_used':  tokens_used,
        'model':        model_used,
        'data_summary': summary,
    }
