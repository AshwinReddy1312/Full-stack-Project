/**
 * RevenueChart.jsx
 * ----------------
 * Area chart showing Revenue and Profit over time.
 * Uses Recharts AreaChart.
 */
import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const fmt = (v) => {
  if (v >= 1_000_000) return '₹' + (v / 1_000_000).toFixed(1) + 'M';
  if (v >= 1_000)     return '₹' + (v / 1_000).toFixed(1) + 'K';
  return '₹' + v;
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#fff', border: '1px solid var(--border)',
      borderRadius: 10, padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      fontSize: '0.82rem',
    }}>
      <div style={{ fontWeight: 700, marginBottom: 6, color: 'var(--text-primary)' }}>{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} style={{ color: p.color, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, display: 'inline-block' }}></span>
          {p.name}: <strong>₹{Number(p.value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
        </div>
      ))}
    </div>
  );
};

const RevenueChart = ({ data = [], loading }) => {
  if (loading) return (
    <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner-border" style={{ color: 'var(--accent)', width: '2rem', height: '2rem' }}></div>
    </div>
  );

  if (!data.length) return (
    <div style={{ height: 280, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
      <i className="bi bi-bar-chart-line" style={{ fontSize: '2.5rem', marginBottom: 8 }}></i>
      <p style={{ margin: 0, fontSize: '0.875rem' }}>No sales data for this period</p>
    </div>
  );

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#1a56db" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#1a56db" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#22c55e" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => {
            const d = new Date(v);
            return isNaN(d) ? v : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
          }}
        />
        <YAxis
          tickFormatter={fmt}
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          tickLine={false}
          axisLine={false}
          width={64}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(v) => <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{v}</span>}
        />
        <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#1a56db" strokeWidth={2.5} fill="url(#colorRevenue)" dot={false} />
        <Area type="monotone" dataKey="profit"  name="Profit"  stroke="#22c55e" strokeWidth={2.5} fill="url(#colorProfit)"  dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default RevenueChart;
