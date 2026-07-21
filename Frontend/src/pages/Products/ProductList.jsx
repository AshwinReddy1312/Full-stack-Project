/**
 * ProductList.jsx
 * ---------------
 * Main product listing page with:
 *  - Search by name / SKU
 *  - Filter by category and status
 *  - Sort by price / stock
 *  - Pagination
 *  - Delete confirmation modal
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { getProducts, getCategories, deleteProduct } from '../../services/productService';
import ProductTable from '../../components/products/ProductTable';
import Pagination from '../../components/products/Pagination';
import DeleteModal from '../../components/products/DeleteModal';

const PAGE_SIZE = 10;

const ProductList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const canWrite = true;

  // Data state
  const [products, setProducts]     = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [deleting, setDeleting]     = useState(false);
  const [toDelete, setToDelete]     = useState(null);   // product object pending deletion

  // Pagination
  const [currentPage, setCurrentPage]   = useState(1);
  const [totalPages, setTotalPages]     = useState(1);
  const [totalCount, setTotalCount]     = useState(0);

  // Filters & search
  const [search, setSearch]       = useState('');
  const [category, setCategory]   = useState('');
  const [status, setStatus]       = useState('');
  const [ordering, setOrdering]   = useState('-created_at');

  // ── Fetch categories once ────────────────────────────────────────────────
  useEffect(() => {
    getCategories()
      .then((res) => setCategories(res.data?.data || []))
      .catch(() => {});
  }, []);

  // ── Fetch products when filters / page change ────────────────────────────
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        page_size: PAGE_SIZE,
        ordering,
        ...(search   && { search }),
        ...(category && { category }),
        ...(status   && { status }),
      };
      const res = await getProducts(params);
      const d = res.data?.data || {};
      setProducts(d.results || []);
      setTotalPages(d.total_pages || 1);
      setTotalCount(d.count || 0);
    } catch {
      toast.error('Failed to load products.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, category, status, ordering]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  // Reset to page 1 whenever filters change
  const handleFilterChange = (setter) => (e) => {
    setter(e.target.value);
    setCurrentPage(1);
  };

  // Debounced search
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  // ── Delete flow ──────────────────────────────────────────────────────────
  const handleDeleteClick = (product) => setToDelete(product);

  const handleDeleteConfirm = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await deleteProduct(toDelete.id);
      toast.success(`"${toDelete.name}" deleted successfully.`);
      setToDelete(null);
      fetchProducts();
    } catch {
      toast.error('Failed to delete product.');
    } finally {
      setDeleting(false);
    }
  };

  // ── Clear all filters ────────────────────────────────────────────────────
  const clearFilters = () => {
    setSearch('');
    setCategory('');
    setStatus('');
    setOrdering('-created_at');
    setCurrentPage(1);
  };

  const hasActiveFilters = search || category || status || ordering !== '-created_at';

  return (
    <div className="animate__animated animate__fadeIn">

      {/* ── Page header ───────────────────────────────────────── */}
      <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-3 mb-4">
        <div>
          <h4 className="fw-bold mb-1">Products</h4>
          <p className="text-secondary mb-0" style={{ fontSize: '0.875rem' }}>
            Manage your product catalogue
          </p>
        </div>
        {canWrite && (
          <button
            className="btn btn-glow rounded-3 px-4 py-2 fw-semibold flex-shrink-0"
            onClick={() => navigate('/products/add')}
          >
            <i className="bi bi-plus-lg me-2"></i>Add Product
          </button>
        )}
      </div>

      {/* ── Stats row ─────────────────────────────────────────── */}
      <div className="row g-3 mb-4">
        {[
          { label: 'Total Products', value: totalCount, icon: 'bi-box-seam', color: '#6366f1' },
          { label: 'Active',         value: products.filter(p => p.status === 'Active').length,   icon: 'bi-check-circle', color: '#22c55e' },
          { label: 'Inactive',       value: products.filter(p => p.status === 'Inactive').length, icon: 'bi-x-circle',    color: '#ef4444' },
          { label: 'Low Stock',      value: products.filter(p => p.stock_quantity <= p.minimum_stock).length, icon: 'bi-exclamation-triangle', color: '#fb923c' },
        ].map(({ label, value, icon, color }) => (
          <div className="col-6 col-md-3" key={label}>
            <div className="glass-panel p-3 d-flex align-items-center gap-3">
              <div
                className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
                style={{ width: '44px', height: '44px', background: `${color}20`, border: `1px solid ${color}30` }}
              >
                <i className={`bi ${icon}`} style={{ color, fontSize: '1.1rem' }}></i>
              </div>
              <div>
                <div className="fw-bold fs-5 lh-1">{value}</div>
                <small className="text-secondary">{label}</small>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Search & Filters ──────────────────────────────────── */}
      <div className="glass-panel p-4 mb-4">
        <div className="row g-3 align-items-end">
          {/* Search */}
          <div className="col-md-4">
            <label className="form-label small fw-semibold text-secondary mb-1">Search</label>
            <div className="input-group">
              <span className="input-group-text bg-transparent border-end-0 text-secondary" style={{ borderColor: 'var(--card-border)' }}>
                <i className="bi bi-search"></i>
              </span>
              <input
                type="text"
                className="form-control glass-input border-start-0"
                placeholder="Name or SKU…"
                value={search}
                onChange={handleSearchChange}
              />
            </div>
          </div>

          {/* Category filter */}
          <div className="col-md-2">
            <label className="form-label small fw-semibold text-secondary mb-1">Category</label>
            <select className="form-select glass-input glass-select" value={category} onChange={handleFilterChange(setCategory)}>
              <option value="">All</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <div className="col-md-2">
            <label className="form-label small fw-semibold text-secondary mb-1">Status</label>
            <select className="form-select glass-input glass-select" value={status} onChange={handleFilterChange(setStatus)}>
              <option value="">All</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {/* Sort */}
          <div className="col-md-2">
            <label className="form-label small fw-semibold text-secondary mb-1">Sort By</label>
            <select className="form-select glass-input glass-select" value={ordering} onChange={handleFilterChange(setOrdering)}>
              <option value="-created_at">Newest First</option>
              <option value="created_at">Oldest First</option>
              <option value="selling_price">Price: Low → High</option>
              <option value="-selling_price">Price: High → Low</option>
              <option value="stock_quantity">Stock: Low → High</option>
              <option value="-stock_quantity">Stock: High → Low</option>
              <option value="name">Name: A → Z</option>
              <option value="-name">Name: Z → A</option>
            </select>
          </div>

          {/* Clear button */}
          <div className="col-md-2 d-flex align-items-end">
            {hasActiveFilters && (
              <button className="btn btn-outline-secondary rounded-3 w-100 py-2" onClick={clearFilters}>
                <i className="bi bi-x-lg me-2"></i>Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Table card ────────────────────────────────────────── */}
      <div className="glass-panel p-0 overflow-hidden">
        {/* Card header */}
        <div className="d-flex align-items-center justify-content-between px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <span className="fw-semibold" style={{ fontSize: '0.9rem' }}>
            Product Catalogue
            {totalCount > 0 && (
              <span className="ms-2 badge rounded-pill" style={{ background: 'rgba(99,102,241,0.2)', color: '#a5b4fc', fontSize: '0.75rem' }}>
                {totalCount}
              </span>
            )}
          </span>
          <button className="btn btn-sm rounded-3 px-3" style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)', fontSize: '0.8rem' }} onClick={fetchProducts}>
            <i className="bi bi-arrow-clockwise me-1"></i>Refresh
          </button>
        </div>

        {/* Loading spinner */}
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border" role="status" style={{ color: 'var(--accent-primary)', width: '2.5rem', height: '2.5rem' }}>
              <span className="visually-hidden">Loading…</span>
            </div>
            <p className="text-secondary mt-3 mb-0" style={{ fontSize: '0.875rem' }}>Loading products…</p>
          </div>
        ) : (
          <div className="p-3">
            <ProductTable
              products={products}
              onDeleteClick={handleDeleteClick}
              userRole={user?.role}
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
        modalId="deleteProductModal"
        title="Delete Product"
        message={toDelete ? `Are you sure you want to delete "${toDelete.name}" (SKU: ${toDelete.sku})? This action cannot be undone.` : ''}
        onConfirm={handleDeleteConfirm}
        loading={deleting}
      />
    </div>
  );
};

export default ProductList;
