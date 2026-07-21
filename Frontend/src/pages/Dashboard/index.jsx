/**
 * Dashboard/index.jsx
 * -------------------
 * Main analytics dashboard. Fetches all data from /api/dashboard/ endpoints.
 * Shows: KPI cards, revenue trend, category breakdown, top products,
 * top customers, recent sales, monthly summary table.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

import {
  getDashboardSummary,
  getRevenueTrend,
  getSalesByCategory,
  getTopProducts,
  getTopCustomers,
  getRecentSales,
  getMonthlySummary,
} from '../../services/dashboardService';

import KPICard          from '../../components/dashboard/KPICard';
import RevenueChart     from '../../components/dashboard/RevenueChart';
import CategoryChart    from '../../components/dashboard/CategoryChart';
import TopProductsChart from '../../components/dashboard/TopProductsChart';
import RecentSalesTable from '../../components/dashboard/RecentSalesTable';

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmtCurrency = (v) =>
  v >= 1_000_000
    ? '₹' + (v / 1_000_000).toFixed(2) + 'M'
    : v >= 1_000
    ? '₹' + (v / 1_000).toFixed(1) + 'K'
    : '₹' + Number(v || 0).toFixed(2);

const PERIOD_OPTIONS = [
  { label: '7 Days',  value: '7d'   },
  { label: '30 Days', value: '30d'  },
  { label: '90 Days', value: '90d'  },
  { label: '6 Months',value: '180d' },
  { label: '1 Year',  value: '365d' },
  { label: 'All Time',value: 'all'  },
];

// ── Empty state shown when no SalesRecord data exists ─────────────────────────
const EmptyState = ({ navigate }) => (
  <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
    <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#fefce8', border: '2px solid #fde68a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
      <i className="bi bi-bar-chart-line-fill" style={{ fontSize: '2rem', color: '#ca8a04' }}></i>
    </div>
    <h4 style={{ fontWeight: 800, marginBottom: 8 }}>No Sales Data Yet</h4>
    <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', maxWidth: 400, margin: '0 auto 1.5rem' }}>
      Import your sales data via CSV to see your dashboard, analytics, and AI insights come to life.
    </p>
    <button className="btn btn-accent px-5 py-2 fw-semibold" style={{ borderRadius: 10 }} onClick={() => navigate('/uploads/new')}>
      <i className="bi bi-upload me-2"></i>Upload Sales CSV
    </button>
  </div>
);

// ── Monthly Summary Table ─────────────────────────────────────────────────────
const MonthlySummaryTable = ({ data = [], loading }) => {
  if (loading) return (
    <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner-border" style={{ color: 'var(--accent)', width: '1.8rem', height: '1.8rem' }}></div>
    </div>
  );
  if (!data.length) return <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', padding: '1rem 0' }}>No monthly data available.</p>;

  return (
    <div className="table-responsive">
      <table className="data-table" style={{ fontSize: '0.82rem' }}>
        <thead>
          <tr>
            {['Month', 'Revenue', 'Profit', 'Orders', 'Qty', 'Avg Order', 'Customers', 'Growth'].map(h => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={idx}>
              <td style={{ fontWeight: 700 }}>{row.month}</td>
              <td style={{ color: '#ca8a04', fontWeight: 600 }}>₹{Number(row.revenue).toLocaleString('en-IN')}</td>
              <td style={{ color: '#16a34a', fontWeight: 600 }}>₹{Number(row.profit).toLocaleString('en-IN')}</td>
              <td>{row.orders}</td>
              <td>{row.quantity}</td>
              <td>₹{Number(row.avg_order).toLocaleString('en-IN', { minimumFractionDigits: 0 })}</td>
              <td>{row.unique_customers}</td>
              <td>
                {row.revenue_growth !== null && row.revenue_growth !== undefined ? (
                  <span style={{
                    color: row.revenue_growth >= 0 ? '#16a34a' : '#dc2626',
                    fontWeight: 700, fontSize: '0.78rem',
                  }}>
                    {row.revenue_growth >= 0 ? '▲' : '▼'} {Math.abs(row.revenue_growth)}%
                  </span>
                ) : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ── Top Customers Table ───────────────────────────────────────────────────────
const TopCustomersTable = ({ data = [], loading }) => {
  if (loading) return (
    <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner-border" style={{ color: 'var(--accent)', width: '1.8rem', height: '1.8rem' }}></div>
    </div>
  );
  if (!data.length) return <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', padding: '1rem 0' }}>No customer data.</p>;

  return (
    <div style={{ maxHeight: 320, overflowY: 'auto' }}>
      {data.map((c, idx) => {
        const initials = c.customer_name.slice(0, 2).toUpperCase();
        return (
          <div key={idx} className="d-flex align-items-center gap-3 py-2"
            style={{ borderBottom: idx < data.length - 1 ? '1px solid var(--border)' : 'none' }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, #1a56db 0%, #0ea5e9 100%)',
              color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: '0.78rem',
            }}>
              {initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{c.customer_name}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {c.orders} order{c.orders > 1 ? 's' : ''} · Last: {c.last_purchase}
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>
                ₹{Number(c.total_spent).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#22c55e' }}>
                #{idx + 1}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ── Main Dashboard Component ──────────────────────────────────────────────────
const Dashboard = () => {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const [period, setPeriod] = useState('30d');

  // Data state
  const [summary,       setSummary]       = useState(null);
  const [trend,         setTrend]         = useState([]);
  const [categories,    setCategories]    = useState([]);
  const [topProducts,   setTopProducts]   = useState([]);
  const [topCustomers,  setTopCustomers]  = useState([]);
  const [recentSales,   setRecentSales]   = useState([]);
  const [monthlySummary,setMonthlySummary]= useState([]);

  // Loading state per section
  const [loadingMap, setLoadingMap] = useState({
    summary: true, trend: true, categories: true,
    products: true, customers: true, recent: true, monthly: true,
  });
  const [hasData, setHasData] = useState(true);
  const [productSort, setProductSort] = useState('revenue');

  const setLoading = (key, val) => setLoadingMap(prev => ({ ...prev, [key]: val }));

  // ── Fetch all data ──────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    const params = { period };
    const prodParams = { period, sort: productSort, limit: 10 };

    // Reset loaders
    setLoadingMap({ summary: true, trend: true, categories: true, products: true, customers: true, recent: true, monthly: true });

    try {
      const [sumRes, trendRes, catRes, prodRes, custRes, recentRes, monthlyRes] = await Promise.allSettled([
        getDashboardSummary(params),
        getRevenueTrend(params),
        getSalesByCategory(params),
        getTopProducts(prodParams),
        getTopCustomers({ period, limit: 10 }),
        getRecentSales({ limit: 10 }),
        getMonthlySummary(params),
      ]);

      if (sumRes.status === 'fulfilled') {
        const d = sumRes.value.data?.data;
        setSummary(d);
        setHasData(d?.total_orders > 0);
      }
      if (trendRes.status === 'fulfilled')    setTrend(trendRes.value.data?.data?.trend || []);
      if (catRes.status === 'fulfilled')      setCategories(catRes.value.data?.data?.categories || []);
      if (prodRes.status === 'fulfilled')     setTopProducts(prodRes.value.data?.data?.products || []);
      if (custRes.status === 'fulfilled')     setTopCustomers(custRes.value.data?.data?.customers || []);
      if (recentRes.status === 'fulfilled')   setRecentSales(recentRes.value.data?.data?.sales || []);
      if (monthlyRes.status === 'fulfilled')  setMonthlySummary(monthlyRes.value.data?.data?.months || []);

    } catch (err) {
      toast.error('Failed to load dashboard data.');
    } finally {
      setLoadingMap({ summary: false, trend: false, categories: false, products: false, customers: false, recent: false, monthly: false });
    }
  }, [period, productSort]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Refresh just products when sort changes
  const handleProductSortChange = async (sort) => {
    setProductSort(sort);
    setLoading('products', true);
    try {
      const res = await getTopProducts({ period, sort, limit: 10 });
      setTopProducts(res.data?.data?.products || []);
    } catch {}
    finally { setLoading('products', false); }
  };

  const noData = !loadingMap.summary && (!summary || summary.total_orders === 0);

  return (
    <div>
      {/* Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h4 style={{ fontWeight: 800, marginBottom: 2 }}>
            Welcome back, {user?.first_name || 'there'} 👋
          </h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
            Here's what's happening with your business
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          {/* Period selector */}
          <div className="d-flex gap-1" style={{ background: 'var(--bg-secondary)', borderRadius: 10, padding: 4, border: '1px solid var(--border)' }}>
            {PERIOD_OPTIONS.map(opt => (
              <button key={opt.value} onClick={() => setPeriod(opt.value)}
                style={{
                  padding: '4px 12px', borderRadius: 7, fontSize: '0.75rem', fontWeight: 600,
                  border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                  background: period === opt.value ? 'var(--accent-gradient)' : 'transparent',
                  color: period === opt.value ? '#ffffff' : 'var(--text-muted)',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {/* Upload shortcut */}
          <button className="btn btn-accent px-3 py-2 fw-semibold" style={{ borderRadius: 10, fontSize: '0.82rem' }} onClick={() => navigate('/uploads/new')}>
            <i className="bi bi-upload me-2"></i>Import CSV
          </button>
        </div>
      </div>

      {/* Empty state */}
      {noData ? (
        <div className="card-panel">
          <EmptyState navigate={navigate} />
        </div>
      ) : (
        <>
          {/* ── Row 1: KPI Cards ────────────────────────────────── */}
          <div className="row g-3 mb-4">
            <div className="col-6 col-md-3">
              <KPICard
                title="Total Revenue"
                value={fmtCurrency(summary?.total_revenue || 0)}
                subtitle={`${summary?.total_orders || 0} orders`}
                icon="bi-currency-rupee"
                color="#1a56db"
                trend={summary?.revenue_change_pct}
                loading={loadingMap.summary}
              />
            </div>
            <div className="col-6 col-md-3">
              <KPICard
                title="Total Profit"
                value={fmtCurrency(summary?.total_profit || 0)}
                subtitle="Net profit"
                icon="bi-graph-up-arrow"
                color="#22c55e"
                trend={summary?.profit_change_pct}
                loading={loadingMap.summary}
              />
            </div>
            <div className="col-6 col-md-3">
              <KPICard
                title="Total Orders"
                value={(summary?.total_orders || 0).toLocaleString()}
                subtitle={`${summary?.unique_products || 0} products`}
                icon="bi-bag-check-fill"
                color="#0ea5e9"
                trend={summary?.orders_change_pct}
                loading={loadingMap.summary}
              />
            </div>
            <div className="col-6 col-md-3">
              <KPICard
                title="Customers"
                value={(summary?.unique_customers || 0).toLocaleString()}
                subtitle={`Avg: ${fmtCurrency(summary?.avg_order_value || 0)}/order`}
                icon="bi-people-fill"
                color="#6366f1"
                loading={loadingMap.summary}
              />
            </div>
          </div>

          {/* ── Row 2: Revenue Trend + Category ─────────────────── */}
          <div className="row g-3 mb-4">
            <div className="col-lg-8">
              <div className="card-panel p-4 h-100">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Revenue & Profit Trend</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {PERIOD_OPTIONS.find(o => o.value === period)?.label}
                    </div>
                  </div>
                  {summary?.best_product && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'right' }}>
                      <i className="bi bi-trophy-fill me-1" style={{ color: '#f5c518' }}></i>
                      Best: <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{summary.best_product}</span>
                    </div>
                  )}
                </div>
                <RevenueChart data={trend} loading={loadingMap.trend} />
              </div>
            </div>
            <div className="col-lg-4">
              <div className="card-panel p-4 h-100">
                <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 4 }}>Sales by Category</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 12 }}>Revenue share per category</div>
                <CategoryChart data={categories} loading={loadingMap.categories} />
              </div>
            </div>
          </div>

          {/* ── Row 3: Top Products + Recent Sales ──────────────── */}
          <div className="row g-3 mb-4">
            <div className="col-lg-7">
              <div className="card-panel p-4 h-100">
                <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 4 }}>Top 10 Products</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 12 }}>Ranked by selected metric</div>
                <TopProductsChart
                  data={topProducts}
                  loading={loadingMap.products}
                  onSortChange={handleProductSortChange}
                />
              </div>
            </div>
            <div className="col-lg-5">
              <div className="card-panel p-4 h-100">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Recent Sales</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Latest 10 transactions</div>
                  </div>
                </div>
                <RecentSalesTable data={recentSales} loading={loadingMap.recent} />
              </div>
            </div>
          </div>

          {/* ── Row 4: Top Customers + Monthly Summary ───────────── */}
          <div className="row g-3 mb-4">
            <div className="col-lg-4">
              <div className="card-panel p-4 h-100">
                <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 4 }}>Top Customers</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 12 }}>By total spend</div>
                <TopCustomersTable data={topCustomers} loading={loadingMap.customers} />
              </div>
            </div>
            <div className="col-lg-8">
              <div className="card-panel p-4 h-100">
                <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 4 }}>Monthly Summary</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 12 }}>Month-by-month performance breakdown</div>
                <MonthlySummaryTable data={monthlySummary} loading={loadingMap.monthly} />
              </div>
            </div>
          </div>

          {/* ── Row 5: Business Snapshot ──────────────────────────── */}
          {summary && (
            <div className="card-panel p-4"
              style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #fff 60%)', border: '1px solid #bfdbfe' }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 16 }}>
                <i className="bi bi-lightning-fill me-2" style={{ color: '#1a56db' }}></i>
                Business Snapshot
              </div>
              <div className="row g-4">
                {[
                  { label: 'Best Product',    value: summary.best_product  || '—', icon: 'bi-trophy',         color: '#1a56db' },
                  { label: 'Best Category',   value: summary.best_category || '—', icon: 'bi-tag',            color: '#0ea5e9' },
                  { label: 'Avg Order Value', value: fmtCurrency(summary.avg_order_value), icon: 'bi-receipt', color: '#22c55e' },
                  { label: 'Total Qty Sold',  value: (summary.total_quantity || 0).toLocaleString(), icon: 'bi-boxes', color: '#6366f1' },
                  { label: 'Last Sale Date',  value: summary.last_sale_date || '—', icon: 'bi-calendar-check', color: '#0891b2' },
                  { label: 'Unique Products', value: summary.unique_products || 0, icon: 'bi-box-seam',        color: '#a855f7' },
                ].map(({ label, value, icon, color }) => (
                  <div key={label} className="col-6 col-md-4 col-lg-2">
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                      <div style={{ width: 42, height: 42, borderRadius: 12, background: color + '18', border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                        <i className={`bi ${icon}`} style={{ color, fontSize: '1.1rem' }}></i>
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: 2, wordBreak: 'break-word' }}>{value}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Dashboard;
