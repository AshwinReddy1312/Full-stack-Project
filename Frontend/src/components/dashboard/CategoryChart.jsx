/**
 * CategoryChart.jsx
 * -----------------
 * Pie chart + bar chart side-by-side for sales by category.
 */
import React, { useState } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';

const COLORS = [
  '#1a56db', '#0ea5e9', '#22c55e', '#6366f1', '#ef4444',
  '#f97316', '#a855f7', '#ec4899', '#14b8a6', '#84cc16',
];

const fmt = (v) => {
  if (v >= 1_000_000) return '₹' + (v / 1_000_000).toFixed(1) + 'M';
  if (v >= 1_000)     return '₹' + (v / 1_000).toFixed(1) + 'K';
  return '₹' + v;
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', fontSize: '0.82rem', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>{d.category}</div>
      <div>Revenue: <strong>₹{Number(d.revenue).toLocaleString('en-IN')}</strong></div>
      <div>Share: <strong>{d.pct}%</strong></div>
      <div>Orders: <strong>{d.orders}</strong></div>
    </div>
  );
};

const CategoryChart = ({ data = [], loading, view = 'pie' }) => {
  const [activeView, setActiveView] = useState(view);

  if (loading) return (
    <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner-border" style={{ color: 'var(--accent)', width: '2rem', height: '2rem' }}></div>
    </div>
  );

  if (!data.length) return (
    <div style={{ height: 280, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
      <i className="bi bi-pie-chart" style={{ fontSize: '2.5rem', marginBottom: 8 }}></i>
      <p style={{ margin: 0, fontSize: '0.875rem' }}>No category data available</p>
    </div>
  );

  return (
    <div>
      {/* View toggle */}
      <div className="d-flex gap-2 mb-3">
        {['pie', 'bar'].map((v) => (
          <button key={v} onClick={() => setActiveView(v)}
            style={{
              padding: '3px 12px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
              background: activeView === v ? 'var(--accent-gradient)' : 'var(--bg-secondary)',
              border: `1px solid ${activeView === v ? 'var(--accent)' : 'var(--border)'}`,
              color: activeView === v ? '#ffffff' : 'var(--text-secondary)',
            }}
          >
            <i className={`bi ${v === 'pie' ? 'bi-pie-chart' : 'bi-bar-chart-line'} me-1`}></i>
            {v === 'pie' ? 'Pie' : 'Bar'}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={260}>
        {activeView === 'pie' ? (
          <PieChart>
            <Pie
              data={data}
              dataKey="revenue"
              nameKey="category"
              cx="45%"
              cy="50%"
              outerRadius={95}
              innerRadius={42}
              paddingAngle={2}
              label={({ category, pct }) => pct > 5 ? `${pct}%` : ''}
              labelLine={false}
            >
              {data.map((_, idx) => (
                <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              iconType="circle" iconSize={8}
              formatter={(v) => <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{v}</span>}
            />
          </PieChart>
        ) : (
          <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e0" horizontal={false} />
            <XAxis type="number" tickFormatter={fmt} tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
            <YAxis type="category" dataKey="category" tick={{ fontSize: 11, fill: '#6b7280' }} tickLine={false} axisLine={false} width={100} />
            <Tooltip formatter={(v) => ['₹' + Number(v).toLocaleString('en-IN'), 'Revenue']} />
            <Bar dataKey="revenue" radius={[0, 6, 6, 0]} maxBarSize={22}>
              {data.map((_, idx) => (
                <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};

export default CategoryChart;
