"""
sales/csv_processor.py
----------------------
Core CSV processing engine. Compatible with Python 3.9+.

Public functions:
  validate_csv(file_obj)                        -> dict
  preview_csv(file_obj, column_map, max_rows)   -> list
  process_csv(file_obj, column_map, upload, by) -> dict
"""
import csv
import io
import re
import time
import uuid
from datetime import datetime
from decimal import Decimal, InvalidOperation
from typing import Optional, List, Dict, Any

# ── Column alias mapping ──────────────────────────────────────────────────────
COLUMN_ALIASES = {
    'date':          ['date', 'sale date', 'transaction date', 'order date', 'sale_date'],
    'product_name':  ['product name', 'product', 'item name', 'item', 'product_name'],
    'category':      ['category', 'product category', 'cat'],
    'customer_name': ['customer name', 'customer', 'client name', 'client', 'customer_name'],
    'quantity':      ['quantity', 'qty', 'units', 'quantity sold', 'units sold'],
    'cost_price':    ['cost price', 'cost', 'cost_price', 'purchase price', 'buy price'],
    'selling_price': ['selling price', 'price', 'selling_price', 'sale price', 'unit price'],
    'total_amount':  ['total amount', 'total', 'amount', 'total_amount', 'revenue', 'sales amount'],
}

REQUIRED_COLUMNS = ['date', 'product_name', 'customer_name', 'quantity', 'selling_price']

DATE_FORMATS = [
    '%Y-%m-%d', '%d-%m-%Y', '%m/%d/%Y',
    '%d/%m/%Y', '%Y/%m/%d', '%d-%b-%Y', '%d %b %Y',
]

MAX_PREVIEW_ROWS = 20


# ── Internal helpers ──────────────────────────────────────────────────────────

def _normalise_header(header):
    # type: (str) -> str
    return header.strip().lower().replace(' ', '_').replace('-', '_')


def _build_column_map(headers):
    # type: (list) -> dict
    """Map actual CSV header names to internal field keys."""
    normalised = {_normalise_header(h): h for h in headers}
    mapping = {}
    for field, aliases in COLUMN_ALIASES.items():
        for alias in aliases:
            norm = _normalise_header(alias)
            if norm in normalised:
                mapping[field] = normalised[norm]
                break
    return mapping


def _parse_date(value):
    # type: (str) -> Optional[object]
    value = value.strip()
    for fmt in DATE_FORMATS:
        try:
            return datetime.strptime(value, fmt).date()
        except ValueError:
            continue
    return None


def _parse_decimal(value):
    # type: (str) -> Optional[Decimal]
    if not value:
        return None
    cleaned = re.sub(r'[^\d.\-]', '', str(value).strip())
    try:
        return Decimal(cleaned)
    except InvalidOperation:
        return None


def _parse_int(value):
    # type: (str) -> Optional[int]
    try:
        return int(float(str(value).strip().replace(',', '')))
    except (ValueError, TypeError):
        return None


def _decode_file(file_obj):
    # type: (Any) -> tuple
    """Read and decode file bytes; handle BOM and encoding."""
    file_obj.seek(0)
    raw = file_obj.read()
    if isinstance(raw, bytes):
        try:
            text = raw.decode('utf-8-sig')
        except UnicodeDecodeError:
            text = raw.decode('latin-1')
    else:
        text = raw

    reader = csv.DictReader(io.StringIO(text))
    rows = list(reader)
    fieldnames = list(reader.fieldnames) if reader.fieldnames else []
    return rows, fieldnames


def _clean_row(row, column_map):
    # type: (dict, dict) -> Optional[dict]
    """Convert one raw CSV row into clean typed dict. Returns None if row is unusable."""
    def get(field):
        return str(row.get(column_map.get(field, ''), '') or '').strip()

    date_val    = _parse_date(get('date'))
    prod_name   = get('product_name')
    cust_name   = get('customer_name')
    qty         = _parse_int(get('quantity'))
    cost_price  = _parse_decimal(get('cost_price')) or Decimal('0')
    sell_price  = _parse_decimal(get('selling_price'))
    total_raw   = _parse_decimal(get('total_amount'))
    category    = get('category')

    if not date_val or not prod_name or not cust_name or qty is None or sell_price is None:
        return None

    total_amount = total_raw if total_raw is not None else sell_price * qty
    profit       = (sell_price - cost_price) * qty
    margin_pct   = float(round(((sell_price - cost_price) / cost_price) * 100, 2)) if cost_price > 0 else 0

    return {
        'sale_date':     str(date_val),
        'product_name':  prod_name,
        'category':      category,
        'customer_name': cust_name,
        'quantity':      qty,
        'cost_price':    float(cost_price),
        'selling_price': float(sell_price),
        'total_amount':  float(total_amount),
        'profit':        float(profit),
        'profit_margin': margin_pct,
    }


# ── Public API ────────────────────────────────────────────────────────────────

def validate_csv(file_obj):
    # type: (Any) -> dict
    """
    Validate file structure and row data.
    Returns:
        { valid, errors, column_map, total_rows, fieldnames }
    """
    errors = []

    try:
        rows, fieldnames = _decode_file(file_obj)
    except Exception as exc:
        return {
            'valid': False,
            'errors': [{'row': 0, 'column': 'file', 'error': 'Cannot read CSV: ' + str(exc)}],
            'column_map': {}, 'total_rows': 0, 'fieldnames': [],
        }

    if not fieldnames:
        return {
            'valid': False,
            'errors': [{'row': 0, 'column': 'file', 'error': 'CSV file is empty or has no headers.'}],
            'column_map': {}, 'total_rows': 0, 'fieldnames': [],
        }

    column_map = _build_column_map(fieldnames)

    # Required column check
    missing = [c for c in REQUIRED_COLUMNS if c not in column_map]
    for col in missing:
        nice = col.replace('_', ' ').title()
        errors.append({
            'row': 0, 'column': nice,
            'error': 'Required column "%s" not found. Expected one of: %s' % (nice, COLUMN_ALIASES[col]),
        })

    if missing:
        return {'valid': False, 'errors': errors, 'column_map': column_map,
                'total_rows': len(rows), 'fieldnames': fieldnames}

    valid_rows = 0
    empty_rows = 0

    for i, row in enumerate(rows, start=2):
        if all(not str(v).strip() for v in row.values()):
            empty_rows += 1
            continue

        # Date
        date_raw = str(row.get(column_map.get('date', ''), '') or '').strip()
        if not date_raw:
            errors.append({'row': i, 'column': 'Date', 'error': 'Date is required.'})
        elif not _parse_date(date_raw):
            errors.append({'row': i, 'column': 'Date',
                           'error': 'Invalid date "%s". Use YYYY-MM-DD, DD-MM-YYYY or DD/MM/YYYY.' % date_raw})

        # Product name
        if not str(row.get(column_map.get('product_name', ''), '') or '').strip():
            errors.append({'row': i, 'column': 'Product Name', 'error': 'Product name is required.'})

        # Customer name
        if not str(row.get(column_map.get('customer_name', ''), '') or '').strip():
            errors.append({'row': i, 'column': 'Customer Name', 'error': 'Customer name is required.'})

        # Quantity
        qty_raw = str(row.get(column_map.get('quantity', ''), '') or '').strip()
        if not qty_raw:
            errors.append({'row': i, 'column': 'Quantity', 'error': 'Quantity is required.'})
        elif _parse_int(qty_raw) is None or (_parse_int(qty_raw) or -1) < 0:
            errors.append({'row': i, 'column': 'Quantity',
                           'error': 'Invalid quantity "%s". Must be a positive number.' % qty_raw})

        # Selling price
        sp_raw = str(row.get(column_map.get('selling_price', ''), '') or '').strip()
        if not sp_raw:
            errors.append({'row': i, 'column': 'Selling Price', 'error': 'Selling price is required.'})
        else:
            sp = _parse_decimal(sp_raw)
            if sp is None or sp < 0:
                errors.append({'row': i, 'column': 'Selling Price',
                               'error': 'Invalid selling price "%s".' % sp_raw})

        # Cost price (optional but validated if present)
        cp_raw = str(row.get(column_map.get('cost_price', ''), '') or '').strip()
        if cp_raw:
            cp = _parse_decimal(cp_raw)
            if cp is None or cp < 0:
                errors.append({'row': i, 'column': 'Cost Price',
                               'error': 'Invalid cost price "%s".' % cp_raw})

        valid_rows += 1

    if valid_rows == 0 and empty_rows == len(rows):
        errors.append({'row': 0, 'column': 'file', 'error': 'CSV contains no data rows.'})

    return {
        'valid': len(errors) == 0,
        'errors': errors,
        'column_map': column_map,
        'total_rows': len(rows),
        'fieldnames': fieldnames,
    }


def preview_csv(file_obj, column_map, max_rows=MAX_PREVIEW_ROWS):
    # type: (Any, dict, int) -> list
    """Return up to max_rows clean preview dicts for the frontend table."""
    rows, _ = _decode_file(file_obj)
    preview = []
    for row in rows[:max_rows]:
        if all(not str(v).strip() for v in row.values()):
            continue
        cleaned = _clean_row(row, column_map)
        if cleaned:
            preview.append(cleaned)
    return preview


def process_csv(file_obj, column_map, upload_instance, uploaded_by):
    # type: (Any, dict, Any, Any) -> dict
    """
    Full import: read every row, resolve/create Products and Customers,
    bulk-insert SalesRecord rows.

    Returns: { imported, failed, duplicates, errors, processing_time }
    """
    from products.models import Product, ProductCategory
    from customers.models import Customer
    from .models import SalesRecord

    start = time.time()
    rows, _ = _decode_file(file_obj)

    imported   = 0
    failed     = 0
    duplicates = 0
    errors     = []

    product_cache  = {}   # lower name -> Product
    customer_cache = {}   # lower name -> Customer

    default_cat, _ = ProductCategory.objects.get_or_create(name='CSV Import')

    records_to_create = []

    for idx, row in enumerate(rows, start=2):
        # Skip blank rows
        if all(not str(v).strip() for v in row.values()):
            continue

        cleaned = _clean_row(row, column_map)
        if not cleaned:
            failed += 1
            errors.append({'row': idx, 'column': 'multiple', 'error': 'Row skipped — missing required fields.'})
            continue

        # ── Resolve Product ────────────────────────────────────
        prod_key = cleaned['product_name'].lower()
        if prod_key not in product_cache:
            product_obj = Product.objects.filter(name__iexact=cleaned['product_name']).first()
            if not product_obj:
                cat = None
                if cleaned['category']:
                    cat = ProductCategory.objects.filter(name__iexact=cleaned['category']).first()
                product_obj = Product.objects.create(
                    name=cleaned['product_name'],
                    sku='CSV-' + uuid.uuid4().hex[:8].upper(),
                    category=cat or default_cat,
                    cost_price=Decimal(str(cleaned['cost_price'])),
                    selling_price=Decimal(str(cleaned['selling_price'])),
                    stock_quantity=0,
                    created_by=uploaded_by,
                    status='Active',
                )
            product_cache[prod_key] = product_obj
        product_obj = product_cache[prod_key]

        # ── Resolve Customer ───────────────────────────────────
        cust_key = cleaned['customer_name'].lower()
        if cust_key not in customer_cache:
            parts = cleaned['customer_name'].split(' ', 1)
            fname = parts[0]
            lname = parts[1] if len(parts) > 1 else ''
            customer_obj = Customer.objects.filter(
                first_name__iexact=fname, last_name__iexact=lname
            ).first()
            if not customer_obj and not lname:
                customer_obj = Customer.objects.filter(first_name__iexact=fname).first()
            if not customer_obj:
                uid = uuid.uuid4().hex[:8]
                customer_obj = Customer.objects.create(
                    first_name=fname,
                    last_name=lname or 'Unknown',
                    email='csv.%s@import.local' % uid,
                    phone_number='+0000' + uid,
                    customer_type='Individual',
                    status='Active',
                    created_by=uploaded_by,
                )
            customer_cache[cust_key] = customer_obj
        customer_obj = customer_cache[cust_key]

        # ── Duplicate check ────────────────────────────────────
        already_exists = SalesRecord.objects.filter(
            upload=upload_instance,
            sale_date=cleaned['sale_date'],
            product_name__iexact=cleaned['product_name'],
            customer_name__iexact=cleaned['customer_name'],
            quantity=cleaned['quantity'],
        ).exists()

        if already_exists:
            duplicates += 1
            continue

        records_to_create.append(SalesRecord(
            upload=upload_instance,
            sale_date=cleaned['sale_date'],
            product=product_obj,
            product_name=cleaned['product_name'],
            category=cleaned['category'] or (product_obj.category.name if product_obj.category else ''),
            customer=customer_obj,
            customer_name=cleaned['customer_name'],
            quantity=cleaned['quantity'],
            cost_price=Decimal(str(cleaned['cost_price'])),
            selling_price=Decimal(str(cleaned['selling_price'])),
            total_amount=Decimal(str(cleaned['total_amount'])),
            profit=Decimal(str(cleaned['profit'])),
            profit_margin=Decimal(str(cleaned['profit_margin'])),
        ))
        imported += 1

    if records_to_create:
        SalesRecord.objects.bulk_create(records_to_create)

    return {
        'imported':        imported,
        'failed':          failed,
        'duplicates':      duplicates,
        'errors':          errors,
        'processing_time': round(time.time() - start, 2),
    }
