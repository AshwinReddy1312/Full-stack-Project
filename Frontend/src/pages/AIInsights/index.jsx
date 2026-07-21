/**
 * AIInsights/index.jsx
 * --------------------
 * AI-powered business insights page.
 * Allows generating new reports and viewing past ones.
 */
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { generateInsights, getReports, getReport, deleteReport, getLatestReport } from '../../services/aiService';
import DeleteModal from '../../components/products/DeleteModal';

const PERIOD_OPTIONS = [
  { label: '7 Days',   value: '7d'   },
  { label: '30 Days',  value: '30d'  },
  { label: '90 Days',  value: '90d'  },
  { label: '6 Months', value: '180d' },
  { label: '1 Year',   value: '365d' },
  { label: 'All Time', value: 'all'  },
];

const REPORT_TYPES = [
  { value: 'full',            label: 'Full Analysis',        icon: 'bi-bar-chart-line-fill', color: '#6366f1' },
  { value: 'revenue',         label: 'Revenue Analysis',     icon: 'bi-currency-rupee',      color: '#f5c518' },
  { value: 'products',        label: 'Product Performance',  icon: 'bi-box-seam-fill',       color: '#22c55e' },
  { value: 'customers',       label: 'Customer Insights',    icon: 'bi-people-fill',         color: '#06b6d4' },
  { value: 'recommendations', label: 'Recommendations',      icon: 'bi-lightning-fill',      color: '#f97316' },
];

// ── Small helpers ──────────────────────────────────────────────────────────

const SeverityBadge = ({ level }) => {
  const map = {
    high:   { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
    medium: { bg: '#fefce8', color: '#ca8a04', border: '#fde68a' },
    low:    { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  };
  const s = map[level?.toLowerCase()] || map.medium;
  return (
    <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      borderRadius: 999, padding: '2px 10px', fontSize: '0.72rem', fontWeight: 700 }}>
      {level}
    </span>
  );
};

const ImpactBadge = ({ level }) => <SeverityBadge level={level} />;

const Section = ({ title, icon, color = '#6366f1', children }) => (
  <div className="card-panel p-4 mb-4">
    <h6 style={{ fontWeight: 700, fontSize: '0.82rem', textTransform: 'uppercase',
      letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 16 }}>
      <i className={`bi ${icon} me-2`} style={{ color }}></i>{title}
    </h6>
    {children}
  </div>
);

// ── Insight renderer ───────────────────────────────────────────────────────

const InsightRenderer = ({ insights, reportType }) => {
  if (!insights) return null;

  const renderList = (items) => (
    <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
      {(items || []).map((item, i) => (
        <li key={i} style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 6, lineHeight: 1.6 }}>
          {typeof item === 'string' ? item : item.title || item.name || JSON.stringify(item)}
        </li>
      ))}
    </ul>
  );

  const renderRecs = (recs) => (
    <div className="d-flex flex-column gap-3">
      {(recs || []).map((r, i) => (
        <div key={i} style={{ background: 'var(--bg-secondary)', borderRadius: 10, padding: '12px 16px',
          border: '1px solid var(--border)', display: 'flex', gap: 12 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: '0.78rem', flexShrink: 0 }}>
            {r.priority || i + 1}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: 4 }}>{r.title || r.action}</div>
            {r.action && r.action !== r.title && (
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 4 }}>{r.action}</div>
            )}
            {r.expected_outcome && (
              <div style={{ fontSize: '0.78rem', color: '#16a34a' }}>
                <i className="bi bi-check-circle me-1"></i>{r.expected_outcome}
              </div>
            )}
            {r.timeframe && (
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
                <i className="bi bi-clock me-1"></i>{r.timeframe}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  const renderAlerts = (alerts) => (
    <div className="d-flex flex-column gap-2">
      {(alerts || []).map((a, i) => (
        <div key={i} style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px' }}>
          <div className="d-flex align-items-center justify-content-between mb-1">
            <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#dc2626' }}>{a.title}</span>
            <SeverityBadge level={a.severity} />
          </div>
          <div style={{ fontSize: '0.82rem', color: '#7f1d1d' }}>{a.description}</div>
        </div>
      ))}
    </div>
  );

  const renderOpportunities = (opps) => (
    <div className="d-flex flex-column gap-2">
      {(opps || []).map((o, i) => (
        <div key={i} style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '10px 14px' }}>
          <div className="d-flex align-items-center justify-content-between mb-1">
            <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#15803d' }}>{o.title}</span>
            <ImpactBadge level={o.impact} />
          </div>
          <div style={{ fontSize: '0.82rem', color: '#166534' }}>{o.description}</div>
        </div>
      ))}
    </div>
  );

  return (
    <div>
      {/* Executive Summary */}
      {insights.executive_summary && (
        <div style={{ background: 'linear-gradient(135deg, #fefce8 0%, #fff 100%)',
          border: '1px solid #fde68a', borderRadius: 14, padding: '1.25rem 1.5rem', marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: '0.78rem', color: '#92400e', textTransform: 'uppercase',
            letterSpacing: '0.06em', marginBottom: 8 }}>
            <i className="bi bi-stars me-2" style={{ color: '#ca8a04' }}></i>Executive Summary
          </div>
          <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.7, color: 'var(--text-primary)' }}>
            {insights.executive_summary}
          </p>
          {insights.performance_score !== undefined && (
            <div className="d-flex align-items-center gap-3 mt-3">
              <div style={{ fontWeight: 700, fontSize: '0.78rem', color: 'var(--text-muted)' }}>Performance Score</div>
              <div style={{ flex: 1, height: 8, background: '#e5e5e0', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: insights.performance_score + '%',
                  background: insights.performance_score >= 70 ? '#22c55e' : insights.performance_score >= 40 ? '#f5c518' : '#ef4444',
                  borderRadius: 999, transition: 'width 1s ease' }}></div>
              </div>
              <span style={{ fontWeight: 800, fontSize: '1rem', minWidth: 40 }}>{insights.performance_score}/100</span>
            </div>
          )}
        </div>
      )}

      {/* Key metrics analysis */}
      {insights.key_metrics_analysis && (
        <Section title="Key Metrics Analysis" icon="bi-graph-up" color="#6366f1">
          <p style={{ margin: 0, fontSize: '0.875rem', lineHeight: 1.7, color: 'var(--text-secondary)' }}>
            {insights.key_metrics_analysis}
          </p>
        </Section>
      )}

      {/* Revenue insights */}
      {insights.revenue_insights?.length > 0 && (
        <Section title="Revenue Insights" icon="bi-currency-rupee" color="#f5c518">
          {renderList(insights.revenue_insights)}
        </Section>
      )}

      {/* Revenue summary */}
      {insights.summary && (
        <Section title="Summary" icon="bi-file-text" color="#6366f1">
          <p style={{ margin: 0, fontSize: '0.875rem', lineHeight: 1.7 }}>{insights.summary}</p>
        </Section>
      )}

      {/* Revenue trend */}
      {insights.revenue_trend && (
        <Section title="Revenue Trend" icon="bi-graph-up-arrow" color="#22c55e">
          <p style={{ margin: 0, fontSize: '0.875rem', lineHeight: 1.7 }}>{insights.revenue_trend}</p>
        </Section>
      )}

      {/* Product insights */}
      {insights.product_insights?.length > 0 && (
        <Section title="Product Insights" icon="bi-box-seam" color="#22c55e">
          {renderList(insights.product_insights)}
        </Section>
      )}

      {/* Star products */}
      {insights.star_products?.length > 0 && (
        <Section title="Star Products" icon="bi-trophy-fill" color="#f5c518">
          {renderList(insights.star_products)}
        </Section>
      )}

      {/* Underperforming products */}
      {insights.underperforming_products?.length > 0 && (
        <Section title="Underperforming Products" icon="bi-arrow-down-circle" color="#ef4444">
          {renderList(insights.underperforming_products)}
        </Section>
      )}

      {/* Customer insights */}
      {insights.customer_insights?.length > 0 && (
        <Section title="Customer Insights" icon="bi-people" color="#06b6d4">
          {renderList(insights.customer_insights)}
        </Section>
      )}

      {/* Risk alerts */}
      {insights.risk_alerts?.length > 0 && (
        <Section title="Risk Alerts" icon="bi-exclamation-triangle-fill" color="#dc2626">
          {renderAlerts(insights.risk_alerts)}
        </Section>
      )}

      {/* Opportunities */}
      {insights.opportunities?.length > 0 && (
        <Section title="Opportunities" icon="bi-stars" color="#22c55e">
          {renderOpportunities(insights.opportunities)}
        </Section>
      )}

      {/* Recommendations */}
      {insights.recommendations?.length > 0 && (
        <Section title="Recommendations" icon="bi-lightning-fill" color="#f97316">
          {renderRecs(insights.recommendations)}
        </Section>
      )}

      {/* Immediate / short / long term actions */}
      {insights.immediate_actions?.length > 0 && (
        <Section title="Immediate Actions (This Week)" icon="bi-lightning-charge-fill" color="#dc2626">
          {renderRecs(insights.immediate_actions)}
        </Section>
      )}
      {insights.short_term?.length > 0 && (
        <Section title="Short Term (1 Month)" icon="bi-calendar-check" color="#f5c518">
          {renderRecs(insights.short_term)}
        </Section>
      )}
      {insights.long_term?.length > 0 && (
        <Section title="Long Term (3–6 Months)" icon="bi-flag-fill" color="#6366f1">
          {renderRecs(insights.long_term)}
        </Section>
      )}

      {/* Biggest opportunity / key focus */}
      {(insights.biggest_opportunity || insights.key_focus_area) && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 14, padding: '1rem 1.25rem' }}>
          {insights.biggest_opportunity && (
            <div className="mb-2">
              <div style={{ fontWeight: 700, fontSize: '0.78rem', color: '#15803d', marginBottom: 4 }}>
                <i className="bi bi-stars me-2"></i>Biggest Opportunity
              </div>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#166534' }}>{insights.biggest_opportunity}</p>
            </div>
          )}
          {insights.key_focus_area && (
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.78rem', color: '#15803d', marginBottom: 4 }}>
                <i className="bi bi-bullseye me-2"></i>Key Focus Area
              </div>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#166534' }}>{insights.key_focus_area}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────

const AIInsights = () => {
  const [period, setPeriod]           = useState('30d');
  const [reportType, setReportType]   = useState('full');
  const [generating, setGenerating]   = useState(false);
  const [activeReport, setActiveReport] = useState(null);
  const [reports, setReports]         = useState([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [toDelete, setToDelete]       = useState(null);
  const [deleting, setDeleting]       = useState(false);

  // Load report list + latest on mount
  useEffect(() => {
    fetchReports();
    fetchLatest();
  }, []);

  const fetchReports = async () => {
    setLoadingReports(true);
    try {
      const res = await getReports();
      setReports(res.data?.data?.results || []);
    } catch { /* silent */ }
    finally { setLoadingReports(false); }
  };

  const fetchLatest = async () => {
    try {
      const res = await getLatestReport();
      if (res.data?.data) setActiveReport(res.data.data);
    } catch { /* silent */ }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await generateInsights(period, reportType);
      if (res.data?.success) {
        const report = res.data.data;
        setActiveReport(report);
        setReports(prev => [report, ...prev]);
        toast.success('AI analysis complete!');
      } else {
        toast.error(res.data?.message || 'Generation failed.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'AI generation failed. Check your OpenAI API key.');
    } finally {
      setGenerating(false);
    }
  };

  const handleViewReport = async (id) => {
    try {
      const res = await getReport(id);
      if (res.data?.success) setActiveReport(res.data.data);
    } catch { toast.error('Failed to load report.'); }
  };

  const handleDeleteConfirm = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await deleteReport(toDelete.id);
      toast.success('Report deleted.');
      setReports(prev => prev.filter(r => r.id !== toDelete.id));
      if (activeReport?.id === toDelete.id) setActiveReport(null);
      setToDelete(null);
    } catch { toast.error('Failed to delete report.'); }
    finally { setDeleting(false); }
  };

  const statusColors = {
    completed: { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
    failed:    { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
    pending:   { bg: '#fefce8', color: '#ca8a04', border: '#fde68a' },
  };

  return (
    <div>
      {/* Header */}
      <div className="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-4">
        <div>
          <h4 style={{ fontWeight: 800, marginBottom: 2 }}>
            <i className="bi bi-stars me-2" style={{ color: '#ca8a04' }}></i>AI Business Insights
          </h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
            GPT-4o powered analysis of your business data — recommendations, risks, and opportunities.
          </p>
        </div>
      </div>

      <div className="row g-4">
        {/* ── Left: Generate + History ─────────────────── */}
        <div className="col-lg-4">

          {/* Generate card */}
          <div className="card-panel p-4 mb-4" style={{ background: 'linear-gradient(135deg, #fefce8 0%, #fff 80%)', border: '1px solid #fde68a' }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 16, color: '#92400e' }}>
              <i className="bi bi-magic me-2"></i>Generate New Report
            </div>

            {/* Period */}
            <div className="mb-3">
              <label className="form-label">Analysis Period</label>
              <select className="form-select" value={period} onChange={e => setPeriod(e.target.value)}>
                {PERIOD_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            {/* Report Type */}
            <div className="mb-4">
              <label className="form-label">Report Type</label>
              <div className="d-flex flex-column gap-2">
                {REPORT_TYPES.map(rt => (
                  <button key={rt.value} onClick={() => setReportType(rt.value)}
                    style={{
                      padding: '8px 12px', borderRadius: 10, fontSize: '0.82rem',
                      fontWeight: 600, cursor: 'pointer', textAlign: 'left',
                      display: 'flex', alignItems: 'center', gap: 8,
                      background: reportType === rt.value ? rt.color + '18' : 'var(--bg-secondary)',
                      border: `1px solid ${reportType === rt.value ? rt.color + '40' : 'var(--border)'}`,
                      color: reportType === rt.value ? rt.color : 'var(--text-secondary)',
                    }}>
                    <i className={`bi ${rt.icon}`}></i>{rt.label}
                    {reportType === rt.value && <i className="bi bi-check-circle-fill ms-auto"></i>}
                  </button>
                ))}
              </div>
            </div>

            <button
              className="btn btn-accent w-100 py-2 fw-semibold"
              style={{ borderRadius: 10 }}
              onClick={handleGenerate}
              disabled={generating}
            >
              {generating ? (
                <><span className="spinner-border spinner-border-sm me-2"></span>Analysing with GPT-4o…</>
              ) : (
                <><i className="bi bi-stars me-2"></i>Generate AI Analysis</>
              )}
            </button>

            {generating && (
              <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 8, marginBottom: 0 }}>
                This may take 10–30 seconds…
              </p>
            )}
          </div>

          {/* Report history */}
          <div className="card-panel p-4">
            <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 12 }}>
              <i className="bi bi-clock-history me-2"></i>Past Reports
            </div>

            {loadingReports ? (
              <div className="text-center py-3">
                <div className="spinner-border spinner-border-sm" style={{ color: 'var(--accent)' }}></div>
              </div>
            ) : reports.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: 0, textAlign: 'center', padding: '1rem 0' }}>
                No reports yet. Generate your first analysis above.
              </p>
            ) : (
              <div className="d-flex flex-column gap-2" style={{ maxHeight: 420, overflowY: 'auto' }}>
                {reports.map(r => {
                  const sc = statusColors[r.status] || statusColors.pending;
                  const rt = REPORT_TYPES.find(t => t.value === r.report_type);
                  const isActive = activeReport?.id === r.id;
                  return (
                    <div key={r.id}
                      onClick={() => handleViewReport(r.id)}
                      style={{
                        padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                        background: isActive ? 'var(--accent-light, #fefce8)' : 'var(--bg-secondary)',
                        border: `1px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`,
                        transition: 'all 0.15s',
                      }}>
                      <div className="d-flex align-items-center justify-content-between mb-1">
                        <span style={{ fontWeight: 700, fontSize: '0.8rem', color: rt?.color }}>
                          <i className={`bi ${rt?.icon} me-1`}></i>{rt?.label}
                        </span>
                        <span style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`,
                          borderRadius: 999, padding: '1px 8px', fontSize: '0.7rem', fontWeight: 700 }}>
                          {r.status}
                        </span>
                      </div>
                      <div className="d-flex align-items-center justify-content-between">
                        <small style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                          {r.period} · {new Date(r.created_at).toLocaleDateString()}
                        </small>
                        <button
                          onClick={e => { e.stopPropagation(); setToDelete(r); }}
                          data-bs-toggle="modal"
                          data-bs-target="#deleteReportModal"
                          style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '0 2px', fontSize: '0.78rem' }}>
                          <i className="bi bi-trash3"></i>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Right: Report content ─────────────────────── */}
        <div className="col-lg-8">
          {!activeReport ? (
            <div className="card-panel" style={{ minHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#fefce8', border: '2px solid #fde68a',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                  <i className="bi bi-stars" style={{ fontSize: '2rem', color: '#ca8a04' }}></i>
                </div>
                <h5 style={{ fontWeight: 800, marginBottom: 8 }}>No Report Selected</h5>
                <p style={{ color: 'var(--text-muted)', marginBottom: 0, maxWidth: 340, margin: '0 auto' }}>
                  Generate a new AI analysis or select a past report from the history panel to view insights.
                </p>
              </div>
            </div>
          ) : (
            <div>
              {/* Report header */}
              <div className="card-panel p-4 mb-4">
                <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: 4 }}>
                      {REPORT_TYPES.find(t => t.value === activeReport.report_type)?.label || 'AI Report'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      <span className="me-3"><i className="bi bi-calendar me-1"></i>
                        {new Date(activeReport.created_at).toLocaleString()}
                      </span>
                      <span className="me-3"><i className="bi bi-clock-history me-1"></i>Period: {activeReport.period}</span>
                      <span><i className="bi bi-cpu me-1"></i>{activeReport.model_used}</span>
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <span style={{ background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0',
                      borderRadius: 999, padding: '4px 12px', fontSize: '0.75rem', fontWeight: 700 }}>
                      <i className="bi bi-lightning-fill me-1"></i>{activeReport.tokens_used} tokens
                    </span>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-muted)',
                      background: 'var(--bg-secondary)', padding: '4px 10px', borderRadius: 6 }}>
                      {activeReport.report_id}
                    </span>
                  </div>
                </div>
              </div>

              {/* Insights content */}
              {activeReport.status === 'completed' ? (
                <InsightRenderer insights={activeReport.insights} reportType={activeReport.report_type} />
              ) : activeReport.status === 'failed' ? (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 14, padding: '1.5rem' }}>
                  <div style={{ fontWeight: 700, color: '#dc2626', marginBottom: 8 }}>
                    <i className="bi bi-x-circle-fill me-2"></i>Generation Failed
                  </div>
                  <p style={{ margin: 0, color: '#7f1d1d', fontSize: '0.875rem' }}>{activeReport.error}</p>
                </div>
              ) : (
                <div className="text-center py-5">
                  <div className="spinner-border" style={{ color: 'var(--accent)' }}></div>
                  <p style={{ color: 'var(--text-muted)', marginTop: 12 }}>Generating…</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <DeleteModal
        modalId="deleteReportModal"
        title="Delete Report"
        message={toDelete ? `Delete report "${toDelete.report_id}"? This cannot be undone.` : ''}
        onConfirm={handleDeleteConfirm}
        loading={deleting}
      />
    </div>
  );
};

export default AIInsights;
