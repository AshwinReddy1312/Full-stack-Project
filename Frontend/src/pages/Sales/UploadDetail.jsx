/**
 * UploadDetail.jsx
 * ----------------
 * Shows full detail of a single upload batch:
 * - Summary metrics
 * - Sample records table
 * - Error log if any
 */
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getUpload, deleteUpload } from '../../services/salesService';

const UploadDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [upload, setUpload]     = useState(null);
  const [loading, setLoading]   = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState('records');

  useEffect(() => {
    getUpload(id)
      .then(res => setUpload(res.data?.data))
      .catch(() => { toast.error('Upload not found.'); navigate('/uploads'); })
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteUpload(id);
      toast.success('Upload deleted.');
      navigate('/uploads');
    } catch {
      toast.error('Failed to delete.');
      setDeleting(false);
      setShowConfirm(false);
    }
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleString() : '—';
  const fmtCur  = (v) => v != null ? '₹' + Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '—';

  if (loading) return (
    <div className="text-center py-5">
      <div className="spinner-border" style={{ color: 'var(--accent)' }}></div>
    </div>
  );
  if (!upload) return null;

  const statusColors = {
    Completed:  { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
    Failed:     { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
    Pending:    { bg: '#fefce8', color: '#ca8a04', border: '#fde68a' },
    Processing: { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
  };
  const sc = statusColors[upload.status] || statusColors.Pending;

  return (
    <div>
      {/* Header */}
      <div className="d-flex align-items-center gap-3 mb-4">
        <button className="btn btn-ghost btn-sm px-3" onClick={() => navigate('/uploads')}>
          <i className="bi bi-arrow-left me-2"></i>Back
        </button>
        <div style={{ flex: 1 }}>
          <h4 style={{ fontWeight: 800, marginBottom: 2 }}>{upload.filename}</h4>
          <small style={{ color: 'var(--text-muted)' }}>
            {upload.upload_id} · Uploaded {fmtDate(upload.created_at)}
          </small>
        </div>
        <span style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`,
          borderRadius: 999, padding: '4px 14px', fontWeight: 700, fontSize: '0.78rem' }}>
          {upload.status}
        </span>
        <button
          className="btn"
          style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 8, fontWeight: 600, fontSize: '0.82rem' }}
          onClick={() => setShowConfirm(true)}
        >
          <i className="bi bi-trash3 me-2"></i>Delete
        </button>
      </div>

      {/* Stat cards */}
      <div className="row g-3 mb-4">
        {[
          { label: 'Total Rows',    value: upload.total_rows,     color: '#2563eb', bg: '#eff6ff', icon: 'bi-table' },
          { label: 'Imported',      value: upload.imported_count, color: '#16a34a', bg: '#f0fdf4', icon: 'bi-check-circle-fill' },
          { label: 'Failed',        value: upload.failed_count,   color: '#dc2626', bg: '#fef2f2', icon: 'bi-x-circle-fill' },
          { label: 'Duplicates',    value: upload.duplicate_count,color: '#ca8a04', bg: '#fefce8', icon: 'bi-copy' },
          { label: 'Success Rate',  value: (upload.success_rate || 0) + '%', color: '#7c3aed', bg: '#f5f3ff', icon: 'bi-graph-up' },
          { label: 'Process Time',  value: upload.processing_time + 's', color: '#0891b2', bg: '#ecfeff', icon: 'bi-clock' },
        ].map(({ label, value, color, bg, icon }) => (
          <div className="col-6 col-md-2" key={label}>
            <div className="stat-card d-flex align-items-center gap-3">
              <div className="stat-icon" style={{ background: bg }}>
                <i className={`bi ${icon}`} style={{ color }}></i>
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.1rem', lineHeight: 1 }}>{value}</div>
                <small style={{ color: 'var(--text-muted)' }}>{label}</small>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="d-flex gap-2 mb-3">
        {['records', 'errors'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            style={{
              padding: '6px 18px', borderRadius: 8, fontWeight: 600, fontSize: '0.82rem',
              cursor: 'pointer', border: 'none',
              background: activeTab === tab ? 'var(--accent)' : 'var(--bg-secondary)',
              color: activeTab === tab ? '#1a1a1a' : 'var(--text-muted)',
            }}>
            {tab === 'records' ? `Sample Records (${(upload.sample_records || []).length})` : `Errors (${(upload.error_log || []).length})`}
          </button>
        ))}
      </div>

      {/* Sample Records */}
      {activeTab === 'records' && (
        <div className="card-panel overflow-hidden">
          <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: '0.875rem' }}>
            Sample Records <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.8rem' }}>(first 10 rows)</span>
          </div>
          {!upload.sample_records?.length ? (
            <div className="text-center py-4" style={{ color: 'var(--text-muted)' }}>No records to display.</div>
          ) : (
            <div className="table-responsive p-3">
              <table className="data-table" style={{ fontSize: '0.8rem' }}>
                <thead>
                  <tr>
                    {['Date', 'Product', 'Category', 'Customer', 'Qty', 'Selling Price', 'Total', 'Profit'].map(h => <th key={h}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {upload.sample_records.map((r, i) => (
                    <tr key={i}>
                      <td>{r.sale_date}</td>
                      <td style={{ fontWeight: 600 }}>{r.product_name}</td>
                      <td><span style={{ background: '#f3f4f6', padding: '2px 8px', borderRadius: 6, fontSize: '0.75rem' }}>{r.category || '—'}</span></td>
                      <td>{r.customer_name}</td>
                      <td>{r.quantity}</td>
                      <td>{fmtCur(r.selling_price)}</td>
                      <td style={{ fontWeight: 700, color: '#ca8a04' }}>{fmtCur(r.total_amount)}</td>
                      <td style={{ color: '#16a34a' }}>{fmtCur(r.profit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Error log */}
      {activeTab === 'errors' && (
        <div className="card-panel overflow-hidden">
          <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: '0.875rem' }}>
            Error Log
          </div>
          {!upload.error_log?.length ? (
            <div className="text-center py-4" style={{ color: '#16a34a' }}>
              <i className="bi bi-check-circle-fill me-2"></i>No errors — all records imported successfully.
            </div>
          ) : (
            <div className="table-responsive p-3">
              <table className="data-table" style={{ fontSize: '0.8rem' }}>
                <thead>
                  <tr><th>Row</th><th>Column</th><th>Error</th></tr>
                </thead>
                <tbody>
                  {upload.error_log.map((e, i) => (
                    <tr key={i}>
                      <td><span style={{ background: '#fee2e2', color: '#dc2626', borderRadius: 4, padding: '1px 7px', fontWeight: 700 }}>{e.row || 'Header'}</span></td>
                      <td style={{ fontWeight: 600 }}>{e.column}</td>
                      <td style={{ color: '#dc2626' }}>{e.error}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Inline delete confirm dialog */}
      {showConfirm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)',
          backdropFilter: 'blur(4px)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div className="card-panel p-4" style={{ maxWidth: 420, width: '90%' }}>
            <div className="d-flex align-items-center gap-3 mb-3">
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#fef2f2', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="bi bi-trash3-fill" style={{ color: '#dc2626' }}></i>
              </div>
              <h5 style={{ fontWeight: 800, margin: 0 }}>Delete Upload</h5>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              Delete <strong>{upload.filename}</strong> and all <strong>{upload.imported_count}</strong> imported records? This cannot be undone.
            </p>
            <div className="d-flex gap-3 justify-content-end">
              <button className="btn btn-ghost px-4" onClick={() => setShowConfirm(false)} disabled={deleting}>Cancel</button>
              <button
                className="btn px-4 fw-semibold"
                style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8 }}
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? <><span className="spinner-border spinner-border-sm me-2"></span>Deleting…</> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadDetail;
