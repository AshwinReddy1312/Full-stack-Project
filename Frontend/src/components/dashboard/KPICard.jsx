/**
 * KPICard.jsx
 * -----------
 * Reusable metric card for KPI summary.
 *
 * Props: title, value, subtitle, icon, color, trend (number %), loading
 */
import React from 'react';

const KPICard = ({ title, value, subtitle, icon, color = '#6366f1', trend, loading }) => {
  const trendUp = trend > 0;
  const trendNull = trend === null || trend === undefined;

  return (
    <div className="card-panel p-4 h-100">
      {loading ? (
        <div className="d-flex flex-column gap-2">
          <div style={{ height: 14, width: '60%', background: '#e5e5e0', borderRadius: 6 }}></div>
          <div style={{ height: 32, width: '80%', background: '#e5e5e0', borderRadius: 6 }}></div>
          <div style={{ height: 12, width: '50%', background: '#e5e5e0', borderRadius: 6 }}></div>
        </div>
      ) : (
        <>
          <div className="d-flex align-items-start justify-content-between mb-3">
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 6 }}>
                {title}
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, lineHeight: 1, color: 'var(--text-primary)' }}>
                {value}
              </div>
              {subtitle && (
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>{subtitle}</div>
              )}
            </div>
            <div style={{
              width: 44, height: 44, borderRadius: 12, flexShrink: 0,
              background: color + '18',
              border: `1px solid ${color}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <i className={`bi ${icon}`} style={{ color, fontSize: '1.15rem' }}></i>
            </div>
          </div>

          {!trendNull && (
            <div className="d-flex align-items-center gap-2 mt-auto pt-2" style={{ borderTop: '1px solid var(--border)' }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 3,
                padding: '2px 8px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 700,
                background: trendUp ? '#f0fdf4' : '#fef2f2',
                color: trendUp ? '#16a34a' : '#dc2626',
                border: `1px solid ${trendUp ? '#bbf7d0' : '#fecaca'}`,
              }}>                <i className={`bi ${trendUp ? 'bi-arrow-up-short' : 'bi-arrow-down-short'}`}></i>
                {Math.abs(trend)}%
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>vs previous period</span>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default KPICard;
