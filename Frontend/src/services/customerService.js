/**
 * customerService.js
 * ------------------
 * All API calls for the Customers module.
 */
import api from './api';

const BASE = '/api/customers';

/**
 * Fetch paginated customer list.
 * @param {Object} params - search, customer_type, status, city, ordering, page, page_size
 */
export const getCustomers = (params = {}) =>
  api.get(`${BASE}/`, { params });

/**
 * Fetch a single customer by id.
 */
export const getCustomer = (id) =>
  api.get(`${BASE}/${id}/`);

/**
 * Create a customer. Accepts FormData for image upload.
 */
export const createCustomer = (formData) =>
  api.post(`${BASE}/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

/**
 * Update a customer. Accepts FormData for image upload.
 */
export const updateCustomer = (id, formData) =>
  api.put(`${BASE}/${id}/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

/**
 * Delete a customer by id.
 */
export const deleteCustomer = (id) =>
  api.delete(`${BASE}/${id}/`);

/**
 * Toggle customer status (Active ↔ Inactive).
 */
export const toggleCustomerStatus = (id) =>
  api.patch(`${BASE}/${id}/toggle-status/`);
