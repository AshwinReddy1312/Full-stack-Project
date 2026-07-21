/**
 * ProductDetail.jsx
 * -----------------
 * Full product detail view with image, all fields, low-stock alert,
 * and Edit / Delete action buttons (Admin/Manager only).
 */
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { getProduct, deleteProduct } from '../../services/productService';
import DeleteModal from '../../components/products/DeleteModal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const InfoRow = ({ label, value, valueClass = '' }) => (
  <div className="d-flex justify-content-between align-items-start py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
    <span className="text-secondary" style={{ fontSize: '0.85rem', minWidth: '140px' }}>{label}</span>
    <span className={`fw-semibold text-end ${valueClass}`} style={{ fontSize: '0.9rem' }}>{value ?? '—'}</span>
  </div>
);

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canWrite = true;

  const [product, setProduct]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    getProduct(id)
      .then((res) => setProduct(res.data?.data || null))
      .catch(() => {
        toast.error('Product not found.');
        navigate('/products');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    try {
      await deleteProduct(id);
      toast.success(`"${product.name}" deleted successfully.`);
      navigate('/products');
    } catch {
      toast.error('Failed to delete product.');
      setDeleting(false);
    }
  };

  const formatCurrency = (val) =>
    `₹${parseFloat(val).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  const formatDate = (d) => (d ? new Date(d).toLocaleString() : '—');

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <div className="spinner-border" role="status" style={{ color: 'var(--accent-primary)' }}>
          <span className="visually-hidden">Loading…</span>
        </div>
      </div>
    );
  }

  if (!product) return null;

  const imgSrc = product.product_image
    ? product.product_image.startsWith('http')
      ? product.product_image
      : `${API_URL}${product.product_image}`
    : null;

  const isLowStock = product.stock_quantity <= product.minimum_stock;
  const margin = product.cost_price
    ? (((product.selling_price - product.cost_price) / product.cost_price) * 100).toFixed(1)
    : null;

  return (
    <div className="animate__animated animate__fadeIn">
      {/* ── Header ───────────────────────────────────────────── */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div className="d-flex align-items-center gap-3">
          <button
            className="btn btn-sm rounded-3 px-3 py-2"
            style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)' }}
            onClick={() => navigate('/products')}
          >
            <i className="bi bi-arrow-left me-2"></i>Back
          </button>
          <div>
            <h4 className="fw-bold mb-0">{product.name}</h4>
            <small className="text-secondary">SKU: {product.sku}</small>
          </div>
        </div>

        {canWrite && (
          <div className="d-flex gap-2">
            <button
              className="btn rounded-3 px-4 py-2 fw-semibold"
              style={{ background: 'rgba(79,70,229,0.15)', color: '#a5b4fc', border: '1px solid rgba(79,70,229,0.25)' }}
              onClick={() => navigate(`/products/edit/${id}`)}
            >
              <i className="bi bi-pencil me-2"></i>Edit
            </button>
            <button
              className="btn rounded-3 px-4 py-2 fw-semibold"
              style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}
              data-bs-toggle="modal"
              data-bs-target="#deleteProductModal"
            >
              <i className="bi bi-trash3 me-2"></i>Delete
            </button>
          </div>
        )}
      </div>

      {/* ── Low stock alert ─────────────────────────────────── */}
      {isLowStock && (
        <div
          className="d-flex align-items-center gap-3 p-3 rounded-3 mb-4"
          style={{ background: 'rgba(251,146,60,0.1)', border: '1px solid rgba(251,146,60,0.25)' }}
        >
          <i className="bi bi-exclamation-triangle-fill" style={{ color: '#fb923c', fontSize: '1.2rem' }}></i>
          <div>
            <div className="fw-semibold" style={{ color: '#fb923c' }}>Low Stock Warning</div>
            <small className="text-secondary">
              Current stock ({product.stock_quantity}) is at or below the minimum threshold ({product.minimum_stock}).
            </small>
          </div>
        </div>
      )}

      <div className="row g-4">
        {/* ── Left: Image + quick stats ────────────────────── */}
        <div className="col-lg-4">
          {/* Product image */}
          <div className="glass-panel p-4 text-center mb-4">
            {imgSrc ? (
              <img
                src={imgSrc}
                alt={product.name}
                className="rounded-3 w-100"
                style={{ maxHeight: '280px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.08)' }}
              />
            ) : (
              <div
                className="rounded-3 d-flex align-items-center justify-content-center mx-auto"
                style={{ width: '100%', height: '220px', background: 'rgba(255,255,255,0.03)', border: '2px dashed rgba(255,255,255,0.1)' }}
              >
                <div className="text-center text-secondary">
                  <i className="bi bi-image fs-1 d-block mb-2"></i>
                  <small>No Image</small>
                </div>
              </div>
            )}

            <div className="mt-3">
              {/* Status badge */}
              <span
                className="badge rounded-pill px-3 py-2 fw-semibold me-2"
                style={
                  product.status === 'Active'
                    ? { background: 'rgba(34,197,94,0.15)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' }
                    : { background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }
                }
              >
                <i className={`bi ${product.status === 'Active' ? 'bi-check-circle' : 'bi-x-circle'} me-1`}></i>
                {product.status}
              </span>
              {/* Category badge */}
              <span
                className="badge rounded-pill px-3 py-2"
                style={{ background: 'rgba(79,70,229,0.15)', color: '#a5b4fc', border: '1px solid rgba(79,70,229,0.25)' }}
              >
                {product.category_name}
              </span>
            </div>
          </div>

          {/* Key metrics */}
          <div className="glass-panel p-4">
            <h6 className="fw-bold mb-3 text-secondary" style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Key Metrics
            </h6>
            {[
              { label: 'Selling Price', value: formatCurrency(product.selling_price), color: '#22c55e' },
              { label: 'Cost Price',    value: formatCurrency(product.cost_price),    color: '#94a3b8' },
              { label: 'Profit Margin', value: margin ? `${margin}%` : '—',           color: '#6366f1' },
              { label: 'Stock',         value: product.stock_quantity,                 color: isLowStock ? '#fb923c' : '#94a3b8' },
              { label: 'Min. Stock',    value: product.minimum_stock,                  color: '#94a3b8' },
            ].map(({ label, value, color }) => (
              <div key={label} className="d-flex justify-content-between align-items-center py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <small className="text-secondary">{label}</small>
                <span className="fw-bold" style={{ color }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: Full details ───────────────────────────── */}
        <div className="col-lg-8">
          <div className="glass-panel p-4 mb-4">
            <h6 className="fw-bold mb-3 text-secondary" style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <i className="bi bi-info-circle me-2"></i>Product Details
            </h6>
            <InfoRow label="Product Name"  value={product.name} />
            <InfoRow label="SKU"           value={product.sku} />
            <InfoRow label="Barcode"       value={product.barcode} />
            <InfoRow label="Category"      value={product.category_name} />
            <InfoRow label="Status"        value={product.status} />
            <InfoRow label="Description"   value={product.description || 'No description provided.'} />
          </div>

          <div className="glass-panel p-4 mb-4">
            <h6 className="fw-bold mb-3 text-secondary" style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <i className="bi bi-currency-rupee me-2"></i>Pricing
            </h6>
            <InfoRow label="Cost Price"    value={formatCurrency(product.cost_price)} />
            <InfoRow label="Selling Price" value={formatCurrency(product.selling_price)} valueClass="text-success" />
            <InfoRow label="Profit Margin" value={margin ? `${margin}%` : '—'} valueClass="text-indigo" />
          </div>

          <div className="glass-panel p-4 mb-4">
            <h6 className="fw-bold mb-3 text-secondary" style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <i className="bi bi-box-seam me-2"></i>Stock
            </h6>
            <InfoRow label="Current Stock"  value={product.stock_quantity} valueClass={isLowStock ? 'text-warning' : ''} />
            <InfoRow label="Minimum Stock"  value={product.minimum_stock} />
            <InfoRow label="Stock Status"   value={isLowStock ? 'Low Stock' : 'Sufficient'} valueClass={isLowStock ? 'text-warning' : 'text-success'} />
          </div>

          <div className="glass-panel p-4">
            <h6 className="fw-bold mb-3 text-secondary" style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <i className="bi bi-clock-history me-2"></i>Audit
            </h6>
            <InfoRow label="Created By"  value={product.created_by_name} />
            <InfoRow label="Created At"  value={formatDate(product.created_at)} />
            <InfoRow label="Last Updated" value={formatDate(product.updated_at)} />
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      <DeleteModal
        modalId="deleteProductModal"
        title="Delete Product"
        message={`Are you sure you want to delete "${product.name}" (SKU: ${product.sku})? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        loading={deleting}
      />
    </div>
  );
};

export default ProductDetail;
