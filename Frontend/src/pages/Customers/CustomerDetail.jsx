/**
 * CustomerDetail.jsx
 * ------------------
 * Full customer profile view.
 * Shows all fields, status badge, quick actions (Edit / Delete / Toggle Status).
 * Placeholder sections for future: Purchase History, Sales, AI Insights.
 */
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getCustomer, deleteCustomer, toggleCustomerStatus } from '../../services/customerService';
import DeleteModal from '../../components/products/DeleteModal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const InfoRow = ({ label, value }) => (
  <div className="d-flex justify-content-between align-items-start py-2"
    style={{ borderBottom: '1px solid var(--border)' }}>
    <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem', minWidth: 140 }}>{label}</span>
    <span style={{ fontWeight: 600, fontSize: '0.875rem', textAlign: 'right', color: 'var(--text-primary)' }}>
      {value || '—'}
    </span>
  </div>
);

const CustomerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    getCustomer(id)
      .then((res) => setCustomer(res.data?.data || null))
      .catch(() => { toast.error('Customer not found.'); navigate('/customers'); })
      .finally(() => setLoading(false));
  }, [id]);

  const handleToggleStatus = async () => {
    try {
      const res = await toggleCustomerStatus(id);
      toast.success(res.data?.message || 'Status updated.');
      setCustomer((prev) => ({ ...prev, status: res.data?.data?.status }));
    } catch { toast.error('Failed to update status.'); }
  };

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    try {
      await deleteCustomer(id);
      toast.success(`"${customer.full_name}" deleted.`);
      navigate('/customers');
    } catch { toast.error('Failed to delete.'); setDeleting(false); }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  const formatDateTime = (d) => d ? new Date(d).toLocaleString() : '—';

  if (loading) return (
    <div className="text-center py-5">
      <div className="spinner-border" style={{ color: 'var(--accent)', width: '2rem', height: '2rem' }}></div>
    </div>
  );
  if (!customer) return null;

  const imgSrc = customer.profile_image
    ? customer.profile_image.startsWith('http') ? customer.profile_image : `${API_URL}${customer.profile_image}`
    : null;

  const initials = `${customer.first_name?.[0] || ''}${customer.last_name?.[0] || ''}`.toUpperCase();
  const isActive = customer.status === 'Active';

  return (
    <div>
      {/* Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div className="d-flex align-items-center gap-3">
          <button className="btn btn-ghost btn-sm px-3" onClick={() => navigate('/customers')}>
            <i className="bi bi-arrow-left me-2"></i>Back
          </button>
          <div>
            <h4 style={{ fontWeight: 800, marginBottom: 2 }}>{customer.full_name}</h4>
            <small style={{ color: 'var(--text-muted)' }}>{customer.customer_id}</small>
          </div>
        </div>
        <div className="d-flex gap-2">
          <button
            className="btn btn-ghost px-3 fw-semibold"
            style={{ fontSize: '0.85rem', color: isActive ? '#d97706' : '#16a34a', borderColor: isActive ? '#fde68a' : '#bbf7d0' }}
            onClick={handleToggleStatus}
          >
            <i className={`bi ${isActive ? 'bi-toggle-on' : 'bi-toggle-off'} me-2`}></i>
            {isActive ? 'Deactivate' : 'Activate'}
          </button>
          <button
            className="btn btn-ghost px-3 fw-semibold"
            style={{ fontSize: '0.85rem', color: '#ca8a04', borderColor: '#fde68a' }}
            onClick={() => navigate(`/customers/edit/${id}`)}
          >
            <i className="bi bi-pencil me-2"></i>Edit
          </button>
          <button
            className="btn px-3 fw-semibold"
            style={{ fontSize: '0.85rem', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}
            data-bs-toggle="modal"
            data-bs-target="#deleteCustomerModal"
          >
            <i className="bi bi-trash3 me-2"></i>Delete
          </button>
        </div>
      </div>

      <div className="row g-4">
        {/* ── Left: Profile card ─────────────────────── */}
        <div className="col-lg-4">
          <div className="card-panel p-4 text-center mb-4">
            {/* Avatar */}
            {imgSrc ? (
              <img src={imgSrc} alt={customer.full_name}
                style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--accent)', marginBottom: 12 }} />
            ) : (
              <div style={{
                width: 100, height: 100, borderRadius: '50%',
                background: 'var(--accent)', color: '#1a1a1a',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: '1.8rem', margin: '0 auto 12px',
                border: '3px solid var(--border)',
              }}>{initials}</div>
            )}

            <h5 style={{ fontWeight: 800, marginBottom: 2 }}>{customer.full_name}</h5>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 12 }}>
              {customer.company_name || customer.email}
            </p>

            <div className="d-flex justify-content-center gap-2 mb-3">
              <span className={isActive ? 'badge-active' : 'badge-inactive'}>
                <i className={`bi ${isActive ? 'bi-check-circle-fill' : 'bi-x-circle-fill'}`}></i>
                {customer.status}
              </span>
              <span className="badge-category">
                <i className={`bi ${customer.customer_type === 'Business' ? 'bi-building' : 'bi-person'} me-1`}></i>
                {customer.customer_type}
              </span>
            </div>

            <div style={{ height: 1, background: 'var(--border)', margin: '1rem 0' }}></div>

            {/* Quick info */}
            <div className="text-start">
              {[
                { icon: 'bi-envelope', value: customer.email },
                { icon: 'bi-telephone', value: customer.phone_number },
                { icon: 'bi-geo-alt', value: [customer.city, customer.country].filter(Boolean).join(', ') || null },
                { icon: 'bi-calendar', value: formatDate(customer.date_of_birth) !== '—' ? `DOB: ${formatDate(customer.date_of_birth)}` : null },
              ].filter(i => i.value).map(({ icon, value }) => (
                <div key={icon} className="d-flex align-items-center gap-2 mb-2">
                  <i className={`bi ${icon}`} style={{ color: 'var(--text-muted)', fontSize: '0.875rem', width: 16 }}></i>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Future sections placeholder */}
          <div className="card-panel p-4"
            style={{ background: '#fefce8', border: '1px solid #fde68a' }}>
            <h6 style={{ fontWeight: 700, fontSize: '0.82rem', color: '#92400e', marginBottom: 8 }}>
              <i className="bi bi-stars me-2"></i>Coming Soon
            </h6>
            <ul style={{ margin: 0, padding: '0 0 0 1.2rem', color: '#a16207', fontSize: '0.8rem', lineHeight: 2 }}>
              <li>Purchase History</li>
              <li>Sales Analytics</li>
              <li>Revenue Analysis</li>
              <li>AI Customer Insights</li>
              <li>Marketing Recommendations</li>
            </ul>
          </div>
        </div>

        {/* ── Right: Detail sections ─────────────────── */}
        <div className="col-lg-8">

          {/* Personal */}
          <div className="card-panel p-4 mb-4">
            <h6 style={{ fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 16 }}>
              <i className="bi bi-person me-2"></i>Personal Information
            </h6>
            <InfoRow label="Full Name"       value={customer.full_name} />
            <InfoRow label="Customer ID"     value={customer.customer_id} />
            <InfoRow label="Gender"          value={customer.gender} />
            <InfoRow label="Date of Birth"   value={formatDate(customer.date_of_birth)} />
            <InfoRow label="Notes"           value={customer.notes} />
          </div>

          {/* Contact */}
          <div className="card-panel p-4 mb-4">
            <h6 style={{ fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 16 }}>
              <i className="bi bi-telephone me-2"></i>Contact Information
            </h6>
            <InfoRow label="Email Address" value={customer.email} />
            <InfoRow label="Phone Number"  value={customer.phone_number} />
          </div>

          {/* Address */}
          <div className="card-panel p-4 mb-4">
            <h6 style={{ fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 16 }}>
              <i className="bi bi-geo-alt me-2"></i>Address
            </h6>
            <InfoRow label="Street Address" value={customer.address} />
            <InfoRow label="City"           value={customer.city} />
            <InfoRow label="State"          value={customer.state} />
            <InfoRow label="Country"        value={customer.country} />
            <InfoRow label="Postal Code"    value={customer.postal_code} />
          </div>

          {/* Business */}
          <div className="card-panel p-4 mb-4">
            <h6 style={{ fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 16 }}>
              <i className="bi bi-building me-2"></i>Business Information
            </h6>
            <InfoRow label="Customer Type" value={customer.customer_type} />
            <InfoRow label="Company Name"  value={customer.company_name} />
            <InfoRow label="Status"        value={customer.status} />
          </div>

          {/* Audit */}
          <div className="card-panel p-4">
            <h6 style={{ fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 16 }}>
              <i className="bi bi-clock-history me-2"></i>Audit
            </h6>
            <InfoRow label="Created By"   value={customer.created_by_name} />
            <InfoRow label="Created At"   value={formatDateTime(customer.created_at)} />
            <InfoRow label="Last Updated" value={formatDateTime(customer.updated_at)} />
          </div>
        </div>
      </div>

      <DeleteModal
        modalId="deleteCustomerModal"
        title="Delete Customer"
        message={`Are you sure you want to delete "${customer.full_name}"? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        loading={deleting}
      />
    </div>
  );
};

export default CustomerDetail;
