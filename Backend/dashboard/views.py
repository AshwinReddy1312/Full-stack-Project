"""
dashboard/views.py
------------------
All analytics endpoints — powered entirely by SalesRecord data.

Endpoints:
  GET /api/dashboard/summary/          – KPI cards (revenue, profit, orders, customers)
  GET /api/dashboard/revenue-trend/    – Daily / monthly revenue over time
  GET /api/dashboard/sales-by-category/ – Revenue + quantity by product category
  GET /api/dashboard/top-products/     – Top N products by revenue / quantity
  GET /api/dashboard/top-customers/    – Top N customers by spend
  GET /api/dashboard/recent-sales/     – Latest 10 sales transactions
  GET /api/dashboard/monthly-summary/  – Month-by-month aggregated table

All endpoints accept optional query params:
  ?date_from=YYYY-MM-DD
  ?date_to=YYYY-MM-DD
  ?period=7d | 30d | 90d | 365d | all  (shorthand, overrides date_from/to)
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from django.db.models import (
    Sum, Count, Avg, Max, Min, F, Q,
    DecimalField, ExpressionWrapper
)
from django.db.models.functions import TruncDate, TruncMonth, TruncWeek
from django.utils import timezone
from datetime import timedelta, date
from decimal import Decimal

from sales.models import SalesRecord
from products.models import Product
from customers.models import Customer


# ── Helpers ───────────────────────────────────────────────────────────────────

def ok(data):
    return Response({'success': True, 'data': data}, status=status.HTTP_200_OK)


def _apply_date_filter(qs, request):
    """Apply date_from / date_to / period filters to a SalesRecord queryset."""
    period    = request.query_params.get('period', 'all')
    date_from = request.query_params.get('date_from')
    date_to   = request.query_params.get('date_to')

    today = date.today()

    if period != 'all':
        days_map = {'7d': 7, '30d': 30, '90d': 90, '180d': 180, '365d': 365}
        days = days_map.get(period, 30)
        qs = qs.filter(sale_date__gte=today - timedelta(days=days))
    else:
        if date_from:
            qs = qs.filter(sale_date__gte=date_from)
        if date_to:
            qs = qs.filter(sale_date__lte=date_to)

    return qs


def _pct_change(current, previous):
    """Calculate percentage change between two values."""
    if not previous or previous == 0:
        return None
    return round(((current - previous) / abs(previous)) * 100, 1)


def _format_decimal(value):
    if value is None:
        return 0.0
    return float(round(Decimal(str(value)), 2))


# ── Views ─────────────────────────────────────────────────────────────────────

class DashboardSummaryView(APIView):
    """
    GET /api/dashboard/summary/
    Returns KPI cards: total revenue, total profit, total orders,
    unique customers, avg order value, best selling product.
    Also includes comparison with previous equal period for trend arrows.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = _apply_date_filter(SalesRecord.objects.all(), request)

        # Current period aggregates
        agg = qs.aggregate(
            total_revenue=Sum('total_amount'),
            total_profit=Sum('profit'),
            total_orders=Count('id'),
            total_quantity=Sum('quantity'),
            avg_order_value=Avg('total_amount'),
            unique_customers=Count('customer_name', distinct=True),
            unique_products=Count('product_name', distinct=True),
        )

        # Previous equal period for comparison
        period = request.query_params.get('period', '30d')
        days_map = {'7d': 7, '30d': 30, '90d': 90, '180d': 180, '365d': 365}
        days = days_map.get(period, 30)
        today = date.today()
        prev_from = today - timedelta(days=days * 2)
        prev_to   = today - timedelta(days=days)

        prev_qs = SalesRecord.objects.filter(sale_date__gte=prev_from, sale_date__lt=prev_to)
        prev    = prev_qs.aggregate(
            total_revenue=Sum('total_amount'),
            total_profit=Sum('profit'),
            total_orders=Count('id'),
        )

        cur_rev  = _format_decimal(agg['total_revenue'])
        cur_prof = _format_decimal(agg['total_profit'])
        cur_ord  = agg['total_orders'] or 0
        prev_rev = _format_decimal(prev['total_revenue'])
        prev_pro = _format_decimal(prev['total_profit'])
        prev_ord = prev['total_orders'] or 0

        # Best selling product in period
        best_product = (
            qs.values('product_name')
              .annotate(total=Sum('total_amount'))
              .order_by('-total')
              .first()
        )

        # Best category
        best_category = (
            qs.values('category')
              .annotate(total=Sum('total_amount'))
              .order_by('-total')
              .first()
        )

        # Last sale date
        last_sale = qs.aggregate(last=Max('sale_date'))['last']

        return ok({
            'total_revenue':       cur_rev,
            'total_profit':        cur_prof,
            'total_orders':        cur_ord,
            'total_quantity':      agg['total_quantity'] or 0,
            'avg_order_value':     _format_decimal(agg['avg_order_value']),
            'unique_customers':    agg['unique_customers'] or 0,
            'unique_products':     agg['unique_products'] or 0,
            'best_product':        best_product['product_name'] if best_product else None,
            'best_category':       best_category['category'] if best_category else None,
            'last_sale_date':      str(last_sale) if last_sale else None,
            'revenue_change_pct':  _pct_change(cur_rev, prev_rev),
            'profit_change_pct':   _pct_change(cur_prof, prev_pro),
            'orders_change_pct':   _pct_change(cur_ord, prev_ord),
        })


class RevenueTrendView(APIView):
    """
    GET /api/dashboard/revenue-trend/
    Returns daily or monthly revenue + profit over time for the line/area chart.
    ?granularity=daily|monthly|weekly  (default: daily for ≤90d, monthly otherwise)
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs          = _apply_date_filter(SalesRecord.objects.all(), request)
        granularity = request.query_params.get('granularity', 'auto')

        # Auto-detect granularity
        if granularity == 'auto':
            period = request.query_params.get('period', '30d')
            granularity = 'monthly' if period in ('365d', 'all') else 'daily'

        if granularity == 'monthly':
            qs = qs.annotate(period=TruncMonth('sale_date'))
        elif granularity == 'weekly':
            qs = qs.annotate(period=TruncWeek('sale_date'))
        else:
            qs = qs.annotate(period=TruncDate('sale_date'))

        data = (
            qs.values('period')
              .annotate(
                  revenue=Sum('total_amount'),
                  profit=Sum('profit'),
                  orders=Count('id'),
                  quantity=Sum('quantity'),
              )
              .order_by('period')
        )

        trend = [
            {
                'date':     str(row['period'].date() if hasattr(row['period'], 'date') else row['period']),
                'revenue':  _format_decimal(row['revenue']),
                'profit':   _format_decimal(row['profit']),
                'orders':   row['orders'],
                'quantity': row['quantity'],
            }
            for row in data
        ]

        return ok({'trend': trend, 'granularity': granularity})


class SalesByCategoryView(APIView):
    """
    GET /api/dashboard/sales-by-category/
    Returns revenue, profit, quantity, order count per category.
    Used for pie chart and bar chart.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = _apply_date_filter(SalesRecord.objects.all(), request)

        data = (
            qs.values('category')
              .annotate(
                  revenue=Sum('total_amount'),
                  profit=Sum('profit'),
                  quantity=Sum('quantity'),
                  orders=Count('id'),
              )
              .order_by('-revenue')
        )

        total_rev = sum(_format_decimal(r['revenue']) for r in data)

        categories = [
            {
                'category':   row['category'] or 'Uncategorised',
                'revenue':    _format_decimal(row['revenue']),
                'profit':     _format_decimal(row['profit']),
                'quantity':   row['quantity'],
                'orders':     row['orders'],
                'pct':        round((_format_decimal(row['revenue']) / total_rev * 100), 1) if total_rev else 0,
            }
            for row in data
        ]

        return ok({'categories': categories, 'total_revenue': total_rev})


class TopProductsView(APIView):
    """
    GET /api/dashboard/top-products/?limit=10&sort=revenue|quantity|profit
    Returns top N products ranked by the chosen metric.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs    = _apply_date_filter(SalesRecord.objects.all(), request)
        limit = int(request.query_params.get('limit', 10))
        sort  = request.query_params.get('sort', 'revenue')

        sort_field = '-revenue' if sort == 'revenue' else ('-quantity' if sort == 'quantity' else '-profit')

        data = (
            qs.values('product_name', 'category')
              .annotate(
                  revenue=Sum('total_amount'),
                  profit=Sum('profit'),
                  quantity=Sum('quantity'),
                  orders=Count('id'),
                  avg_price=Avg('selling_price'),
              )
              .order_by(sort_field)[:limit]
        )

        products = [
            {
                'product_name': row['product_name'],
                'category':     row['category'] or 'Uncategorised',
                'revenue':      _format_decimal(row['revenue']),
                'profit':       _format_decimal(row['profit']),
                'quantity':     row['quantity'],
                'orders':       row['orders'],
                'avg_price':    _format_decimal(row['avg_price']),
            }
            for row in data
        ]

        return ok({'products': products})


class TopCustomersView(APIView):
    """
    GET /api/dashboard/top-customers/?limit=10
    Returns top N customers by total spend.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs    = _apply_date_filter(SalesRecord.objects.all(), request)
        limit = int(request.query_params.get('limit', 10))

        data = (
            qs.values('customer_name')
              .annotate(
                  total_spent=Sum('total_amount'),
                  total_profit=Sum('profit'),
                  orders=Count('id'),
                  total_quantity=Sum('quantity'),
                  last_purchase=Max('sale_date'),
              )
              .order_by('-total_spent')[:limit]
        )

        customers = [
            {
                'customer_name':  row['customer_name'],
                'total_spent':    _format_decimal(row['total_spent']),
                'total_profit':   _format_decimal(row['total_profit']),
                'orders':         row['orders'],
                'total_quantity': row['total_quantity'],
                'last_purchase':  str(row['last_purchase']) if row['last_purchase'] else None,
            }
            for row in data
        ]

        return ok({'customers': customers})


class RecentSalesView(APIView):
    """
    GET /api/dashboard/recent-sales/?limit=10
    Returns latest N sales transactions for the activity feed.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        limit = int(request.query_params.get('limit', 10))
        qs = SalesRecord.objects.order_by('-sale_date', '-created_at')[:limit]

        sales = [
            {
                'id':            r.id,
                'sale_date':     str(r.sale_date),
                'product_name':  r.product_name,
                'category':      r.category or 'Uncategorised',
                'customer_name': r.customer_name,
                'quantity':      r.quantity,
                'selling_price': _format_decimal(r.selling_price),
                'total_amount':  _format_decimal(r.total_amount),
                'profit':        _format_decimal(r.profit),
            }
            for r in qs
        ]

        return ok({'sales': sales})


class MonthlySummaryView(APIView):
    """
    GET /api/dashboard/monthly-summary/
    Returns month-by-month aggregated data table.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = _apply_date_filter(SalesRecord.objects.all(), request)

        data = (
            qs.annotate(month=TruncMonth('sale_date'))
              .values('month')
              .annotate(
                  revenue=Sum('total_amount'),
                  profit=Sum('profit'),
                  orders=Count('id'),
                  quantity=Sum('quantity'),
                  avg_order=Avg('total_amount'),
                  unique_customers=Count('customer_name', distinct=True),
              )
              .order_by('month')
        )

        months = []
        prev_rev = None
        for row in data:
            rev = _format_decimal(row['revenue'])
            months.append({
                'month':            row['month'].strftime('%b %Y'),
                'revenue':          rev,
                'profit':           _format_decimal(row['profit']),
                'orders':           row['orders'],
                'quantity':         row['quantity'],
                'avg_order':        _format_decimal(row['avg_order']),
                'unique_customers': row['unique_customers'],
                'revenue_growth':   _pct_change(rev, prev_rev),
            })
            prev_rev = rev

        return ok({'months': months})


class ProductAnalyticsView(APIView):
    """
    GET /api/dashboard/product-analytics/
    Returns full product analytics: KPIs + all products ranked + AI-ready insights data.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from collections import defaultdict
        qs = SalesRecord.objects.all()

        # All products with sales data
        raw = list(
            qs.values('product_name', 'category')
              .annotate(
                  revenue=Sum('total_amount'),
                  profit=Sum('profit'),
                  quantity=Sum('quantity'),
                  orders=Count('id'),
                  cost_sum=Sum('cost_price'),
                  sell_sum=Sum('selling_price'),
              )
              .order_by('-revenue')
        )

        total_revenue = sum(_format_decimal(p['revenue']) for p in raw)
        total_profit  = sum(_format_decimal(p['profit'])  for p in raw)
        total_products = len(raw)

        products = []
        for p in raw:
            cost = _format_decimal(p['cost_sum'])
            sell = _format_decimal(p['sell_sum'])
            margin = round(((sell - cost) / cost) * 100, 1) if cost > 0 else 0
            rev = _format_decimal(p['revenue'])
            products.append({
                'product_name': p['product_name'],
                'category':     p['category'] or 'Uncategorised',
                'revenue':      rev,
                'profit':       _format_decimal(p['profit']),
                'quantity':     p['quantity'],
                'orders':       p['orders'],
                'avg_price':    round(sell / p['orders'], 2) if p['orders'] else 0,
                'profit_margin': margin,
                'revenue_share': round((rev / total_revenue) * 100, 1) if total_revenue else 0,
            })

        avg_margin = round(sum(p['profit_margin'] for p in products) / len(products), 1) if products else 0

        best  = products[0]  if products else None
        worst = products[-1] if len(products) > 1 else None

        return ok({
            'kpis': {
                'total_products':   total_products,
                'total_revenue':    total_revenue,
                'total_profit':     total_profit,
                'avg_profit_margin': avg_margin,
                'best_product':     best['product_name'] if best else None,
                'best_revenue':     best['revenue']      if best else 0,
            },
            'products': products,
            'best_product':  best,
            'worst_product': worst,
        })


class CustomerAnalyticsView(APIView):
    """
    GET /api/dashboard/customer-analytics/
    Returns full customer analytics: KPIs + all customers + repeat info.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = SalesRecord.objects.all()

        raw = list(
            qs.values('customer_name')
              .annotate(
                  total_spent=Sum('total_amount'),
                  total_profit=Sum('profit'),
                  orders=Count('id'),
                  total_qty=Sum('quantity'),
                  last_purchase=Max('sale_date'),
              )
              .order_by('-total_spent')
        )

        total_customers = len(raw)
        repeat_customers = [c for c in raw if c['orders'] > 1]
        total_spent_all = sum(_format_decimal(c['total_spent']) for c in raw)
        avg_spending = round(total_spent_all / total_customers, 2) if total_customers else 0
        top_customer = raw[0] if raw else None

        customers = [
            {
                'customer_name':  c['customer_name'],
                'total_spent':    _format_decimal(c['total_spent']),
                'total_profit':   _format_decimal(c['total_profit']),
                'orders':         c['orders'],
                'total_qty':      c['total_qty'],
                'last_purchase':  str(c['last_purchase']) if c['last_purchase'] else None,
                'is_repeat':      c['orders'] > 1,
                'spend_share':    round((_format_decimal(c['total_spent']) / total_spent_all) * 100, 1) if total_spent_all else 0,
            }
            for c in raw
        ]

        return ok({
            'kpis': {
                'total_customers':    total_customers,
                'repeat_customers':   len(repeat_customers),
                'repeat_pct':         round((len(repeat_customers) / total_customers) * 100, 1) if total_customers else 0,
                'top_customer':       top_customer['customer_name'] if top_customer else None,
                'top_customer_spent': _format_decimal(top_customer['total_spent']) if top_customer else 0,
                'avg_spending':       avg_spending,
            },
            'customers': customers,
        })
