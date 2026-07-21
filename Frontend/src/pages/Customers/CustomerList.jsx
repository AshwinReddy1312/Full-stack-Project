/**
 * CustomerList.jsx — Enhanced with sales analytics from SalesRecord data.
 * Shows KPI cards, enriched customer table (orders, spending, last purchase),
 * and an AI Customer Insights panel.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getCustomers, deleteCustomer, toggleCustomerStatus } from '../../services/customerService';
import Pagination from '../../components/products/Pagination';
import api from '../../services/api';

const PAGE_SIZE = 10;

const fmtCur = (v) => {
  const n = Number(v || 0);
  if (n >= 10000000) return '₹' + (n / 10000000).toFixed(2) + 'Cr';
  if (n >= 100000)   return '₹' + (n / 100000).toFixed(2) + 'L';
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 0 });
};

// ── AI Insight panel ──────────────────────────────────────────────────────────
const AIInsightPanel = ({ analytics, loading }) => {
  const [aiLoading, setAiLoading] = useState(false);
  const [insights, setInsights]   = useState(null);

  const generate = async () => {
    setAiLoading(true);
    try {
      const res = await api.post('/api/ai/chat/', {
        message: 'Give me customer insights: top spending customer, repeat customer percentage, customer segments analysis, and 3 specific customer retention suggestions. Be concise with bullet points.',
        history: [],
      });
      setInsights(res.data?.data?.reply || null);
    } catch {
      toast.error('AI insights failed.');
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) return null;
  const kpis = analytics?.kpis || {};

  return (
    <div className="card-panel p-4 mt-4">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <h6 style={{ fontWeight: 700, margin: 0 }}>
            <i className="bi bi-stars me-2" style={{ color: '#ca8a04' }}></i>
            AI Customer Insights
          </h6>
          <small style={{ color: 'var(--text-muted)' }}>Powered by your sales data</small>
        </div>
        <button className="btn btn-accent px-3 py-2 fw-semibold" style={{ borderRadius: 10, fontSize: '0.82rem' }} onClick={generate} disabled={aiLoading}>
          {aiLoading ? <><span className="spinner-border spinner-border-sm me-2"></span>Analysing…</> : <><i className="bi bi-magic me-2"></i>Generate Insights</>}
        </button>
      </div>

      {/* Quick stats */}
      {analytics && (
        <div className="row g-3 mb-3">
          {[
            { label: 'Top Customer',    value: kpis.top_customer || '—',                 icon: 'bi-person-fill-check', color: '#ca8a04', bg: '#fefce8' },
            { label: 'Top Spending',    value: fmtCur(kpis.top_customer_spent),           icon: 'bi-currency-rupee',   color: '#16a34a', bg: '#f0fdf4' },
            { label: 'Repeat Customers',value: `${kpis.repeat_customers || 0} (${kpis.repeat_pct || 0}%)`, icon: 'bi-arrow-repeat', color: '#2563eb', bg: '#eff6ff' },
            { label: 'Avg Spending',    value: fmtCur(kpis.avg_spending),                 icon: 'bi-wallet2',          color: '#7c3aed', bg: '#f5f3ff' },
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

      {insights ? (
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 10, padding: '1rem', border: '1px solid var(--border)' }}>
          {insights.split('\n').filter(l => l.trim()).map((line, i) => (
            <p key={i} style={{ margin: '0 0 6px', fontSize: '0.875rem', lineHeight: 1.7, color: 'var(--text-secondary)' }}>{line}</p>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', background: 'var(--bg-secondary)', borderRadius: 10 }}>
          <i className="bi bi-people" style={{ fontSize: '1.5rem', display: 'block', marginBottom: 8, color: '#ca8a04' }}></i>
          <p style={{ margin: 0, fontSize: '0.82rem' }}>Click Generate Insights to get AI-powered customer analysis</p>
        </div>
      )}
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
const CustomerList = () => {
  const navigate = useNavigate();

  const [customers, setCustomers]   = useState([]);
  const [analytics, setAnalytics]   = useState(null);
  const [loading, setLoading]       = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [deleting, setDeleting]     = useState(false);
  const [toDelete, setToDelete]     = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages]   = useState(1);
  const [totalCount, setTotalCount]   = useState(0);

  const [search, setSearch]           = useState('');
  const [customerType, setCustomerType] = useState('');
  const [status, setStatus]           = useState('');
  const [ordering, setOrdering]       = useState('-created_at');

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: currentPage, page_size: PAGE_SIZE, ordering,
        ...(search && { search }), ...(customerType && { customer_type: customerType }), ...(status && { status }) };
      const res = await getCustomers(params);
      const d = res.data?.data || {};
      setCustomers(d.results || []);
      setTotalPages(d.total_pages || 1);
      setTotalCount(d.count || 0);
    } catch { toast.error('Failed to load customers.'); }
    finally { setLoading(false); }
  }, [currentPage, search, customerType, status, ordering]);

  useEffect(() => {
    api.get('/api/dashboard/customer-analytics/')
      .then(res => setAnalytics(res.data?.data || null))
      .catch(() => {})
      .finally(() => setAnalyticsLoading(false));
  }, []);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const reset = (setter) => (e) => { setter(e.target.value); setCurrentPage(1); };
  const hasFilters = search || customerType || status || ordering !== '-created_at';

  const handleStatusToggle = async (c) => {
    try {
      const res = await toggleCustomerStatus(c.id);
      toast.success(res.data?.message || 'Status updated.');
      fetchCustomers();
    } catch { toast.error('Failed to update status.'); }
  };

  const handleDeleteConfirm = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await deleteCustomer(toDelete.id);
      toast.success(`"${toDelete.full_name}" deleted.`);
      setToDelete(null); setShowConfirm(false); fetchCustomers();
    } catch { toast.error('Delete failed.'); }
    finally { setDeleting(false); }
  };

  // Build sales data map keyed by name (lowercase)
  const salesMap = {};
  (analytics?.customers || []).forEach(c => { salesMap[c.customer_name?.toLowerCase()] = c; });

  const kpis = analytics?.kpis || {};
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  const getAvatar = (c) => {
    if (c.profile_image) return c.profile_image.startsWith('http') ? c.profile_image : `${API_URL}${c.profile_image}`;
    return null;
  };
  const initials = (c) => `${c.first_name?.[0] || ''}${c.last_name?.[0] || ''}`.toUpperCase();

  return (
    <div>
      {/* Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h4 style={{ fontWeight: 800, marginBottom: 2 }}>Customers</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>Customer database with purchase analytics</p>
        </div>
        <button className="btn btn-accent px-4 py-2 fw-semibold" style={{ borderRadius: 10 }} onClick={() => navigate('/customers/add')}>
          <i className="bi bi-plus-lg me-2"></i>Add Customer
        </button>
      </div>

      {/* KPI cards */}
      <div className="row g-3 mb-4">
        {[
          { label: 'Total Customers',  value: analyticsLoading ? '…' : (kpis.total_customers || totalCount), icon: 'bi-people-fill',       bg: '#eff6ff', color: '#2563eb' },
          { label: 'Repeat Customers', value: analyticsLoading ? '…' : `${kpis.repeat_customers || 0} (${kpis.repeat_pct || 0}%)`, icon: 'bi-arrow-repeat', bg: '#fefce8', color: '#ca8a04' },
          { label: 'Top Customer',     value: analyticsLoading ? '…' : (kpis.top_customer || '—'),            icon: 'bi-trophy-fill',       bg: '#f0fdf4', color: '#16a34a' },
          { label: 'Avg Spending',     value: analyticsLoading ? '…' : fmtCur(kpis.avg_spending),             icon: 'bi-wallet2',           bg: '#f5f3ff', color: '#7c3aed' },
        ].map(({ label, value, icon, bg, color }) => (
          <div className="col-6 col-md-3" key={label}>
            <div className="stat-card d-flex align-items-center gap-3">
              <div className="stat-icon" style={{ background: bg }}>
                <i className={`bi ${icon}`} style={{ color }}></i>
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: '1.1rem', lineHeight: 1.2 }} className="text-truncate">{value}</div>
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
              <input type="text" className="form-control" style={{ borderLeft: 'none' }} placeholder="Name, email, phone…" value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} />
            </div>
          </div>
          <div className="col-md-2">
            <label className="form-label">Type</label>
            <select className="form-select" value={customerType} onChange={reset(setCustomerType)}>
              <option value="">All</option>
              <option value="Individual">Individual</option>
              <option value="Business">Business</option>
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
              <option value="first_name">Name A→Z</option>
              <option value="-first_name">Name Z→A</option>
            </select>
          </div>
          <div className="col-md-2 d-flex align-items-end">
            {hasFilters && <button className="btn btn-ghost w-100" onClick={() => { setSearch(''); setCustomerType(''); setStatus(''); setOrdering('-created_at'); setCurrentPage(1); }}><i className="bi bi-x-lg me-2"></i>Clear</button>}
          </div>
        </div>
      </div>

      {/* Customer Table */}
      <div className="card-panel overflow-hidden">
        <div className="d-flex align-items-center justify-content-between px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>
            Customer List
            {totalCount > 0 && <span style={{ marginLeft: 8, background: '#fefce8', color: '#ca8a04', border: '1px solid #fde68a', borderRadius: 999, padding: '1px 10px', fontSize: '0.75rem', fontWeight: 700 }}>{totalCount}</span>}
          </span>
          <button className="btn btn-ghost btn-sm" style={{ fontSize: '0.8rem' }} onClick={fetchCustomers}>
            <i className="bi bi-arrow-clockwise me-1"></i>Refresh
          </button>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border" style={{ color: 'var(--accent)', width: '2rem', height: '2rem' }}></div>
          </div>
        ) : customers.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-people" style={{ fontSize: '2.5rem', color: 'var(--text-muted)', display: 'block', marginBottom: 12 }}></i>
            <h6 style={{ fontWeight: 700 }}>No Customers Found</h6>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Customers are auto-created when you import CSV data.</p>
          </div>
        ) : (
          <div className="p-3">
            <div className="table-responsive">
              <table className="data-table" style={{ fontSize: '0.82rem' }}>
                <thead>
                  <tr>
                    {['', 'Customer Name', 'Email', 'Phone', 'Total Orders', 'Total Spending', 'Last Purchase', 'Status', 'Actions'].map(h => <th key={h}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c) => {
                    const avatar = getAvatar(c);
                    const sales = salesMap[c.full_name?.toLowerCase()] || {};
                    return (
                      <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/customers/${c.id}`)}>
                        {/* Avatar */}
                        <td style={{ width: 48 }}>
                          {avatar
                            ? <img src={avatar} alt={c.full_name} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border)' }} />
                            : <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--accent)', color: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.78rem' }}>{initials(c)}</div>}
                        </td>
                        {/* Name */}
                        <td>
                          <div style={{ fontWeight: 600 }}>{c.full_name}</div>
                          {sales.is_repeat && <span style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: 999, padding: '1px 6px', fontSize: '0.68rem', fontWeight: 700 }}>Repeat</span>}
                        </td>
                        {/* Email */}
                        <td style={{ color: 'var(--text-secondary)', maxWidth: 180 }} className="text-truncate">{c.email}</td>
                        {/* Phone */}
                        <td style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{c.phone_number}</td>
                        {/* Orders from sales data */}
                        <td>
                          {sales.orders
                            ? <span style={{ fontWeight: 700, color: '#2563eb' }}>{sales.orders}</span>
                            : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                        </td>
                        {/* Spending */}
                        <td>
                          {sales.total_spent
                            ? <span style={{ fontWeight: 700, color: '#ca8a04' }}>{fmtCur(sales.total_spent)}</span>
                            : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                        </td>
                        {/* Last purchase */}
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                          {sales.last_purchase || '—'}
                        </td>
                        {/* Status */}
                        <td>
                          <span className={c.status === 'Active' ? 'badge-active' : 'badge-inactive'}>
                            <i className={`bi ${c.status === 'Active' ? 'bi-check-circle-fill' : 'bi-x-circle-fill'}`}></i>
                            {c.status}
                          </span>
                        </td>
                        {/* Actions */}
                        <td onClick={(e) => e.stopPropagation()}>
                          <div className="d-flex gap-2">
                            <button title="View" onClick={() => navigate(`/customers/${c.id}`)}
                              style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: 7, padding: '4px 10px', fontSize: '0.78rem', cursor: 'pointer' }}>
                              <i className="bi bi-eye"></i>
                            </button>
                            <button title="Edit" onClick={() => navigate(`/customers/edit/${c.id}`)}
                              style={{ background: '#fefce8', color: '#ca8a04', border: '1px solid #fde68a', borderRadius: 7, padding: '4px 10px', fontSize: '0.78rem', cursor: 'pointer' }}>
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button title={c.status === 'Active' ? 'Deactivate' : 'Activate'} onClick={() => handleStatusToggle(c)}
                              style={{ background: c.status === 'Active' ? '#fef3c7' : '#dcfce7', color: c.status === 'Active' ? '#d97706' : '#16a34a', border: `1px solid ${c.status === 'Active' ? '#fde68a' : '#bbf7d0'}`, borderRadius: 7, padding: '4px 10px', fontSize: '0.78rem', cursor: 'pointer' }}>
                              <i className={`bi ${c.status === 'Active' ? 'bi-toggle-on' : 'bi-toggle-off'}`}></i>
                            </button>
                            <button title="Delete" onClick={() => { setToDelete(c); setShowConfirm(true); }}
                              style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 7, padding: '4px 10px', fontSize: '0.78rem', cursor: 'pointer' }}>
                              <i className="bi bi-trash3"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination currentPage={currentPage} totalPages={totalPages} totalCount={totalCount} pageSize={PAGE_SIZE} onPageChange={setCurrentPage} />
          </div>
        )}
      </div>

      {/* AI Customer Insights */}
      <AIInsightPanel analytics={analytics} loading={analyticsLoading} />

      {/* Delete confirm */}
      {showConfirm && toDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card-panel p-4" style={{ maxWidth: 420, width: '90%' }}>
            <div className="d-flex align-items-center gap-3 mb-3">
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#fef2f2', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="bi bi-trash3-fill" style={{ color: '#dc2626' }}></i>
              </div>
              <h5 style={{ fontWeight: 800, margin: 0 }}>Delete Customer</h5>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              Delete <strong>{toDelete.full_name}</strong>? This cannot be undone.
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

export default CustomerList;
