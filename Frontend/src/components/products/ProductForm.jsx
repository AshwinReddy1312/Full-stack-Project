/**
 * ProductForm.jsx
 * ---------------
 * Shared form used by both AddProduct and EditProduct pages.
 * Handles image preview, category dropdown, and full field validation.
 *
 * Props:
 *   onSubmit       – async (formData: FormData) => { success, message, errors }
 *   defaultValues  – object with existing product data (for edit mode)
 *   categories     – array of category objects [{ id, name }]
 *   submitting     – bool, disables submit while in flight
 *   submitLabel    – string, button label
 *   apiErrors      – object of field-level errors from API { field: "msg" }
 */
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const ProductForm = ({
  onSubmit,
  defaultValues = {},
  categories = [],
  submitting = false,
  submitLabel = 'Save Product',
  apiErrors = {},
}) => {
  const [imagePreview, setImagePreview] = useState(null);

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    watch,
    formState: { errors },
  } = useForm({ defaultValues });

  // Pre-fill existing product image on edit
  useEffect(() => {
    if (defaultValues?.product_image && typeof defaultValues.product_image === 'string') {
      const src = defaultValues.product_image.startsWith('http')
        ? defaultValues.product_image
        : `${API_URL}${defaultValues.product_image}`;
      setImagePreview(src);
    }
  }, [defaultValues?.product_image]);

  // Map API field errors into react-hook-form
  useEffect(() => {
    if (apiErrors && Object.keys(apiErrors).length > 0) {
      Object.entries(apiErrors).forEach(([field, msg]) => {
        const message = Array.isArray(msg) ? msg[0] : msg;
        setError(field, { type: 'server', message });
      });
    }
  }, [apiErrors, setError]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setValue('product_image', file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const fieldError = (name) => errors[name]?.message;

  const inputClass = (name) =>
    `form-control glass-input${fieldError(name) ? ' border-danger' : ''}`;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="row g-4">

        {/* ── Left column ───────────────────────────────────────── */}
        <div className="col-lg-8">

          {/* Basic Info */}
          <div className="glass-panel p-4 mb-4">
            <h6 className="fw-bold mb-4 text-secondary" style={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.78rem' }}>
              <i className="bi bi-info-circle me-2"></i>Basic Information
            </h6>

            <div className="row g-3">
              {/* Product Name */}
              <div className="col-12">
                <label className="form-label fw-semibold small text-secondary">
                  Product Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className={inputClass('name')}
                  placeholder="e.g. Premium Wireless Headphones"
                  {...register('name', { required: 'Product name is required' })}
                />
                {fieldError('name') && (
                  <div className="mt-1" style={{ fontSize: '0.78rem', color: '#f87171' }}>
                    <i className="bi bi-exclamation-circle me-1"></i>{fieldError('name')}
                  </div>
                )}
              </div>

              {/* SKU */}
              <div className="col-md-6">
                <label className="form-label fw-semibold small text-secondary">
                  SKU <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className={inputClass('sku')}
                  placeholder="e.g. PRD-WH-001"
                  {...register('sku', { required: 'SKU is required' })}
                />
                {fieldError('sku') && (
                  <div className="mt-1" style={{ fontSize: '0.78rem', color: '#f87171' }}>
                    <i className="bi bi-exclamation-circle me-1"></i>{fieldError('sku')}
                  </div>
                )}
              </div>

              {/* Barcode */}
              <div className="col-md-6">
                <label className="form-label fw-semibold small text-secondary">Barcode</label>
                <input
                  type="text"
                  className="form-control glass-input"
                  placeholder="e.g. 8901234567890"
                  {...register('barcode')}
                />
              </div>

              {/* Category */}
              <div className="col-md-6">
                <label className="form-label fw-semibold small text-secondary">
                  Category <span className="text-danger">*</span>
                </label>
                <select
                  className={`form-select glass-input glass-select${fieldError('category') ? ' border-danger' : ''}`}
                  {...register('category', { required: 'Category is required' })}
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                {fieldError('category') && (
                  <div className="mt-1" style={{ fontSize: '0.78rem', color: '#f87171' }}>
                    <i className="bi bi-exclamation-circle me-1"></i>{fieldError('category')}
                  </div>
                )}
              </div>

              {/* Status */}
              <div className="col-md-6">
                <label className="form-label fw-semibold small text-secondary">Status</label>
                <select
                  className="form-select glass-input glass-select"
                  {...register('status')}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              {/* Description */}
              <div className="col-12">
                <label className="form-label fw-semibold small text-secondary">Description</label>
                <textarea
                  rows={4}
                  className="form-control glass-input"
                  placeholder="Brief product description..."
                  {...register('description')}
                />
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="glass-panel p-4 mb-4">
            <h6 className="fw-bold mb-4 text-secondary" style={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.78rem' }}>
              <i className="bi bi-currency-rupee me-2"></i>Pricing
            </h6>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label fw-semibold small text-secondary">
                  Cost Price <span className="text-danger">*</span>
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-transparent border-end-0 text-secondary" style={{ borderColor: 'var(--card-border)' }}>₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className={`form-control glass-input border-start-0${fieldError('cost_price') ? ' border-danger' : ''}`}
                    placeholder="0.00"
                    {...register('cost_price', { required: 'Cost price is required', min: { value: 0, message: 'Cannot be negative' } })}
                  />
                </div>
                {fieldError('cost_price') && (
                  <div className="mt-1" style={{ fontSize: '0.78rem', color: '#f87171' }}>
                    <i className="bi bi-exclamation-circle me-1"></i>{fieldError('cost_price')}
                  </div>
                )}
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold small text-secondary">
                  Selling Price <span className="text-danger">*</span>
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-transparent border-end-0 text-secondary" style={{ borderColor: 'var(--card-border)' }}>₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className={`form-control glass-input border-start-0${fieldError('selling_price') ? ' border-danger' : ''}`}
                    placeholder="0.00"
                    {...register('selling_price', { required: 'Selling price is required', min: { value: 0, message: 'Cannot be negative' } })}
                  />
                </div>
                {fieldError('selling_price') && (
                  <div className="mt-1" style={{ fontSize: '0.78rem', color: '#f87171' }}>
                    <i className="bi bi-exclamation-circle me-1"></i>{fieldError('selling_price')}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stock */}
          <div className="glass-panel p-4">
            <h6 className="fw-bold mb-4 text-secondary" style={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.78rem' }}>
              <i className="bi bi-box-seam me-2"></i>Stock Management
            </h6>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label fw-semibold small text-secondary">
                  Stock Quantity <span className="text-danger">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  className={inputClass('stock_quantity')}
                  placeholder="0"
                  {...register('stock_quantity', {
                    required: 'Stock quantity is required',
                    min: { value: 0, message: 'Cannot be negative' },
                  })}
                />
                {fieldError('stock_quantity') && (
                  <div className="mt-1" style={{ fontSize: '0.78rem', color: '#f87171' }}>
                    <i className="bi bi-exclamation-circle me-1"></i>{fieldError('stock_quantity')}
                  </div>
                )}
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold small text-secondary">Minimum Stock</label>
                <input
                  type="number"
                  min="0"
                  className={inputClass('minimum_stock')}
                  placeholder="0"
                  {...register('minimum_stock', { min: { value: 0, message: 'Cannot be negative' } })}
                />
                {fieldError('minimum_stock') && (
                  <div className="mt-1" style={{ fontSize: '0.78rem', color: '#f87171' }}>
                    <i className="bi bi-exclamation-circle me-1"></i>{fieldError('minimum_stock')}
                  </div>
                )}
                <div className="mt-1" style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                  <i className="bi bi-info-circle me-1"></i>Alert triggers when stock falls to this level.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right column – Image ───────────────────────────────── */}
        <div className="col-lg-4">
          <div className="glass-panel p-4 h-100">
            <h6 className="fw-bold mb-4 text-secondary" style={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.78rem' }}>
              <i className="bi bi-image me-2"></i>Product Image
            </h6>

            {/* Preview */}
            <div
              className="rounded-3 mb-3 d-flex align-items-center justify-content-center overflow-hidden"
              style={{
                width: '100%', aspectRatio: '1 / 1',
                background: 'rgba(255,255,255,0.03)',
                border: '2px dashed rgba(255,255,255,0.1)',
              }}
            >
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Preview"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div className="text-center text-secondary p-4">
                  <i className="bi bi-cloud-upload fs-1 d-block mb-2"></i>
                  <small>No image selected</small>
                </div>
              )}
            </div>

            <input
              type="file"
              accept="image/*"
              className="form-control glass-input"
              onChange={handleImageChange}
            />
            <small className="text-secondary mt-2 d-block">
              Supported: JPG, PNG, WEBP. Max 5 MB.
            </small>
          </div>
        </div>

        {/* ── Submit ────────────────────────────────────────────── */}
        <div className="col-12 d-flex justify-content-end gap-3 pt-2">
          <button
            type="button"
            className="btn btn-outline-secondary rounded-3 px-4"
            onClick={() => window.history.back()}
          >
            <i className="bi bi-arrow-left me-2"></i>Cancel
          </button>
          <button
            type="submit"
            className="btn btn-glow rounded-3 px-5 py-2 fw-semibold"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                Saving...
              </>
            ) : (
              <>
                <i className="bi bi-check-lg me-2"></i>
                {submitLabel}
              </>
            )}
          </button>
        </div>

      </div>
    </form>
  );
};

export default ProductForm;
