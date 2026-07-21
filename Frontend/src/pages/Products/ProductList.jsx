/**
 * ProductList.jsx — Enhanced with business analytics from SalesRecord data.
 * Shows KPI cards, enriched product table (qty sold, revenue, profit, margin),
 * and an AI Product Insights panel.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { getProducts, getCategories, deleteProduct } from '../../services/productService';
import ProductTable from '../../components/products/ProductTable';
import Pagination from '../../components/products/Pagination';
import api from '../../services/api';

const PAGE_SIZE = 10;

const fmtCur = (v) => {
  const n = Number(v || 0);
  if (n >= 10000000) return '₹' + (n / 10000000).toFixed(2) + 'Cr';
  if (n >= 100000)   return '₹' + (n / 100000).toFixed(2) + 'L';
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2 });
};

// ── AI Insight panel ─────────────────────────────────────────────────────────
const AIInsightPanel = ({ analytics, loading }) => {
  const [aiLoading, setAiLoading] = useState(false);
  const [insights, setInsights]   = useState(null);

  const generate = async () => {
    setAiLoading(true);
    try {
      const res = await api.post('/api/ai/chat/', {
        message: 'Give me product performance insights: best-selling product, lowest-selling product, highest revenue product, and 3 specific product recommendations. Be concise and use bullet points.',
        history: [],
      });
      setInsights(res.data?.data?.reply || null);
    } catch {
      toast.error('AI insights failed. Check your API key.');
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) return null;

  return (
    <div className="card-panel p-4 mt-4">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <h6 style={{ fontWeight: 700, margin: 0 }}>
            <i className="bi bi-stars me-2" style={{ color: '#ca8a04' }}></i>
            AI Product Insights
          </h6>
          <small style={{ color: 'var(--text-muted)' }}>Powered by your sales data</small>
        </div>
        <button
          className="btn btn-accent px-3 py-2 fw-semibold"
          style={{ borderRadius: 10, fontSize: '0.82rem' }}
          onClick={generate}
          disabled={aiLoading}
        >
          {aiLoading
            ? <><span className="spinner-border spinner-border-sm me-2"></span>Analysing…</>
            : <><i className="bi bi-magic me-2"></i>Generate Insights</>}
        </button>
      </div>

      {/* Quick stats from analytics */}
      {analytics && (
        <div className="row g-3 mb-3">
          {[
            { label: 'Best Product',      value: analytics.best_product?.product_name || '—',  icon: 'bi-trophy-fill',     color: '#ca8a04', bg: '#fefce8' },
            { label: 'Best Revenue',      value: fmtCur(analytics.best_product?.revenue),        icon: 'bi-currency-rupee',  color: '#16a34a', bg: '#f0fdf4' },
            { label: 'Lowest Product',    value: analytics.worst_product?.product_name || '—', icon: 'bi-arrow-down-circle',color: '#dc2626', bg: '#fef2f2' },
            { label: 'Avg Margin',        value: (analytics.kpis?.avg_profit_margin || 0) + '%', icon: 'bi-percent',         color: '#7c3aed', bg: '#f5f3ff' },
          ].map(({ label, value, icon, color, bg }) => (
            <div className="col-6 col-md-3" key={label}>
              <div style={{ background: bg, borderRadius: 10, padding: '10px 14px', border: `1px solid ${color}20` }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
                <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }} className="text-truncate" title={value}>{value}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* AI response */}
      {insights ? (
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 10, padding: '1rem', border: '1px solid var(--border)' }}>
          {insights.split('\n').filter(l => l.trim()).map((line, i) => (
            <p key={i} style={{ margin: '0 0 6px', fontSize: '0.875rem', lineHeight: 1.7, color: 'var(--text-secondary)' }}>{line}</p>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', background: 'var(--bg-secondary)', borderRadius: 10 }}>
          <i className="bi bi-stars" style={{ fontSize: '1.5rem', display: 'block', marginBottom: 8, color: '#ca8a04' }}></i>
          <p style={{ margin: 0, fontSize: '0.82rem' }}>Click Generate Insights to get AI-powered product analysis</p>
        </div>
      )}
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────
const ProductList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [products, setProducts]     = useState([]);
  const [categories, setCategories] = useState([]);
  const [analytics, setAnalytics]   = useState(null);
  const [loading, setLoading]       = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [deleting, setDeleting]     = useState(false);
  const [toDelete, setToDelete]     = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages]   = useState(1);
  const [totalCount, setTotalCount]   = useState(0);

  const [search, setSearch]       = useState('');
  const [category, setCategory]   = useState('');
  const [status, setStatus]       = useState('');
  const [ordering, setOrdering]   = useState('-created_at');

  // Fetch product catalogue
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: currentPage, page_size: PAGE_SIZE, ordering,
        ...(search && { search }), ...(category && { category }), ...(status && { status }) };
      const res = await getProducts(params);
      const d = res.data?.data || {};
      setProducts(d.results || []);
      setTotalPages(d.total_pages || 1);
      setTotalCount(d.count || 0);
    } catch { toast.error('Failed to load products.'); }
    finally { setLoading(false); }
  }, [currentPage, search, category, status, ordering]);

  // Fetch analytics (from SalesRecord)
  useEffect(() => {
    api.get('/api/dashboard/product-analytics/')
      .then(res => setAnalytics(res.data?.data || null))
      .catch(() => {})
      .finally(() => setAnalyticsLoading(false));
    getCategories().then(res => setCategories(res.data?.data || [])).catch(() => {});
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const reset = (setter) => (e) => { setter(e.target.value); setCurrentPage(1); };
  const hasFilters = search || category || status || ordering !== '-created_at';

  const handleDeleteClick = (p) => { setToDelete(p); setShowConfirm(true); };
  const handleDeleteConfirm = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await deleteProduct(toDelete.id);
      toast.success(`"${toDelete.name}" deleted.`);
      setToDelete(null); setShowConfirm(false); fetchProducts();
    } catch { toast.error('Delete failed.'); }
    finally { setDeleting(false); }
  };

  // Build merged table data: catalogue + sales analytics
  const salesMap = {};
  (analytics?.products || []).forEach(p => { salesMap[p.product_name?.toLowerCase()] = p; });

  const enriched = products.map(p => ({
    ...p,
    ...(salesMap[p.name?.toLowerCase()] || {}),
  }));

  return (
    <div>
      {/* Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h4 style={{ fontWeight: 800, marginBottom: 2 }}>Products</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>Product catalogue with sales performance</p>
        </div>
        <button className="btn btn-accent px-4 py-2 fw-semibold" style={{ borderRadius: 10 }} onClick={() => navigate('/products/add')}>
          <i className="bi bi-plus-lg me-2"></i>Add Product
        </button>
      </div>

      {/* KPI cards */}
      <div className="row g-3 mb-4">
        {[
          { label: 'Total Products',    value: analytics?.kpis?.total_products || totalCount, icon: 'bi-box-seam-fill',    bg: '#eff6ff', color: '#2563eb' },
          { label: 'Best Selling',      value: analytics?.kpis?.best_product   || '—',        icon: 'bi-trophy-fill',      bg: '#fefce8', color: '#ca8a04' },
          { label: 'Total Revenue',     value: fmtCur(analytics?.kpis?.total_revenue),         icon: 'bi-currency-rupee',   bg: '#f0fdf4', color: '#16a34a' },
          { label: 'Avg Profit Margin', value: (analytics?.kpis?.avg_profit_margin || 0) + '%',icon: 'bi-percent',          bg: '#f5f3ff', color: '#7c3aed' },
        ].map(({ label, value, icon, bg, color }) => (
          <div className="col-6 col-md-3" key={label}>
            <div className="stat-card d-flex align-items-center gap-3">
              <div className="stat-icon" style={{ background: bg }}>
                <i className={`bi ${icon}`} style={{ color }}></i>
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: '1.1rem', lineHeight: 1.2 }} className="text-truncate">{analyticsLoading ? '…' : value}</div>
                <small style={{ color: 'var(--text-muted)' }}>{label}</small>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="card-panel p-4 mb-4">
        <div className="row g-3 align-items-end">
          <div className="col-md-4">
            <label className="form-label">Search</label>
            <div className="input-group">
              <span className="input-group-text" style={{ borderRight: 'none' }}><i className="bi bi-search" style={{ fontSize: '0.85rem' }}></i></span>
              <input type="text" className="form-control" style={{ borderLeft: 'none' }} placeholder="Name or SKU…" value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} />
            </div>
          </div>
          <div className="col-md-2">
            <label className="form-label">Category</label>
            <select className="form-select" value={category} onChange={reset(setCategory)}>
              <option value="">All</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="col-md-2">
            <label className="form-label">Status</label>
            <select className="form-select" value={status} onChange={reset(setStatus)}>
              <option value="">All</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
          <div className="col-md-2">
            <label className="form-label">Sort</label>
            <select className="form-select" value={ordering} onChange={reset(setOrdering)}>
              <option value="-created_at">Newest</option>
              <option value="created_at">Oldest</option>
              <option value="selling_price">Price Low→High</option>
              <option value="-selling_price">Price High→Low</option>
              <option value="name">Name A→Z</option>
            </select>
          </div>
          <div className="col-md-2 d-flex align-items-end">
            {hasFilters && (
              <button className="btn btn-ghost w-100" onClick={() => { setSearch(''); setCategory(''); setStatus(''); setOrdering('-created_at'); setCurrentPage(1); }}>
                <i className="bi bi-x-lg me-2"></i>Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Sales Analytics Table */}
      {analytics?.products?.length > 0 && (
        <div className="card-panel overflow-hidden mb-4">
          <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: '0.9rem' }}>
            <i className="bi bi-bar-chart-fill me-2" style={{ color: '#ca8a04' }}></i>
            Product Sales Performance
            <small style={{ marginLeft: 8, color: 'var(--text-muted)', fontWeight: 400 }}>from imported data</small>
          </div>
          <div className="table-responsive p-3">
            <table className="data-table" style={{ fontSize: '0.82rem' }}>
              <thead>
                <tr>
                  {['#', 'Product Name', 'Category', 'Selling Price', 'Qty Sold', 'Revenue', 'Profit', 'Margin', 'Revenue Share'].map(h => <th key={h}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {analytics.products.slice(0, 20).map((p, i) => (
                  <tr key={i}>
                    <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                    <td style={{ fontWeight: 600 }}>{p.product_name}</td>
                    <td><span style={{ background: '#f3f4f6', padding: '2px 8px', borderRadius: 6, fontSize: '0.75rem' }}>{p.category}</span></td>
                    <td>{fmtCur(p.avg_price)}</td>
                    <td style={{ fontWeight: 700, color: '#2563eb' }}>{p.quantity?.toLocaleString()}</td>
                    <td style={{ fontWeight: 700, color: '#ca8a04' }}>{fmtCur(p.revenue)}</td>
                    <td style={{ color: '#16a34a' }}>{fmtCur(p.profit)}</td>
                    <td>
                      <span style={{ fontWeight: 700, color: p.profit_margin >= 20 ? '#16a34a' : p.profit_margin >= 10 ? '#ca8a04' : '#dc2626' }}>
                        {p.profit_margin}%
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ flex: 1, height: 6, background: '#e5e5e0', borderRadius: 999, overflow: 'hidden', minWidth: 50 }}>
                          <div style={{ height: '100%', width: p.revenue_share + '%', background: 'var(--accent)', borderRadius: 999 }} />
                        </div>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, minWidth: 32 }}>{p.revenue_share}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Product Catalogue table */}
      <div className="card-panel overflow-hidden">
        <div className="d-flex align-items-center justify-content-between px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>
            Product Catalogue
            {totalCount > 0 && <span style={{ marginLeft: 8, background: '#fefce8', color: '#ca8a04', border: '1px solid #fde68a', borderRadius: 999, padding: '1px 10px', fontSize: '0.75rem', fontWeight: 700 }}>{totalCount}</span>}
          </span>
          <button className="btn btn-ghost btn-sm" style={{ fontSize: '0.8rem' }} onClick={fetchProducts}>
            <i className="bi bi-arrow-clockwise me-1"></i>Refresh
          </button>
        </div>
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border" style={{ color: 'var(--accent)', width: '2rem', height: '2rem' }}></div>
          </div>
        ) : (
          <div className="p-3">
            <ProductTable products={products} onDeleteClick={handleDeleteClick} userRole={user?.role} />
            <Pagination currentPage={currentPage} totalPages={totalPages} totalCount={totalCount} pageSize={PAGE_SIZE} onPageChange={setCurrentPage} />
          </div>
        )}
      </div>

      {/* AI Product Insights */}
      <AIInsightPanel analytics={analytics} loading={analyticsLoading} />

      {/* Delete confirm */}
      {showConfirm && toDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card-panel p-4" style={{ maxWidth: 420, width: '90%' }}>
            <div className="d-flex align-items-center gap-3 mb-3">
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#fef2f2', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="bi bi-trash3-fill" style={{ color: '#dc2626' }}></i>
              </div>
              <h5 style={{ fontWeight: 800, margin: 0 }}>Delete Product</h5>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              Delete <strong>{toDelete.name}</strong> (SKU: {toDelete.sku})? This cannot be undone.
            </p>
            <div className="d-flex gap-3 justify-content-end">
              <button className="btn btn-ghost px-4" onClick={() => { setShowConfirm(false); setToDelete(null); }} disabled={deleting}>Cancel</button>
              <button className="btn px-4 fw-semibold" style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8 }} onClick={handleDeleteConfirm} disabled={deleting}>
                {deleting ? <><span className="spinner-border spinner-border-sm me-2"></span>Deleting…</> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductList;
