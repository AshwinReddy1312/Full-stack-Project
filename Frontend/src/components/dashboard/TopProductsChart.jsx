/**
 * TopProductsChart.jsx
 * --------------------
 * Horizontal bar chart for top products by revenue / quantity / profit.
 */
import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

const COLORS = ['#f5c518', '#22c55e', '#6366f1', '#ef4444', '#06b6d4', '#f97316', '#a855f7', '#ec4899', '#14b8a6', '#84cc16'];

const fmt = (v) => {
  if (v >= 1_000_000) return '₹' + (v / 1_000_000).toFixed(1) + 'M';
  if (v >= 1_000)     return '₹' + (v / 1_000).toFixed(1) + 'K';
  return typeof v === 'number' ? (v >= 1000 ? v.toLocaleString() : String(v)) : v;
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', fontSize: '0.82rem', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', maxWidth: 200 }}>
      <div style={{ fontWeight: 700, marginBottom: 6 }}>{d.product_name}</div>
      <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: 4 }}>{d.category}</div>
      <div>Revenue: <strong>₹{Number(d.revenue).toLocaleString('en-IN')}</strong></div>
      <div>Profit: <strong>₹{Number(d.profit).toLocaleString('en-IN')}</strong></div>
      <div>Qty Sold: <strong>{d.quantity}</strong></div>
    </div>
  );
};

const SORT_OPTIONS = [
  { key: 'revenue',  label: 'Revenue' },
  { key: 'quantity', label: 'Quantity' },
  { key: 'profit',   label: 'Profit'  },
];

const TopProductsChart = ({ data = [], loading, onSortChange }) => {
  const [sortBy, setSortBy] = useState('revenue');

  const handleSort = (key) => {
    setSortBy(key);
    onSortChange && onSortChange(key);
  };

  if (loading) return (
    <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner-border" style={{ color: 'var(--accent)', width: '2rem', height: '2rem' }}></div>
    </div>
  );

  if (!data.length) return (
    <div style={{ height: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
      <i className="bi bi-bar-chart-steps" style={{ fontSize: '2.5rem', marginBottom: 8 }}></i>
      <p style={{ margin: 0, fontSize: '0.875rem' }}>No product data available</p>
    </div>
  );

  const truncate = (str, n = 18) => str && str.length > n ? str.slice(0, n) + '…' : str;

  return (
    <div>
      {/* Sort toggle */}
      <div className="d-flex gap-2 mb-3">
        {SORT_OPTIONS.map(({ key, label }) => (
          <button key={key} onClick={() => handleSort(key)}
            style={{
              padding: '3px 12px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
              background: sortBy === key ? 'var(--accent)' : 'var(--bg-secondary)',
              border: `1px solid ${sortBy === key ? 'var(--accent)' : 'var(--border)'}`,
              color: sortBy === key ? '#1a1a1a' : 'var(--text-secondary)',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e0" horizontal={false} />
          <XAxis
            type="number"
            tickFormatter={sortBy === 'quantity' ? (v) => v : fmt}
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            tickLine={false} axisLine={false}
          />
          <YAxis
            type="category"
            dataKey="product_name"
            tickFormatter={truncate}
            tick={{ fontSize: 11, fill: '#6b7280' }}
            tickLine={false} axisLine={false}
            width={110}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey={sortBy} radius={[0, 6, 6, 0]} maxBarSize={20}>
            {data.map((_, idx) => (
              <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TopProductsChart;
