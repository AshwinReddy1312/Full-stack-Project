/**
 * ProductTable.jsx
 * ----------------
 * Renders the product data table with image, all columns, and action buttons.
 *
 * Props:
 *   products     – array of product objects
 *   onView       – (id) => void
 *   onEdit       – (id) => void
 *   onDeleteClick– (product) => void  – opens delete confirmation
 *   userRole     – string ('Admin' | 'Manager' | 'Employee')
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const StatusBadge = ({ status }) => (
  <span
    className="badge rounded-pill px-3 py-1 fw-semibold"
    style={
      status === 'Active'
        ? { background: 'rgba(34,197,94,0.15)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' }
        : { background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }
    }
  >
    <i className={`bi ${status === 'Active' ? 'bi-check-circle' : 'bi-x-circle'} me-1`}></i>
    {status}
  </span>
);

const StockBadge = ({ qty, min }) => {
  const low = qty <= min;
  return (
    <span
      className="badge rounded-pill px-2 py-1"
      style={
        low
          ? { background: 'rgba(251,146,60,0.15)', color: '#fb923c', border: '1px solid rgba(251,146,60,0.3)' }
          : { background: 'rgba(148,163,184,0.1)', color: '#94a3b8', border: '1px solid rgba(148,163,184,0.15)' }
      }
    >
      {low && <i className="bi bi-exclamation-triangle me-1"></i>}
      {qty}
    </span>
  );
};

const ProductTable = ({ products, onDeleteClick, userRole }) => {
  const navigate = useNavigate();
  // All authenticated users can add, edit and delete products
  const canWrite = true;

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-5">
        <div
          className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
          style={{ width: '72px', height: '72px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <i className="bi bi-box-seam fs-2 text-secondary"></i>
        </div>
        <h6 className="fw-semibold mb-1">No Products Found</h6>
        <p className="text-secondary mb-0" style={{ fontSize: '0.875rem' }}>
          Try adjusting your search or filters, or add a new product.
        </p>
      </div>
    );
  }

  return (
    <div className="table-responsive">
      <table className="table align-middle mb-0" style={{ borderCollapse: 'separate', borderSpacing: '0 4px' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            {['Image', 'Name / SKU', 'Category', 'Cost', 'Selling Price', 'Stock', 'Status', 'Actions'].map((h) => (
              <th
                key={h}
                className="fw-semibold py-3 px-3"
                style={{ fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', background: 'transparent', border: 'none', whiteSpace: 'nowrap' }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {products.map((product) => {
            const imgSrc = product.product_image
              ? product.product_image.startsWith('http')
                ? product.product_image
                : `${API_URL}${product.product_image}`
              : null;

            return (
              <tr
                key={product.id}
                style={{ cursor: 'pointer' }}
                onClick={() => navigate(`/products/${product.id}`)}
              >
                {/* Image */}
                <td className="px-3 py-2" style={{ border: 'none' }}>
                  {imgSrc ? (
                    <img
                      src={imgSrc}
                      alt={product.name}
                      className="rounded-3"
                      style={{ width: '48px', height: '48px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.08)' }}
                    />
                  ) : (
                    <div
                      className="rounded-3 d-flex align-items-center justify-content-center"
                      style={{ width: '48px', height: '48px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                      <i className="bi bi-image text-secondary"></i>
                    </div>
                  )}
                </td>

                {/* Name / SKU */}
                <td className="px-3 py-2" style={{ border: 'none' }}>
                  <div className="fw-semibold" style={{ fontSize: '0.9rem' }}>{product.name}</div>
                  <small className="text-secondary">SKU: {product.sku}</small>
                </td>

                {/* Category */}
                <td className="px-3 py-2" style={{ border: 'none' }}>
                  <span
                    className="badge rounded-pill px-3 py-1"
                    style={{ background: 'rgba(79,70,229,0.15)', color: '#a5b4fc', border: '1px solid rgba(79,70,229,0.25)', fontSize: '0.78rem' }}
                  >
                    {product.category_name || '—'}
                  </span>
                </td>

                {/* Cost Price */}
                <td className="px-3 py-2" style={{ border: 'none', color: '#94a3b8', fontSize: '0.875rem' }}>
                  ₹{parseFloat(product.cost_price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>

                {/* Selling Price */}
                <td className="px-3 py-2" style={{ border: 'none' }}>
                  <span className="fw-semibold" style={{ color: '#22c55e', fontSize: '0.9rem' }}>
                    ₹{parseFloat(product.selling_price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </td>

                {/* Stock */}
                <td className="px-3 py-2" style={{ border: 'none' }}>
                  <StockBadge qty={product.stock_quantity} min={product.minimum_stock} />
                </td>

                {/* Status */}
                <td className="px-3 py-2" style={{ border: 'none' }}>
                  <StatusBadge status={product.status} />
                </td>

                {/* Actions */}
                <td
                  className="px-3 py-2"
                  style={{ border: 'none' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-sm rounded-3 px-2 py-1"
                      style={{ background: 'rgba(6,182,212,0.12)', color: '#22d3ee', border: '1px solid rgba(6,182,212,0.2)', fontSize: '0.75rem' }}
                      title="View"
                      onClick={() => navigate(`/products/${product.id}`)}
                    >
                      <i className="bi bi-eye"></i>
                    </button>
                    {canWrite && (
                      <>
                        <button
                          className="btn btn-sm rounded-3 px-2 py-1"
                          style={{ background: 'rgba(79,70,229,0.12)', color: '#a5b4fc', border: '1px solid rgba(79,70,229,0.2)', fontSize: '0.75rem' }}
                          title="Edit"
                          onClick={() => navigate(`/products/edit/${product.id}`)}
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button
                          className="btn btn-sm rounded-3 px-2 py-1"
                          style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)', fontSize: '0.75rem' }}
                          title="Delete"
                          data-bs-toggle="modal"
                          data-bs-target="#deleteProductModal"
                          onClick={() => onDeleteClick(product)}
                        >
                          <i className="bi bi-trash3"></i>
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ProductTable;
