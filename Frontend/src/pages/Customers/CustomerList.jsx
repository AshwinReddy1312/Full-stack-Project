/**
 * CustomerList.jsx
 * ----------------
 * Main customer listing page with search, filters, sort, pagination and delete modal.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getCustomers, deleteCustomer, toggleCustomerStatus } from '../../services/customerService';
import CustomerTable from '../../components/customers/CustomerTable';
import Pagination from '../../components/products/Pagination';
import DeleteModal from '../../components/products/DeleteModal';

const PAGE_SIZE = 10;

const CustomerList = () => {
  const navigate = useNavigate();

  const [customers, setCustomers]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [deleting, setDeleting]     = useState(false);
  const [toDelete, setToDelete]     = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages]   = useState(1);
  const [totalCount, setTotalCount]   = useState(0);

  const [search, setSearch]             = useState('');
  const [customerType, setCustomerType] = useState('');
  const [status, setStatus]             = useState('');
  const [city, setCity]                 = useState('');
  const [ordering, setOrdering]         = useState('-created_at');

  // Stats (computed from current page — full totals come from API count)
  const activeCount   = customers.filter(c => c.status === 'Active').length;
  const inactiveCount = customers.filter(c => c.status === 'Inactive').length;
  const bizCount      = customers.filter(c => c.customer_type === 'Business').length;

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage, page_size: PAGE_SIZE, ordering,
        ...(search       && { search }),
        ...(customerType && { customer_type: customerType }),
        ...(status       && { status }),
        ...(city         && { city }),
      };
      const res = await getCustomers(params);
      const d = res.data?.data || {};
      setCustomers(d.results || []);
      setTotalPages(d.total_pages || 1);
      setTotalCount(d.count || 0);
    } catch {
      toast.error('Failed to load customers.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, customerType, status, city, ordering]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const reset = (setter) => (e) => { setter(e.target.value); setCurrentPage(1); };
  const hasFilters = search || customerType || status || city || ordering !== '-created_at';

  const clearFilters = () => {
    setSearch(''); setCustomerType(''); setStatus(''); setCity('');
    setOrdering('-created_at'); setCurrentPage(1);
  };

  const handleDeleteClick   = (c) => setToDelete(c);
  const handleDeleteConfirm = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await deleteCustomer(toDelete.id);
      toast.success(`"${toDelete.full_name}" deleted.`);
      setToDelete(null);
      fetchCustomers();
    } catch { toast.error('Failed to delete customer.'); }
    finally { setDeleting(false); }
  };

  const handleStatusToggle = async (c) => {
    try {
      const res = await toggleCustomerStatus(c.id);
      toast.success(res.data?.message || 'Status updated.');
      fetchCustomers();
    } catch { toast.error('Failed to update status.'); }
  };

  return (
    <div>
      {/* Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h4 style={{ fontWeight: 800, marginBottom: 2 }}>Customers</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
            Manage your customer database
          </p>
        </div>
        <button className="btn btn-accent px-4 py-2 fw-semibold" onClick={() => navigate('/customers/add')}>
          <i className="bi bi-plus-lg me-2"></i>Add Customer
        </button>
      </div>

      {/* Stat cards */}
      <div className="row g-3 mb-4">
        {[
          { label: 'Total Customers', value: totalCount,   icon: 'bi-people-fill',       bg: '#eff6ff', color: '#2563eb' },
          { label: 'Active',          value: activeCount,  icon: 'bi-check-circle-fill',  bg: '#f0fdf4', color: '#16a34a' },
          { label: 'Inactive',        value: inactiveCount,icon: 'bi-x-circle-fill',      bg: '#fef2f2', color: '#dc2626' },
          { label: 'Business',        value: bizCount,     icon: 'bi-building-fill',      bg: '#fefce8', color: '#ca8a04' },
        ].map(({ label, value, icon, bg, color }) => (
          <div className="col-6 col-md-3" key={label}>
            <div className="stat-card d-flex align-items-center gap-3">
              <div className="stat-icon" style={{ background: bg }}>
                <i className={`bi ${icon}`} style={{ color }}></i>
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.3rem', lineHeight: 1 }}>{value}</div>
                <small style={{ color: 'var(--text-muted)' }}>{label}</small>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="card-panel p-4 mb-4">
        <div className="row g-3 align-items-end">
          {/* Search */}
          <div className="col-md-4">
            <label className="form-label">Search</label>
            <div className="input-group">
              <span className="input-group-text" style={{ borderRight: 'none' }}>
                <i className="bi bi-search" style={{ fontSize: '0.85rem' }}></i>
              </span>
              <input
                type="text"
                className="form-control"
                style={{ borderLeft: 'none' }}
                placeholder="Name, email, phone, ID…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              />
            </div>
          </div>

          {/* Type */}
          <div className="col-md-2">
            <label className="form-label">Type</label>
            <select className="form-select" value={customerType} onChange={reset(setCustomerType)}>
              <option value="">All</option>
              <option value="Individual">Individual</option>
              <option value="Business">Business</option>
            </select>
          </div>

          {/* Status */}
          <div className="col-md-2">
            <label className="form-label">Status</label>
            <select className="form-select" value={status} onChange={reset(setStatus)}>
              <option value="">All</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {/* Sort */}
          <div className="col-md-2">
            <label className="form-label">Sort By</label>
            <select className="form-select" value={ordering} onChange={reset(setOrdering)}>
              <option value="-created_at">Newest First</option>
              <option value="created_at">Oldest First</option>
              <option value="first_name">Name A→Z</option>
              <option value="-first_name">Name Z→A</option>
            </select>
          </div>

          {/* Clear */}
          <div className="col-md-2 d-flex align-items-end">
            {hasFilters && (
              <button className="btn btn-ghost w-100" onClick={clearFilters}>
                <i className="bi bi-x-lg me-2"></i>Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table card */}
      <div className="card-panel overflow-hidden">
        <div className="d-flex align-items-center justify-content-between px-4 py-3"
          style={{ borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>
            Customer List
            {totalCount > 0 && (
              <span style={{
                marginLeft: 8, background: '#fefce8', color: '#ca8a04',
                border: '1px solid #fde68a', borderRadius: 999,
                padding: '1px 10px', fontSize: '0.75rem', fontWeight: 700,
              }}>{totalCount}</span>
            )}
          </span>
          <button
            className="btn btn-ghost btn-sm"
            style={{ fontSize: '0.8rem' }}
            onClick={fetchCustomers}
          >
            <i className="bi bi-arrow-clockwise me-1"></i>Refresh
          </button>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border" role="status"
              style={{ width: '2.2rem', height: '2.2rem', borderColor: 'var(--accent)', borderRightColor: 'transparent' }}>
              <span className="visually-hidden">Loading…</span>
            </div>
            <p style={{ color: 'var(--text-muted)', marginTop: 12, fontSize: '0.875rem' }}>Loading customers…</p>
          </div>
        ) : (
          <div className="p-3">
            <CustomerTable
              customers={customers}
              onDeleteClick={handleDeleteClick}
              onStatusToggle={handleStatusToggle}
            />
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalCount={totalCount}
              pageSize={PAGE_SIZE}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {/* Delete Modal */}
      <DeleteModal
        modalId="deleteCustomerModal"
        title="Delete Customer"
        message={toDelete ? `Are you sure you want to delete "${toDelete.full_name}"? This cannot be undone.` : ''}
        onConfirm={handleDeleteConfirm}
        loading={deleting}
      />
    </div>
  );
};

export default CustomerList;
