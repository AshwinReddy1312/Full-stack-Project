/**
 * RecentSalesTable.jsx
 * --------------------
 * Latest sales transactions activity feed.
 */
import React from 'react';

const CATEGORY_COLORS = {
  'Electronics':        '#6366f1',
  'Clothing & Apparel': '#ec4899',
  'Food & Beverages':   '#22c55e',
  'Furniture':          '#f97316',
  'Health & Beauty':    '#06b6d4',
  'Sports & Outdoors':  '#14b8a6',
  'Books & Stationery': '#a855f7',
  'Toys & Games':       '#ef4444',
  'Automotive':         '#84cc16',
};

const getCategoryColor = (cat) => CATEGORY_COLORS[cat] || '#f5c518';

const RecentSalesTable = ({ data = [], loading }) => {
  if (loading) return (
    <div className="py-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="d-flex align-items-center gap-3 mb-3">
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#e5e5e0', flexShrink: 0 }}></div>
          <div style={{ flex: 1 }}>
            <div style={{ height: 12, width: '60%', background: '#e5e5e0', borderRadius: 4, marginBottom: 6 }}></div>
            <div style={{ height: 10, width: '40%', background: '#f5f5f0', borderRadius: 4 }}></div>
          </div>
          <div style={{ height: 14, width: 70, background: '#e5e5e0', borderRadius: 4 }}></div>
        </div>
      ))}
    </div>
  );

  if (!data.length) return (
    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
      <i className="bi bi-receipt" style={{ fontSize: '2rem', display: 'block', marginBottom: 8 }}></i>
      <p style={{ margin: 0, fontSize: '0.85rem' }}>No recent sales data</p>
    </div>
  );

  return (
    <div style={{ maxHeight: 360, overflowY: 'auto' }}>
      {data.map((sale, idx) => {
        const color = getCategoryColor(sale.category);
        const initials = sale.product_name.slice(0, 2).toUpperCase();
        return (
          <div
            key={idx}
            className="d-flex align-items-center gap-3 py-2"
            style={{ borderBottom: idx < data.length - 1 ? '1px solid var(--border)' : 'none' }}
          >
            {/* Product avatar */}
            <div style={{
              width: 38, height: 38, borderRadius: 10, flexShrink: 0,
              background: color + '18', border: `1px solid ${color}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: '0.72rem', color,
            }}>
              {initials}
            </div>

            {/* Details */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {sale.product_name}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {sale.customer_name} · {sale.quantity} unit{sale.quantity > 1 ? 's' : ''} · {sale.sale_date}
              </div>
            </div>

            {/* Amount */}
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                ₹{Number(sale.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#22c55e' }}>
                +₹{Number(sale.profit).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default RecentSalesTable;
