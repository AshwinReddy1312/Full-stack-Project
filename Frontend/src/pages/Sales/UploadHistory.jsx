/**
 * UploadHistory.jsx
 * -----------------
 * Lists all past CSV upload batches with status, summary metrics,
 * and actions to view detail, view errors, or delete.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getUploadHistory, deleteUpload } from '../../services/salesService';
import Pagination from '../../components/products/Pagination';
import DeleteModal from '../../components/products/DeleteModal';

const PAGE_SIZE = 15;

// ── Status badge ──────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const map = {
    Pending:    { bg: '#fefce8', color: '#ca8a04', border: '#fde68a', icon: 'bi-hourglass-split' },
    Processing: { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe', icon: 'bi-arrow-repeat' },
    Completed:  { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0', icon: 'bi-check-circle-fill' },
    Failed:     { bg: '#fef2f2', color: '#dc2626', border: '#fecaca', icon: 'bi-x-circle-fill' },
  };
  const s = map[status] || map.Pending;
  return (
    <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, borderRadius: 999, padding: '3px 10px', fontSize: '0.72rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <i className={`bi ${s.icon}`}></i>{status}
    </span>
  );
};

// ── Mini progress bar ─────────────────────────────────────────────────────────
const MiniProgress = ({ rate }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
    <div style={{ flex: 1, height: 6, background: '#e5e5e0', borderRadius: 999, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: rate + '%', background: rate === 100 ? '#16a34a' : 'var(--accent)', borderRadius: 999, transition: 'width 0.4s' }} />
    </div>
    <small style={{ fontWeight: 700, minWidth: 36, color: rate === 100 ? '#16a34a' : 'var(--text-primary)' }}>{rate}%</small>
  </div>
);

// ── Main Component ────────────────────────────────────────────────────────────
const UploadHistory = () => {
  const navigate = useNavigate();

  const [uploads, setUploads]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [deleting, setDeleting]   = useState(false);
  const [toDelete, setToDelete]   = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages]   = useState(1);
  const [totalCount, setTotalCount]   = useState(0);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getUploadHistory({ page: currentPage, page_size: PAGE_SIZE });
      const d = res.data?.data || {};
      setUploads(d.results || []);
      setTotalPages(d.total_pages || 1);
      setTotalCount(d.count || 0);
    } catch {
      toast.error('Failed to load upload history.');
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const handleDeleteConfirm = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await deleteUpload(toDelete.id);
      toast.success(`Upload "${toDelete.filename}" deleted.`);
      setToDelete(null);
      fetchHistory();
    } catch {
      toast.error('Failed to delete upload.');
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (d) =>
    d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

  // ── Aggregate stats ───────────────────────────────────────────────────────
  const totalImported  = uploads.reduce((s, u) => s + (u.imported_count || 0), 0);
  const totalRecords   = uploads.reduce((s, u) => s + (u.total_rows || 0), 0);
  const completedCount = uploads.filter(u => u.status === 'Completed').length;
  const failedCount    = uploads.filter(u => u.status === 'Failed').length;

  return (
    <div>
      {/* Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h4 style={{ fontWeight: 800, marginBottom: 2 }}>Upload History</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
            Track all CSV imports and their processing status
          </p>
        </div>
        <button
          className="btn btn-accent px-4 py-2 fw-semibold"
          onClick={() => navigate('/uploads/new')}
        >
          <i className="bi bi-upload me-2"></i>New Upload
        </button>
      </div>

      {/* Stat cards */}
      <div className="row g-3 mb-4">
        {[
          { label: 'Total Uploads',    value: totalCount,    icon: 'bi-file-earmark-arrow-up', bg: '#eff6ff', color: '#2563eb' },
          { label: 'Completed',        value: completedCount, icon: 'bi-check-circle-fill',    bg: '#f0fdf4', color: '#16a34a' },
          { label: 'Total Rows',       value: totalRecords.toLocaleString(), icon: 'bi-table', bg: '#fefce8', color: '#ca8a04' },
          { label: 'Records Imported', value: totalImported.toLocaleString(), icon: 'bi-database-fill-check', bg: '#f5f3ff', color: '#7c3aed' },
        ].map(({ label, value, icon, bg, color }) => (
          <div className="col-6 col-md-3" key={label}>
            <div className="stat-card d-flex align-items-center gap-3">
              <div className="stat-icon" style={{ background: bg }}>
                <i className={`bi ${icon}`} style={{ color }}></i>
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.25rem', lineHeight: 1 }}>{value}</div>
                <small style={{ color: 'var(--text-muted)' }}>{label}</small>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div className="card-panel overflow-hidden">
        <div className="d-flex align-items-center justify-content-between px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>
            All Uploads
            {totalCount > 0 && (
              <span style={{ marginLeft: 8, background: '#fefce8', color: '#ca8a04', border: '1px solid #fde68a', borderRadius: 999, padding: '1px 10px', fontSize: '0.75rem', fontWeight: 700 }}>
                {totalCount}
              </span>
            )}
          </span>
          <button className="btn btn-ghost btn-sm" style={{ fontSize: '0.8rem' }} onClick={fetchHistory}>
            <i className="bi bi-arrow-clockwise me-1"></i>Refresh
          </button>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border" style={{ color: 'var(--accent)', width: '2.2rem', height: '2.2rem' }}></div>
            <p style={{ color: 'var(--text-muted)', marginTop: 12, fontSize: '0.875rem' }}>Loading history…</p>
          </div>
        ) : uploads.length === 0 ? (
          <div className="text-center py-5">
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--bg-secondary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <i className="bi bi-file-earmark-x" style={{ fontSize: '1.5rem', color: 'var(--text-muted)' }}></i>
            </div>
            <h6 style={{ fontWeight: 700, marginBottom: 4 }}>No Uploads Yet</h6>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0 0 1rem' }}>
              Upload your first CSV file to get started
            </p>
            <button className="btn btn-accent px-4" onClick={() => navigate('/uploads/new')}>
              <i className="bi bi-upload me-2"></i>Upload Now
            </button>
          </div>
        ) : (
          <div className="p-3">
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    {['Upload ID', 'File Name', 'Status', 'Total', 'Imported', 'Failed', 'Dupes', 'Success Rate', 'Time', 'Uploaded', 'Actions'].map(h => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {uploads.map((u) => (
                    <tr key={u.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/uploads/${u.id}`)}>
                      {/* Upload ID */}
                      <td>
                        <span style={{ fontFamily: 'monospace', fontSize: '0.78rem', background: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: 6, border: '1px solid var(--border)' }}>
                          {u.upload_id}
                        </span>
                      </td>

                      {/* Filename */}
                      <td>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem', maxWidth: 160 }} className="text-truncate" title={u.filename}>
                          <i className="bi bi-file-earmark-spreadsheet me-2" style={{ color: '#16a34a' }}></i>
                          {u.filename}
                        </div>
                      </td>

                      {/* Status */}
                      <td><StatusBadge status={u.status} /></td>

                      {/* Counts */}
                      <td style={{ fontWeight: 600 }}>{u.total_rows}</td>
                      <td style={{ color: '#16a34a', fontWeight: 700 }}>{u.imported_count}</td>
                      <td style={{ color: u.failed_count > 0 ? '#dc2626' : 'var(--text-muted)', fontWeight: u.failed_count > 0 ? 700 : 400 }}>{u.failed_count}</td>
                      <td style={{ color: u.duplicate_count > 0 ? '#ca8a04' : 'var(--text-muted)' }}>{u.duplicate_count}</td>

                      {/* Success rate */}
                      <td style={{ minWidth: 110 }}>
                        {u.status === 'Completed' ? <MiniProgress rate={u.success_rate || 0} /> : '—'}
                      </td>

                      {/* Processing time */}
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {u.processing_time ? u.processing_time + 's' : '—'}
                      </td>

                      {/* Date */}
                      <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {formatDate(u.created_at)}
                      </td>

                      {/* Actions */}
                      <td onClick={(e) => e.stopPropagation()}>
                        <div className="d-flex gap-2">
                          <button
                            title="View Detail"
                            onClick={() => navigate(`/uploads/${u.id}`)}
                            style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: 7, padding: '4px 10px', fontSize: '0.78rem', cursor: 'pointer' }}
                          >
                            <i className="bi bi-eye"></i>
                          </button>
                          {u.failed_count > 0 && (
                            <button
                              title="View Errors"
                              onClick={() => navigate(`/uploads/${u.id}?tab=errors`)}
                              style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 7, padding: '4px 10px', fontSize: '0.78rem', cursor: 'pointer' }}
                            >
                              <i className="bi bi-bug"></i>
                            </button>
                          )}
                          <button
                            title="Delete"
                            data-bs-toggle="modal"
                            data-bs-target="#deleteUploadModal"
                            onClick={() => setToDelete(u)}
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

      <DeleteModal
        modalId="deleteUploadModal"
        title="Delete Upload"
        message={toDelete ? `Delete upload "${toDelete.filename}" and all ${toDelete.imported_count} imported records? This cannot be undone.` : ''}
        onConfirm={handleDeleteConfirm}
        loading={deleting}
      />
    </div>
  );
};

export default UploadHistory;
