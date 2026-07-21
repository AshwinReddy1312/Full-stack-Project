/**
 * productService.js
 * -----------------
 * All API calls for the Products module.
 * Uses the shared Axios instance (api.js) which handles auth headers
 * and silent token refresh automatically.
 */
import api from './api';

const BASE = '/api/products';

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export const getCategories = () =>
  api.get(`${BASE}/categories/`);

export const createCategory = (data) =>
  api.post(`${BASE}/categories/`, data);

export const updateCategory = (id, data) =>
  api.put(`${BASE}/categories/${id}/`, data);

export const deleteCategory = (id) =>
  api.delete(`${BASE}/categories/${id}/`);

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

/**
 * Fetch paginated product list.
 * @param {Object} params - search, category, status, ordering, page, page_size
 */
export const getProducts = (params = {}) =>
  api.get(`${BASE}/`, { params });

/**
 * Fetch a single product by id.
 */
export const getProduct = (id) =>
  api.get(`${BASE}/${id}/`);

/**
 * Create a product. Accepts FormData for image upload.
 */
export const createProduct = (formData) =>
  api.post(`${BASE}/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

/**
 * Update a product. Accepts FormData for image upload.
 */
export const updateProduct = (id, formData) =>
  api.put(`${BASE}/${id}/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

/**
 * Delete a product by id.
 */
export const deleteProduct = (id) =>
  api.delete(`${BASE}/${id}/`);
