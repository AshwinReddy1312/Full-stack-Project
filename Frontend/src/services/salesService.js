/**
 * salesService.js
 * ---------------
 * All API calls for the CSV Upload & Data Processing module.
 */
import api from './api';

const BASE = '/api/sales';

/**
 * Upload a CSV file for validation + preview.
 * @param {File} file          - the CSV file object
 * @param {Function} onProgress - optional (percent: number) => void callback
 */
export const uploadCSV = (file, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post(`${BASE}/upload/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: onProgress
      ? (e) => onProgress(Math.round((e.loaded * 100) / e.total))
      : undefined,
  });
};

/**
 * Confirm and trigger full processing for a pending upload.
 * @param {number} uploadId
 */
export const confirmUpload = (uploadId) =>
  api.post(`${BASE}/upload/${uploadId}/confirm/`);

/**
 * Fetch paginated upload history.
 * @param {Object} params - page, page_size
 */
export const getUploadHistory = (params = {}) =>
  api.get(`${BASE}/uploads/`, { params });

/**
 * Fetch a single upload detail + sample records.
 * @param {number} id
 */
export const getUpload = (id) =>
  api.get(`${BASE}/uploads/${id}/`);

/**
 * Delete an upload batch and all its sales records.
 * @param {number} id
 */
export const deleteUpload = (id) =>
  api.delete(`${BASE}/uploads/${id}/`);

/**
 * Fetch the full error log for an upload.
 * @param {number} id
 */
export const getUploadErrors = (id) =>
  api.get(`${BASE}/uploads/${id}/errors/`);
