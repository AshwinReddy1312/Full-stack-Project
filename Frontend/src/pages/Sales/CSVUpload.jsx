/**
 * CSVUpload.jsx
 * -------------
 * Three-step workflow:
 *   Step 1 — Drop / select CSV file  →  upload & validate
 *   Step 2 — Preview the parsed rows →  review validation errors
 *   Step 3 — Confirm import          →  show summary
 */
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { uploadCSV, confirmUpload } from '../../services/salesService';

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) =>
  typeof n === 'number'
    ? n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : n;

const STEPS = ['Upload File', 'Preview Data', 'Import Summary'];

const StepIndicator = ({ current }) => (
  <div className="d-flex align-items-center justify-content-center gap-0 mb-4">
    {STEPS.map((label, idx) => {
      const done   = idx < current;
      const active = idx === current;
      return (
        <React.Fragment key={label}>
          <div className="d-flex flex-column align-items-center" style={{ minWidth: 90 }}>
            <div
              style={{
                width: 36, height: 36, borderRadius: '50%',
                background: done ? '#16a34a' : active ? 'var(--accent)' : 'var(--bg-secondary)',
                border: `2px solid ${done ? '#16a34a' : active ? 'var(--accent)' : 'var(--border)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: '0.85rem',
                color: done || active ? '#1a1a1a' : 'var(--text-muted)',
                transition: 'all 0.3s',
              }}
            >
              {done ? <i className="bi bi-check-lg"></i> : idx + 1}
            </div>
            <small style={{ marginTop: 4, fontSize: '0.72rem', fontWeight: active ? 700 : 500, color: active ? 'var(--text-primary)' : 'var(--text-muted)' }}>
              {label}
            </small>
          </div>
          {idx < STEPS.length - 1 && (
            <div style={{ flex: 1, height: 2, background: done ? '#16a34a' : 'var(--border)', marginBottom: 20, transition: 'background 0.3s' }} />
          )}
        </React.Fragment>
      );
    })}
  </div>
);

// ── Preview table ────────────────────────────────────────────────────────────
const PreviewTable = ({ rows }) => {
  if (!rows || rows.length === 0) return null;
  const cols = Object.keys(rows[0]);
  return (
    <div className="table-responsive" style={{ maxHeight: 380, overflowY: 'auto' }}>
      <table className="data-table" style={{ fontSize: '0.8rem' }}>
        <thead>
          <tr>
            <th style={{ minWidth: 30 }}>#</th>
            {cols.map(c => <th key={c}>{c.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
              {cols.map(c => (
                <td key={c}>
                  {typeof row[c] === 'number' && (c.includes('price') || c.includes('amount') || c.includes('profit'))
                    ? '₹' + fmt(row[c])
                    : row[c] ?? '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ── Error table ───────────────────────────────────────────────────────────────
const ErrorTable = ({ errors }) => {
  if (!errors || errors.length === 0) return null;
  return (
    <div style={{ maxHeight: 260, overflowY: 'auto', borderRadius: 10, border: '1px solid #fecaca' }}>
      <table className="data-table" style={{ fontSize: '0.8rem' }}>
        <thead>
          <tr>
            <th>Row</th>
            <th>Column</th>
            <th>Error</th>
          </tr>
        </thead>
        <tbody>
          {errors.map((e, i) => (
            <tr key={i}>
              <td><span style={{ background: '#fee2e2', color: '#dc2626', borderRadius: 4, padding: '1px 7px', fontWeight: 700 }}>{e.row || 'Header'}</span></td>
              <td style={{ fontWeight: 600 }}>{e.column}</td>
              <td style={{ color: '#dc2626' }}>{e.error}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ── Summary card ──────────────────────────────────────────────────────────────
const SummaryCard = ({ label, value, icon, bg, color }) => (
  <div className="stat-card d-flex align-items-center gap-3">
    <div className="stat-icon" style={{ background: bg }}>
      <i className={`bi ${icon}`} style={{ color }}></i>
    </div>
    <div>
      <div style={{ fontWeight: 800, fontSize: '1.4rem', lineHeight: 1 }}>{value}</div>
      <small style={{ color: 'var(--text-muted)' }}>{label}</small>
    </div>
  </div>
);

// ── Main Component ────────────────────────────────────────────────────────────
const CSVUpload = () => {
  const navigate  = useNavigate();
  const fileRef   = useRef(null);
  const [step, setStep]               = useState(0);
  const [dragging, setDragging]       = useState(false);
  const [file, setFile]               = useState(null);
  const [uploading, setUploading]     = useState(false);
  const [uploadProgress, setProgress] = useState(0);
  const [confirming, setConfirming]   = useState(false);

  // From backend after upload
  const [uploadId, setUploadId]       = useState(null);
  const [totalRows, setTotalRows]     = useState(0);
  const [preview, setPreview]         = useState([]);
  const [validationErrors, setVErrors]= useState([]);

  // From backend after confirm
  const [summary, setSummary]         = useState(null);

  // ── File selection ─────────────────────────────────────────────────────────
  const handleFile = (selected) => {
    if (!selected) return;
    if (!selected.name.toLowerCase().endsWith('.csv')) {
      toast.error('Only CSV files are accepted.');
      return;
    }
    setFile(selected);
    setVErrors([]);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  // ── Step 1 → 2: Upload & validate ─────────────────────────────────────────
  const handleUpload = async () => {
    if (!file) { toast.error('Please select a CSV file first.'); return; }
    setUploading(true);
    setProgress(0);
    try {
      const res = await uploadCSV(file, setProgress);
      if (res.data?.success) {
        const d = res.data.data;
        setUploadId(d.upload_id);
        setTotalRows(d.total_rows);
        setPreview(d.preview || []);
        setVErrors([]);
        toast.success(`Validated! ${d.total_rows} rows found. Review preview below.`);
        setStep(1);
      } else {
        toast.error(res.data?.message || 'Upload failed.');
      }
    } catch (err) {
      const apiErrors = err.response?.data?.errors;
      const msg       = err.response?.data?.message || 'Validation failed.';
      if (apiErrors && Array.isArray(apiErrors)) {
        setVErrors(apiErrors);
        toast.error(msg);
      } else {
        toast.error(msg);
      }
    } finally {
      setUploading(false);
    }
  };

  // ── Step 2 → 3: Confirm & process ─────────────────────────────────────────
  const handleConfirm = async () => {
    setConfirming(true);
    try {
      const res = await confirmUpload(uploadId);
      if (res.data?.success) {
        setSummary(res.data.data);
        toast.success('Data imported successfully!');
        setStep(2);
      } else {
        toast.error(res.data?.message || 'Import failed.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Import failed.');
    } finally {
      setConfirming(false);
    }
  };

  const resetAll = () => {
    setStep(0); setFile(null); setUploadId(null);
    setPreview([]); setVErrors([]); setSummary(null); setProgress(0);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div className="d-flex align-items-center gap-3 mb-4">
        <button className="btn btn-ghost btn-sm px-3" onClick={() => navigate('/uploads')}>
          <i className="bi bi-arrow-left me-2"></i>History
        </button>
        <div>
          <h4 style={{ fontWeight: 800, marginBottom: 2 }}>Import Business Data</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
            Upload a CSV file to process your sales data
          </p>
        </div>
      </div>

      {/* Step indicator */}
      <StepIndicator current={step} />

      {/* ── STEP 0: Upload ── */}
      {step === 0 && (
        <div className="card-panel p-4">
          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => fileRef.current?.click()}
            style={{
              border: `2px dashed ${dragging ? 'var(--accent)' : file ? '#16a34a' : 'var(--border)'}`,
              borderRadius: 14,
              padding: '2.5rem 1rem',
              textAlign: 'center',
              cursor: 'pointer',
              background: dragging ? 'var(--accent-light)' : file ? '#f0fdf4' : 'var(--bg-secondary)',
              transition: 'all 0.2s',
              marginBottom: '1.5rem',
            }}
          >
            <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={(e) => handleFile(e.target.files[0])} />
            <i className={`bi ${file ? 'bi-file-earmark-check-fill' : 'bi-cloud-upload'}`}
              style={{ fontSize: '2.5rem', color: file ? '#16a34a' : 'var(--text-muted)', display: 'block', marginBottom: 10 }}></i>
            {file ? (
              <>
                <div style={{ fontWeight: 700, color: '#16a34a', marginBottom: 4 }}>{file.name}</div>
                <small style={{ color: 'var(--text-muted)' }}>{(file.size / 1024).toFixed(1)} KB — click to change</small>
              </>
            ) : (
              <>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>Drag & drop your CSV file here</div>
                <small style={{ color: 'var(--text-muted)' }}>or click to browse — CSV files only, max 20 MB</small>
              </>
            )}
          </div>

          {/* Validation errors from failed upload */}
          {validationErrors.length > 0 && (
            <div className="mb-4">
              <div className="d-flex align-items-center gap-2 mb-2">
                <i className="bi bi-exclamation-triangle-fill" style={{ color: '#dc2626' }}></i>
                <span style={{ fontWeight: 700, color: '#dc2626', fontSize: '0.875rem' }}>
                  {validationErrors.length} validation error(s) found
                </span>
              </div>
              <ErrorTable errors={validationErrors} />
            </div>
          )}

          {/* Upload progress */}
          {uploading && (
            <div className="mb-4">
              <div className="d-flex justify-content-between mb-1">
                <small style={{ color: 'var(--text-muted)' }}>Uploading & validating…</small>
                <small style={{ fontWeight: 700 }}>{uploadProgress}%</small>
              </div>
              <div className="progress-bar-track">
                <div className="progress-bar-fill" style={{ width: uploadProgress + '%' }}></div>
              </div>
            </div>
          )}

          {/* Column guide */}
          <div style={{ background: 'var(--bg-secondary)', borderRadius: 10, padding: '1rem 1.25rem', marginBottom: '1.5rem', border: '1px solid var(--border)' }}>
            <div style={{ fontWeight: 700, fontSize: '0.8rem', marginBottom: 8, color: 'var(--text-secondary)' }}>
              <i className="bi bi-info-circle me-2"></i>Expected CSV Columns
            </div>
            <div className="row g-1">
              {[
                { col: 'Date', req: true },       { col: 'Product Name', req: true },
                { col: 'Category', req: false },  { col: 'Customer Name', req: true },
                { col: 'Quantity', req: true },   { col: 'Cost Price', req: false },
                { col: 'Selling Price', req: true }, { col: 'Total Amount', req: false },
              ].map(({ col, req }) => (
                <div key={col} className="col-6 col-md-3">
                  <span style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ color: req ? '#dc2626' : '#16a34a', fontWeight: 700 }}>{req ? '✱' : '○'}</span>
                    {col}
                  </span>
                </div>
              ))}
            </div>
            <small style={{ color: 'var(--text-muted)', marginTop: 6, display: 'block' }}>
              <span style={{ color: '#dc2626' }}>✱</span> Required &nbsp;&nbsp; <span style={{ color: '#16a34a' }}>○</span> Optional
            </small>
          </div>

          <button
            className="btn btn-accent w-100 py-2 fw-semibold"
            style={{ borderRadius: 10 }}
            onClick={handleUpload}
            disabled={!file || uploading}
          >
            {uploading
              ? <><span className="spinner-border spinner-border-sm me-2"></span>Validating…</>
              : <><i className="bi bi-upload me-2"></i>Upload & Validate</>}
          </button>
        </div>
      )}

      {/* ── STEP 1: Preview ── */}
      {step === 1 && (
        <div>
          {/* Stats */}
          <div className="row g-3 mb-4">
            {[
              { label: 'Total Rows',    value: totalRows,       icon: 'bi-table',         bg: '#eff6ff', color: '#2563eb' },
              { label: 'Preview Rows',  value: preview.length,  icon: 'bi-eye',           bg: '#fefce8', color: '#ca8a04' },
              { label: 'File',          value: file?.name,      icon: 'bi-file-earmark-text', bg: '#f0fdf4', color: '#16a34a' },
              { label: 'Ready to Import', value: '✓',           icon: 'bi-check-circle',  bg: '#f0fdf4', color: '#16a34a' },
            ].map(({ label, value, icon, bg, color }) => (
              <div className="col-6 col-md-3" key={label}>
                <SummaryCard label={label} value={value} icon={icon} bg={bg} color={color} />
              </div>
            ))}
          </div>

          {/* Preview table */}
          <div className="card-panel p-4 mb-4">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                Data Preview
                <span style={{ marginLeft: 8, background: '#fefce8', color: '#ca8a04', border: '1px solid #fde68a', borderRadius: 999, padding: '1px 10px', fontSize: '0.75rem' }}>
                  First {preview.length} rows
                </span>
              </div>
            </div>
            <PreviewTable rows={preview} />
            {totalRows > preview.length && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 8, marginBottom: 0 }}>
                <i className="bi bi-info-circle me-1"></i>
                Showing first {preview.length} of {totalRows} rows. All rows will be imported on confirmation.
              </p>
            )}
          </div>

          <div className="d-flex gap-3 justify-content-end">
            <button className="btn btn-ghost px-4" onClick={resetAll}>
              <i className="bi bi-arrow-left me-2"></i>Start Over
            </button>
            <button
              className="btn btn-accent px-5 py-2 fw-semibold"
              style={{ borderRadius: 10 }}
              onClick={handleConfirm}
              disabled={confirming}
            >
              {confirming
                ? <><span className="spinner-border spinner-border-sm me-2"></span>Importing {totalRows} rows…</>
                : <><i className="bi bi-check-circle me-2"></i>Confirm & Import {totalRows} Rows</>}
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 2: Summary ── */}
      {step === 2 && summary && (
        <div>
          {/* Success banner */}
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 14, padding: '1.25rem 1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: 12 }}>
            <i className="bi bi-check-circle-fill" style={{ color: '#16a34a', fontSize: '1.5rem', flexShrink: 0 }}></i>
            <div>
              <div style={{ fontWeight: 700, color: '#15803d', fontSize: '1rem' }}>Import Completed Successfully!</div>
              <div style={{ color: '#166534', fontSize: '0.85rem' }}>
                Processed in <strong>{summary.processing_time}</strong>. Your data is ready for Dashboard & AI Analysis.
              </div>
            </div>
          </div>

          {/* Summary stat cards */}
          <div className="row g-3 mb-4">
            {[
              { label: 'Total Rows',   value: summary.total_rows,  icon: 'bi-table',              bg: '#eff6ff', color: '#2563eb' },
              { label: 'Imported',     value: summary.imported,    icon: 'bi-check-circle-fill',  bg: '#f0fdf4', color: '#16a34a' },
              { label: 'Failed',       value: summary.failed,      icon: 'bi-x-circle-fill',      bg: '#fef2f2', color: '#dc2626' },
              { label: 'Duplicates',   value: summary.duplicates,  icon: 'bi-copy',               bg: '#fefce8', color: '#ca8a04' },
            ].map(({ label, value, icon, bg, color }) => (
              <div className="col-6 col-md-3" key={label}>
                <SummaryCard label={label} value={value} icon={icon} bg={bg} color={color} />
              </div>
            ))}
          </div>

          {/* Error table if any */}
          {summary.error_count > 0 && (
            <div className="card-panel p-4 mb-4">
              <div style={{ fontWeight: 700, color: '#dc2626', marginBottom: 12, fontSize: '0.875rem' }}>
                <i className="bi bi-exclamation-triangle me-2"></i>
                {summary.error_count} row(s) could not be imported
              </div>
              <ErrorTable errors={summary.errors || []} />
            </div>
          )}

          <div className="d-flex gap-3 justify-content-end">
            <button className="btn btn-ghost px-4" onClick={resetAll}>
              <i className="bi bi-upload me-2"></i>Upload Another File
            </button>
            <button
              className="btn btn-accent px-5 py-2 fw-semibold"
              style={{ borderRadius: 10 }}
              onClick={() => navigate('/uploads')}
            >
              <i className="bi bi-clock-history me-2"></i>View Upload History
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CSVUpload;
