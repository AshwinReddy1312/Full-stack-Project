"""
sales/csv_processor.py
----------------------
Universal CSV processing engine — accepts ANY business CSV.

Strategy:
  1. Read all columns without requiring specific names.
  2. Auto-detect which columns map to date / product / customer / quantity / price
     using fuzzy keyword matching on column headers.
  3. For columns that cannot be mapped, store as raw_data (JSON) in the record.
  4. Fall back gracefully for missing fields:
       - No date  → use today's date
       - No product → use filename or row number as label
       - No customer → use "Unknown Customer"
       - No price/qty → default to 0
  5. Never reject a CSV just because columns don't match expected names.
"""
import csv
import io
import re
import time
import uuid
from datetime import datetime, date
from decimal import Decimal, InvalidOperation
from typing import Optional, Any

DATE_FORMATS = [
    '%Y-%m-%d', '%d-%m-%Y', '%m/%d/%Y', '%d/%m/%Y',
    '%Y/%m/%d', '%d-%b-%Y', '%d %b %Y', '%b %d %Y',
    '%Y%m%d', '%d.%m.%Y', '%m-%d-%Y',
]

MAX_PREVIEW_ROWS = 20

# ── Fuzzy column-detection keyword sets ──────────────────────────────────────
# Each entry is a list of keywords; if a column header contains ANY keyword
# (case-insensitive), it maps to that internal field.
FIELD_KEYWORDS = {
    'date': [
        'date', 'day', 'time', 'when', 'period', 'purchased',
        'created', 'order_date', 'sale_date', 'invoice_date',
        'transaction', 'billing_date', 'prescription_date',
    ],
    'product_name': [
        'product', 'item', 'name', 'medicine', 'drug', 'service',
        'description', 'goods', 'title', 'sku', 'article',
        'prescription', 'medication', 'material',
    ],
    'category': [
        'category', 'cat', 'type', 'group', 'department',
        'class', 'section', 'segment', 'division',
    ],
    'customer_name': [
        'customer', 'client', 'buyer', 'patient', 'person',
        'member', 'user', 'recipient', 'contact', 'purchaser',
        'payer', 'subscriber',
    ],
    'quantity': [
        'qty', 'quantity', 'units', 'count', 'number', 'nos',
        'pieces', 'amount_qty', 'sold', 'dispensed', 'dosage_qty',
    ],
    'cost_price': [
        'cost', 'purchase_price', 'buy_price', 'mrp',
        'original_price', 'base_price',
    ],
    'selling_price': [
        'price', 'rate', 'selling', 'unit_price', 'sale_price',
        'charge', 'fee', 'tariff', 'amount_per', 'value',
    ],
    'total_amount': [
        'total', 'amount', 'revenue', 'sum', 'subtotal',
        'net', 'gross', 'invoice_amount', 'bill', 'billing',
        'payable', 'charged',
    ],
}

# Priority ordering for ambiguous matches — higher = more specific
FIELD_PRIORITY = {
    'total_amount': 10, 'cost_price': 9, 'selling_price': 8,
    'quantity': 7, 'customer_name': 6, 'product_name': 5,
    'category': 4, 'date': 3,
}


# ── Internal helpers ──────────────────────────────────────────────────────────

def _norm(s):
    # type: (str) -> str
    """Normalise a string: lowercase, collapse spaces/underscores/hyphens."""
    return re.sub(r'[\s_\-]+', '_', s.strip().lower())


def _smart_column_map(headers):
    # type: (list) -> dict
    """
    Auto-detect column mapping using fuzzy keyword matching.
    Returns dict: internal_field -> actual_csv_header_string
    One header can only map to one field (best match wins).
    """
    used_headers = set()
    mapping = {}

    # Sort fields by priority (most specific first) so 'total_amount'
    # wins over 'selling_price' when a column says "total amount"
    for field in sorted(FIELD_KEYWORDS.keys(), key=lambda f: -FIELD_PRIORITY.get(f, 0)):
        keywords = FIELD_KEYWORDS[field]
        best_header = None
        best_score  = 0

        for header in headers:
            if header in used_headers:
                continue
            norm_h = _norm(header)
            for kw in keywords:
                norm_kw = _norm(kw)
                if norm_kw == norm_h:
                    score = 100  # exact match
                elif norm_kw in norm_h or norm_h in norm_kw:
                    score = 80   # substring match
                elif any(part in norm_h for part in norm_kw.split('_') if len(part) > 2):
                    score = 50   # partial keyword match
                else:
                    continue
                if score > best_score:
                    best_score  = score
                    best_header = header

        if best_header:
            mapping[field] = best_header
            used_headers.add(best_header)

    return mapping


def _parse_date(value):
    # type: (str) -> Optional[object]
    if not value:
        return None
    value = value.strip()
    for fmt in DATE_FORMATS:
        try:
            return datetime.strptime(value, fmt).date()
        except ValueError:
            continue
    # Try pandas-style parsing for edge cases (e.g. "Jan 5, 2024")
    try:
        return datetime.strptime(value, '%B %d, %Y').date()
    except ValueError:
        pass
    return None


def _parse_decimal(value):
    # type: (str) -> Optional[Decimal]
    if not value:
        return None
    cleaned = re.sub(r'[^\d.\-]', '', str(value).strip())
    if not cleaned or cleaned in ('.', '-'):
        return None
    try:
        return Decimal(cleaned)
    except InvalidOperation:
        return None


def _parse_int(value):
    # type: (str) -> Optional[int]
    try:
        v = int(float(str(value).strip().replace(',', '')))
        return max(0, v)
    except (ValueError, TypeError):
        return None


def _decode_file(file_obj):
    # type: (Any) -> tuple
    """Read and decode file bytes; handle BOM and encoding."""
    file_obj.seek(0)
    raw = file_obj.read()
    if isinstance(raw, bytes):
        for enc in ('utf-8-sig', 'utf-8', 'latin-1', 'cp1252'):
            try:
                text = raw.decode(enc)
                break
            except (UnicodeDecodeError, LookupError):
                continue
        else:
            text = raw.decode('latin-1', errors='replace')
    else:
        text = raw

    reader = csv.DictReader(io.StringIO(text))
    rows = list(reader)
    fieldnames = list(reader.fieldnames) if reader.fieldnames else []
    return rows, fieldnames


def _get(row, column_map, field, default=''):
    # type: (dict, dict, str, str) -> str
    """Safely get a value from a row using the column map."""
    header = column_map.get(field, '')
    return str(row.get(header, '') or '').strip() if header else default


def _clean_row(row, column_map, row_index=0):
    # type: (dict, dict, int) -> dict
    """
    Convert one raw CSV row into a clean typed dict.
    NEVER returns None — always produces a best-effort record.
    """
    # ── Date ────────────────────────────────────────────────────
    date_raw = _get(row, column_map, 'date')
    sale_date = _parse_date(date_raw) or date.today()

    # ── Product name ─────────────────────────────────────────────
    prod_name = _get(row, column_map, 'product_name')
    if not prod_name:
        # Try any column that has a non-numeric string value
        for header, val in row.items():
            val = str(val or '').strip()
            if val and not re.match(r'^[\d.,\s₹$€£\-]+$', val):
                prod_name = val
                break
    if not prod_name:
        prod_name = 'Item #%d' % row_index

    # ── Customer name ─────────────────────────────────────────────
    cust_name = _get(row, column_map, 'customer_name')
    if not cust_name:
        cust_name = 'Unknown Customer'

    # ── Category ─────────────────────────────────────────────────
    category = _get(row, column_map, 'category') or 'General'

    # ── Quantity ─────────────────────────────────────────────────
    qty = _parse_int(_get(row, column_map, 'quantity')) or 1

    # ── Prices ───────────────────────────────────────────────────
    cost_price  = _parse_decimal(_get(row, column_map, 'cost_price')) or Decimal('0')
    sell_price  = _parse_decimal(_get(row, column_map, 'selling_price')) or Decimal('0')
    total_raw   = _parse_decimal(_get(row, column_map, 'total_amount'))

    # If total_amount found but selling_price not → derive selling_price
    if sell_price == 0 and total_raw and total_raw > 0 and qty > 0:
        sell_price = total_raw / qty

    total_amount = total_raw if total_raw is not None else sell_price * qty
    profit       = (sell_price - cost_price) * qty
    margin_pct   = float(round(((sell_price - cost_price) / cost_price) * 100, 2)) if cost_price > 0 else 0

    # ── Store all original columns as raw_data ────────────────────
    raw_data = {k: str(v or '').strip() for k, v in row.items()}

    return {
        'sale_date':     str(sale_date),
        'product_name':  prod_name,
        'category':      category,
        'customer_name': cust_name,
        'quantity':      qty,
        'cost_price':    float(cost_price),
        'selling_price': float(sell_price),
        'total_amount':  float(total_amount),
        'profit':        float(profit),
        'profit_margin': margin_pct,
        'raw_data':      raw_data,
    }


# ── Public API ────────────────────────────────────────────────────────────────

def validate_csv(file_obj):
    # type: (Any) -> dict
    """
    Accepts ANY CSV file.
    Only fails for: unreadable file, empty file, no rows at all.
    Column mapping is auto-detected — no required columns.
    Returns { valid, errors, column_map, total_rows, fieldnames, mapped_fields, unmapped_fields }
    """
    try:
        rows, fieldnames = _decode_file(file_obj)
    except Exception as exc:
        return {
            'valid': False,
            'errors': [{'row': 0, 'column': 'file', 'error': 'Cannot read file: ' + str(exc)}],
            'column_map': {}, 'total_rows': 0, 'fieldnames': [],
            'mapped_fields': [], 'unmapped_fields': [],
        }

    if not fieldnames:
        return {
            'valid': False,
            'errors': [{'row': 0, 'column': 'file', 'error': 'File appears empty — no column headers found.'}],
            'column_map': {}, 'total_rows': 0, 'fieldnames': [],
            'mapped_fields': [], 'unmapped_fields': [],
        }

    # Count non-empty rows
    non_empty = [r for r in rows if any(str(v).strip() for v in r.values())]
    if not non_empty:
        return {
            'valid': False,
            'errors': [{'row': 0, 'column': 'file', 'error': 'File has headers but no data rows.'}],
            'column_map': {}, 'total_rows': 0, 'fieldnames': fieldnames,
            'mapped_fields': [], 'unmapped_fields': list(fieldnames),
        }

    column_map    = _smart_column_map(fieldnames)
    mapped_cols   = set(column_map.values())
    unmapped_cols = [h for h in fieldnames if h not in mapped_cols]

    return {
        'valid':           True,
        'errors':          [],
        'column_map':      column_map,
        'total_rows':      len(non_empty),
        'fieldnames':      fieldnames,
        'mapped_fields':   list(column_map.keys()),
        'unmapped_fields': unmapped_cols,
    }


def preview_csv(file_obj, column_map, max_rows=MAX_PREVIEW_ROWS):
    # type: (Any, dict, int) -> list
    """Return up to max_rows preview rows, always succeeds."""
    rows, _ = _decode_file(file_obj)
    preview = []
    idx = 0
    for row in rows:
        if not any(str(v).strip() for v in row.values()):
            continue
        idx += 1
        cleaned = _clean_row(row, column_map, idx)
        # For preview, exclude raw_data to keep payload small
        preview_row = {k: v for k, v in cleaned.items() if k != 'raw_data'}
        preview.append(preview_row)
        if len(preview) >= max_rows:
            break
    return preview


def process_csv(file_obj, column_map, upload_instance, uploaded_by):
    # type: (Any, dict, Any, Any) -> dict
    """
    Full import: clean every row, auto-create Products + Customers,
    bulk-insert SalesRecords. Never skips a row unless it is completely blank.
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

    product_cache  = {}
    customer_cache = {}

    default_cat, _ = ProductCategory.objects.get_or_create(name='CSV Import')

    records_to_create = []

    for idx, row in enumerate(rows, start=2):
        if not any(str(v).strip() for v in row.values()):
            continue

        try:
            cleaned = _clean_row(row, column_map, idx)
        except Exception as e:
            failed += 1
            errors.append({'row': idx, 'column': 'processing', 'error': str(e)})
            continue

        # ── Resolve Product ────────────────────────────────────
        prod_key = cleaned['product_name'].lower().strip()
        if prod_key not in product_cache:
            product_obj = Product.objects.filter(name__iexact=cleaned['product_name']).first()
            if not product_obj:
                cat = None
                if cleaned['category'] and cleaned['category'] != 'General':
                    cat = ProductCategory.objects.filter(name__iexact=cleaned['category']).first()
                product_obj = Product.objects.create(
                    name=cleaned['product_name'],
                    sku='CSV-' + uuid.uuid4().hex[:8].upper(),
                    category=cat or default_cat,
                    cost_price=Decimal(str(cleaned['cost_price'])),
                    selling_price=Decimal(str(cleaned['selling_price'])) or Decimal('1'),
                    stock_quantity=0,
                    created_by=uploaded_by,
                    status='Active',
                )
            product_cache[prod_key] = product_obj
        product_obj = product_cache[prod_key]

        # ── Resolve Customer ───────────────────────────────────
        cust_key = cleaned['customer_name'].lower().strip()
        if cust_key not in customer_cache:
            if cleaned['customer_name'] == 'Unknown Customer':
                # Use a single shared "Unknown" customer per upload
                customer_obj, _ = Customer.objects.get_or_create(
                    email='unknown@import.local',
                    defaults={
                        'first_name': 'Unknown',
                        'last_name': 'Customer',
                        'phone_number': '+00000000000',
                        'customer_type': 'Individual',
                        'status': 'Active',
                        'created_by': uploaded_by,
                    }
                )
            else:
                parts  = cleaned['customer_name'].split(' ', 1)
                fname  = parts[0]
                lname  = parts[1] if len(parts) > 1 else ''
                customer_obj = Customer.objects.filter(
                    first_name__iexact=fname, last_name__iexact=lname
                ).first()
                if not customer_obj:
                    customer_obj = Customer.objects.filter(
                        first_name__iexact=cleaned['customer_name']
                    ).first()
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

        # ── Duplicate guard ────────────────────────────────────
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
            category=cleaned['category'],
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
