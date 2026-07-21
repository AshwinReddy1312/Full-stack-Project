/**
 * EditProduct.jsx
 * ---------------
 * Page for editing an existing product.
 * Loads the product by :id, pre-fills ProductForm, then PUTs via productService.
 */
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getProduct, getCategories, updateProduct } from '../../services/productService';
import ProductForm from '../../components/products/ProductForm';

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct]       = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [apiErrors, setApiErrors]   = useState({});

  // Fetch product + categories in parallel
  useEffect(() => {
    Promise.all([getProduct(id), getCategories()])
      .then(([productRes, catRes]) => {
        setProduct(productRes.data?.data || null);
        setCategories(catRes.data?.data || []);
      })
      .catch(() => {
        toast.error('Failed to load product data.');
        navigate('/products');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (data) => {
    setSubmitting(true);
    setApiErrors({});
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        // Skip the image field if the user didn't pick a new file
        // (product_image will be a string URL from defaultValues in that case)
        if (key === 'product_image' && typeof value === 'string') return;
        if (value !== null && value !== undefined && value !== '') {
          formData.append(key, value);
        }
      });

      const res = await updateProduct(id, formData);
      if (res.data?.success) {
        toast.success(res.data.message || 'Product updated successfully!');
        navigate(`/products/${id}`);
      } else {
        toast.error(res.data?.message || 'Failed to update product.');
      }
    } catch (err) {
      const errors = err.response?.data?.errors || {};
      const message = err.response?.data?.message || 'Validation failed.';
      setApiErrors(errors);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

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

  return (
    <div className="animate__animated animate__fadeIn">
      {/* Page header */}
      <div className="d-flex align-items-center gap-3 mb-4">
        <button
          className="btn btn-sm rounded-3 px-3 py-2"
          style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)' }}
          onClick={() => navigate(`/products/${id}`)}
        >
          <i className="bi bi-arrow-left me-2"></i>Back
        </button>
        <div>
          <h4 className="fw-bold mb-0">Edit Product</h4>
          <p className="text-secondary mb-0" style={{ fontSize: '0.875rem' }}>
            {product.name} <span className="text-secondary">— SKU: {product.sku}</span>
          </p>
        </div>
      </div>

      <ProductForm
        onSubmit={handleSubmit}
        defaultValues={{
          name:           product.name,
          sku:            product.sku,
          barcode:        product.barcode || '',
          description:    product.description || '',
          category:       product.category,
          status:         product.status,
          cost_price:     product.cost_price,
          selling_price:  product.selling_price,
          stock_quantity: product.stock_quantity,
          minimum_stock:  product.minimum_stock,
          product_image:  product.product_image || '',
        }}
        categories={categories}
        submitting={submitting}
        submitLabel="Save Changes"
        apiErrors={apiErrors}
      />
    </div>
  );
};

export default EditProduct;
