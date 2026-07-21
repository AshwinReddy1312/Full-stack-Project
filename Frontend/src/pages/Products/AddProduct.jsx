/**
 * AddProduct.jsx
 * --------------
 * Page for creating a new product.
 * Loads categories, passes them to ProductForm, then POSTs via productService.
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getCategories, createProduct } from '../../services/productService';
import ProductForm from '../../components/products/ProductForm';

const AddProduct = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [apiErrors, setApiErrors]   = useState({});

  useEffect(() => {
    getCategories()
      .then((res) => setCategories(res.data?.data || []))
      .catch(() => toast.error('Failed to load categories.'));
  }, []);

  const handleSubmit = async (data) => {
    setSubmitting(true);
    setApiErrors({});
    try {
      // Build FormData so the image file is sent as multipart
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          formData.append(key, value);
        }
      });

      const res = await createProduct(formData);
      if (res.data?.success) {
        toast.success(res.data.message || 'Product created successfully!');
        navigate('/products');
      } else {
        toast.error(res.data?.message || 'Failed to create product.');
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

  return (
    <div className="animate__animated animate__fadeIn">
      {/* Page header */}
      <div className="d-flex align-items-center gap-3 mb-4">
        <button
          className="btn btn-sm rounded-3 px-3 py-2"
          style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)' }}
          onClick={() => navigate('/products')}
        >
          <i className="bi bi-arrow-left me-2"></i>Back
        </button>
        <div>
          <h4 className="fw-bold mb-0">Add New Product</h4>
          <p className="text-secondary mb-0" style={{ fontSize: '0.875rem' }}>
            Fill in the details to add a product to your catalogue
          </p>
        </div>
      </div>

      <ProductForm
        onSubmit={handleSubmit}
        categories={categories}
        submitting={submitting}
        submitLabel="Create Product"
        apiErrors={apiErrors}
        defaultValues={{ status: 'Active', stock_quantity: 0, minimum_stock: 0 }}
      />
    </div>
  );
};

export default AddProduct;
