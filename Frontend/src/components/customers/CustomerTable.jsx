/**
 * CustomerTable.jsx
 * -----------------
 * Renders the customer data table with avatar, all columns and action buttons.
 *
 * Props:
 *   customers      – array of customer objects
 *   onDeleteClick  – (customer) => void
 *   onStatusToggle – (customer) => void
 *   loading        – bool
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const StatusBadge = ({ status }) => (
  <span className={status === 'Active' ? 'badge-active' : 'badge-inactive'}>
    <i className={`bi ${status === 'Active' ? 'bi-check-circle-fill' : 'bi-x-circle-fill'}`}></i>
    {status}
  </span>
);

const TypeBadge = ({ type }) => (
  <span className="badge-category">
    <i className={`bi ${type === 'Business' ? 'bi-building' : 'bi-person'} me-1`}></i>
    {type}
  </span>
);

const CustomerAvatar = ({ customer }) => {
  const imgSrc = customer.profile_image
    ? customer.profile_image.startsWith('http')
      ? customer.profile_image
      : `${API_URL}${customer.profile_image}`
    : null;

  const initials = `${customer.first_name?.[0] || ''}${customer.last_name?.[0] || ''}`.toUpperCase();

  if (imgSrc) {
    return (
      <img
        src={imgSrc}
        alt={customer.full_name}
        style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border)' }}
      />
    );
  }
  return (
    <div style={{
      width: 38, height: 38, borderRadius: '50%',
      background: 'var(--accent)', color: '#1a1a1a',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: '0.8rem', flexShrink: 0,
      border: '2px solid var(--border)',
    }}>
      {initials}
    </div>
  );
};

const CustomerTable = ({ customers, onDeleteClick, onStatusToggle }) => {
  const navigate = useNavigate();

  if (!customers || customers.length === 0) {
    return (
      <div className="text-center py-5">
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'var(--bg-secondary)', border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1rem',
        }}>
          <i className="bi bi-people" style={{ fontSize: '1.5rem', color: 'var(--text-muted)' }}></i>
        </div>
        <h6 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>No Customers Found</h6>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
          Try adjusting your search or filters, or add a new customer.
        </p>
      </div>
    );
  }

  return (
    <div className="table-responsive">
      <table className="data-table">
        <thead>
          <tr>
            {['', 'Customer ID', 'Name', 'Email', 'Phone', 'Type', 'City', 'Status', 'Created', 'Actions'].map(h => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {customers.map((c) => (
            <tr
              key={c.id}
              style={{ cursor: 'pointer' }}
              onClick={() => navigate(`/customers/${c.id}`)}
            >
              {/* Avatar */}
              <td style={{ width: 52 }}>
                <CustomerAvatar customer={c} />
              </td>

              {/* Customer ID */}
              <td>
                <span style={{
                  fontFamily: 'monospace', fontSize: '0.78rem',
                  background: 'var(--bg-secondary)', padding: '2px 8px',
                  borderRadius: 6, color: 'var(--text-secondary)',
                  border: '1px solid var(--border)',
                }}>
                  {c.customer_id}
                </span>
              </td>

              {/* Name */}
              <td>
                <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{c.full_name}</div>
                {c.company_name && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.company_name}</div>
                )}
              </td>

              {/* Email */}
              <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{c.email}</td>

              {/* Phone */}
              <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{c.phone_number}</td>

              {/* Type */}
              <td><TypeBadge type={c.customer_type} /></td>

              {/* City */}
              <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{c.city || '—'}</td>

              {/* Status */}
              <td><StatusBadge status={c.status} /></td>

              {/* Created */}
              <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                {new Date(c.created_at).toLocaleDateString()}
              </td>

              {/* Actions */}
              <td onClick={(e) => e.stopPropagation()}>
                <div className="d-flex gap-2">
                  {/* View */}
                  <button
                    title="View"
                    onClick={() => navigate(`/customers/${c.id}`)}
                    style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: 7, padding: '4px 10px', fontSize: '0.78rem', cursor: 'pointer' }}
                  >
                    <i className="bi bi-eye"></i>
                  </button>

                  {/* Edit */}
                  <button
                    title="Edit"
                    onClick={() => navigate(`/customers/edit/${c.id}`)}
                    style={{ background: '#fefce8', color: '#ca8a04', border: '1px solid #fde68a', borderRadius: 7, padding: '4px 10px', fontSize: '0.78rem', cursor: 'pointer' }}
                  >
                    <i className="bi bi-pencil"></i>
                  </button>

                  {/* Toggle status */}
                  <button
                    title={c.status === 'Active' ? 'Deactivate' : 'Activate'}
                    onClick={() => onStatusToggle(c)}
                    style={{
                      background: c.status === 'Active' ? '#fef3c7' : '#dcfce7',
                      color: c.status === 'Active' ? '#d97706' : '#16a34a',
                      border: `1px solid ${c.status === 'Active' ? '#fde68a' : '#bbf7d0'}`,
                      borderRadius: 7, padding: '4px 10px', fontSize: '0.78rem', cursor: 'pointer',
                    }}
                  >
                    <i className={`bi ${c.status === 'Active' ? 'bi-toggle-on' : 'bi-toggle-off'}`}></i>
                  </button>

                  {/* Delete */}
                  <button
                    title="Delete"
                    data-bs-toggle="modal"
                    data-bs-target="#deleteCustomerModal"
                    onClick={() => onDeleteClick(c)}
                    style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 7, padding: '4px 10px', fontSize: '0.78rem', cursor: 'pointer' }}
                  >
                    <i className="bi bi-trash3"></i>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CustomerTable;
