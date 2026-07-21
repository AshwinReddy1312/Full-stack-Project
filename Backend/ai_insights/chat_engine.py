"""
ai_insights/chat_engine.py
--------------------------
SQLite-safe chat context builder.
Avoids Avg() on DecimalField and TruncMonth/TruncDate with USE_TZ.
All aggregations use only Sum, Count, Max, Min — safe on SQLite.
Margin calculations done in Python.
"""
from django.conf import settings
from django.db.models import Sum, Count, Max, Min
from collections import defaultdict


def _f(val, default=0.0):
    try:
        return round(float(val or default), 2)
    except (TypeError, ValueError):
        return default


def _fmt(val):
    try:
        v = float(val or 0)
        if v >= 10_000_000:
            return '₹{:.2f}Cr'.format(v / 10_000_000)
        if v >= 100_000:
            return '₹{:.2f}L'.format(v / 100_000)
        return '₹{:,.2f}'.format(v)
    except Exception:
        return '₹0.00'


def _get_qs(user=None):
    from sales.models import SalesRecord
    qs = SalesRecord.objects.all()
    if user:
        qs = qs.filter(upload__uploaded_by=user)
    return qs


def build_chat_context(user=None):
    """
    Build a full business data context string from SalesRecord.
    Returns: (context_str: str, has_data: bool)
    """
    qs = _get_qs(user)
    total_records = qs.count()
    if total_records == 0:
        return None, False

    # ── KPIs — safe aggregations only ────────────────────────────────────
    agg = qs.aggregate(
        total_revenue=Sum('total_amount'),
        total_profit=Sum('profit'),
        total_orders=Count('id'),
        total_qty=Sum('quantity'),
        unique_customers=Count('customer_name', distinct=True),
        unique_products=Count('product_name', distinct=True),
        first_sale=Min('sale_date'),
        last_sale=Max('sale_date'),
    )

    total_revenue = _f(agg['total_revenue'])
    total_profit  = _f(agg['total_profit'])
    total_orders  = agg['total_orders'] or 0
    avg_order     = round(total_revenue / total_orders, 2) if total_orders else 0
    avg_margin    = round((total_profit / total_revenue) * 100, 2) if total_revenue else 0

    # ── Monthly breakdown — Python-level grouping ─────────────────────────
    raw_monthly = qs.values('sale_date', 'total_amount', 'profit')
    monthly_map = defaultdict(lambda: {'revenue': 0.0, 'profit': 0.0, 'orders': 0})
    for r in raw_monthly:
        d = r['sale_date']
        key = '{:04d}-{:02d}'.format(d.year, d.month)
        monthly_map[key]['revenue'] += _f(r['total_amount'])
        monthly_map[key]['profit']  += _f(r['profit'])
        monthly_map[key]['orders']  += 1

    monthly = [
        {'month': k, **v}
        for k, v in sorted(monthly_map.items())
    ]

    best_month  = max(monthly, key=lambda x: x['revenue']) if monthly else None
    worst_month = min(monthly, key=lambda x: x['revenue']) if monthly else None

    def mlabel(key):
        from datetime import datetime
        try:
            return datetime.strptime(key, '%Y-%m').strftime('%b %Y')
        except Exception:
            return key

    monthly_lines = [
        '  {}: Revenue={}, Profit={}, Orders={}'.format(
            mlabel(m['month']), _fmt(m['revenue']), _fmt(m['profit']), m['orders']
        )
        for m in monthly
    ]

    trend_lines = []
    for i in range(1, len(monthly)):
        prev = monthly[i-1]['revenue']
        curr = monthly[i]['revenue']
        if prev > 0:
            g = ((curr - prev) / prev) * 100
            trend_lines.append('  {} vs {}: {:.1f}% {}'.format(
                mlabel(monthly[i]['month']), mlabel(monthly[i-1]['month']),
                abs(g), 'growth' if g >= 0 else 'decline',
            ))

    # ── Top products — no Avg() on DecimalField ───────────────────────────
    raw_products = qs.values('product_name', 'category').annotate(
        revenue=Sum('total_amount'),
        profit=Sum('profit'),
        qty=Sum('quantity'),
        orders=Count('id'),
        cost_sum=Sum('cost_price'),
        sell_sum=Sum('selling_price'),
    ).order_by('-revenue')[:10]

    product_lines = []
    for i, p in enumerate(list(raw_products), 1):
        cost  = _f(p['cost_sum'])
        sell  = _f(p['sell_sum'])
        margin = round(((sell - cost) / cost) * 100, 1) if cost > 0 else 0
        product_lines.append(
            '  {}. {} ({}): Revenue={}, Profit={}, Qty={}, Margin={:.1f}%'.format(
                i, p['product_name'], p['category'] or 'Uncategorised',
                _fmt(p['revenue']), _fmt(p['profit']), p['qty'], margin,
            )
        )

    # ── Low performers ────────────────────────────────────────────────────
    low_products = list(
        qs.values('product_name').annotate(
            revenue=Sum('total_amount'),
            qty=Sum('quantity'),
            cost_sum=Sum('cost_price'),
            sell_sum=Sum('selling_price'),
        ).order_by('revenue')[:5]
    )
    low_lines = []
    for p in low_products:
        cost  = _f(p['cost_sum'])
        sell  = _f(p['sell_sum'])
        margin = round(((sell - cost) / cost) * 100, 1) if cost > 0 else 0
        low_lines.append('  {}: Revenue={}, Qty={}, Margin={:.1f}%'.format(
            p['product_name'], _fmt(p['revenue']), p['qty'], margin,
        ))

    # ── Categories ────────────────────────────────────────────────────────
    categories = list(
        qs.values('category').annotate(
            revenue=Sum('total_amount'),
            profit=Sum('profit'),
            orders=Count('id'),
        ).order_by('-revenue')
    )
    cat_lines = [
        '  {}: Revenue={}, Profit={}, Orders={}'.format(
            c['category'] or 'Uncategorised', _fmt(c['revenue']), _fmt(c['profit']), c['orders']
        )
        for c in categories
    ]

    # ── Top customers ─────────────────────────────────────────────────────
    top_customers = list(
        qs.values('customer_name').annotate(
            spent=Sum('total_amount'),
            orders=Count('id'),
        ).order_by('-spent')[:10]
    )
    cust_lines = [
        '  {}. {}: Spent={}, Orders={}'.format(
            i, c['customer_name'], _fmt(c['spent']), c['orders']
        )
        for i, c in enumerate(top_customers, 1)
    ]

    # ── Repeat customers ──────────────────────────────────────────────────
    repeat_customers = list(
        qs.values('customer_name').annotate(orders=Count('id'))
          .filter(orders__gt=1).order_by('-orders')[:5]
    )
    repeat_lines = [
        '  {}: {} orders'.format(c['customer_name'], c['orders'])
        for c in repeat_customers
    ]

    # ── Peak day — Python grouping ────────────────────────────────────────
    daily_map = defaultdict(float)
    for r in qs.values('sale_date', 'total_amount'):
        daily_map[str(r['sale_date'])] += _f(r['total_amount'])
    peak_day = max(daily_map.items(), key=lambda x: x[1]) if daily_map else None

    # ── Build context string ──────────────────────────────────────────────
    context = """=== BUSINESS DATA CONTEXT ===
You are an AI Business Analyst. Answer ONLY using the data provided below.
Cite specific numbers. Be concise and professional.
If a question cannot be answered from this data, say so politely.

--- OVERVIEW ---
Date Range: {first} to {last}
Total Transactions: {total:,}
Unique Products: {up}
Unique Customers: {uc}

--- KPIs ---
Total Revenue: {rev}
Total Profit: {profit}
Total Orders: {orders:,}
Total Quantity Sold: {qty:,}
Average Order Value: {aov}
Overall Profit Margin: {margin:.1f}%

--- MONTHLY PERFORMANCE ---
{monthly}

--- BEST MONTH ---
{best}

--- WORST MONTH ---
{worst}

--- MOM GROWTH TREND ---
{trend}

--- TOP 10 PRODUCTS BY REVENUE ---
{products}

--- LOWEST 5 PRODUCTS ---
{low}

--- SALES BY CATEGORY ---
{cats}

--- TOP 10 CUSTOMERS ---
{custs}

--- REPEAT CUSTOMERS ---
{repeats}

--- PEAK SALES DAY ---
{peak}
=== END OF DATA ===
""".format(
        first=str(agg['first_sale']) if agg['first_sale'] else 'N/A',
        last=str(agg['last_sale'])   if agg['last_sale']  else 'N/A',
        total=total_records,
        up=agg['unique_products'] or 0,
        uc=agg['unique_customers'] or 0,
        rev=_fmt(total_revenue),
        profit=_fmt(total_profit),
        orders=total_orders,
        qty=agg['total_qty'] or 0,
        aov=_fmt(avg_order),
        margin=avg_margin,
        monthly='\n'.join(monthly_lines) or 'No data.',
        best='{}: Revenue={}, Orders={}'.format(
            mlabel(best_month['month']), _fmt(best_month['revenue']), best_month['orders']
        ) if best_month else 'N/A',
        worst='{}: Revenue={}, Orders={}'.format(
            mlabel(worst_month['month']), _fmt(worst_month['revenue']), worst_month['orders']
        ) if worst_month else 'N/A',
        trend='\n'.join(trend_lines) or 'Not enough months to compare.',
        products='\n'.join(product_lines) or 'No data.',
        low='\n'.join(low_lines) or 'No data.',
        cats='\n'.join(cat_lines) or 'No data.',
        custs='\n'.join(cust_lines) or 'No data.',
        repeats='\n'.join(repeat_lines) or 'None found.',
        peak='{} — Revenue: {}'.format(peak_day[0], _fmt(peak_day[1])) if peak_day else 'N/A',
    )

    return context, True


def chat_with_data(messages, user=None):
    """
    Send conversation to AI with full business context.
    Returns: { reply: str, has_data: bool }
    """
    import openai

    api_key  = getattr(settings, 'OPENAI_API_KEY', None)
    base_url = getattr(settings, 'OPENAI_BASE_URL', None)
    model    = getattr(settings, 'OPENAI_MODEL', 'llama-3.1-8b-instant')

    if not api_key:
        return {'reply': 'AI is not configured. Please set OPENAI_API_KEY in .env.', 'has_data': False}

    context, has_data = build_chat_context(user=user)

    if not has_data:
        return {
            'reply': 'No business data available. Please upload a CSV file first.',
            'has_data': False,
        }

    system_prompt = (
        context
        + '\nYou are an expert AI Business Analyst. Answer questions from the data above.\n'
        + 'Rules:\n'
        + '- Answer ONLY from the data. Cite exact numbers.\n'
        + '- For forecasts, use the actual trend data.\n'
        + '- Be concise and professional.\n'
        + '- Use Indian number formatting (₹4,25,000).\n'
        + '- If you cannot answer from data, say: "I couldn\'t find enough information in the uploaded dataset to answer that."\n'
    )

    client_kwargs = {'api_key': api_key}
    if base_url:
        client_kwargs['base_url'] = base_url
    client = openai.OpenAI(**client_kwargs)

    api_messages = [{'role': 'system', 'content': system_prompt}]
    api_messages.extend(messages[-20:])

    response = client.chat.completions.create(
        model=model,
        messages=api_messages,
        temperature=0.3,
        max_tokens=1000,
    )

    return {'reply': response.choices[0].message.content.strip(), 'has_data': True}


def generate_executive_summary(user=None):
    return chat_with_data(
        messages=[{'role': 'user', 'content': (
            'Generate an executive business summary with these sections:\n'
            '1. Total Revenue & Profit\n'
            '2. Best Selling Product\n'
            '3. Top Customer\n'
            '4. Best and Worst Month\n'
            '5. Overall Business Health\n'
            '6. Three specific recommendations\n'
            'Use exact numbers from the data.'
        )}],
        user=user,
    )
