/**
 * aiService.js
 * ------------
 * API calls for the AI Insights module.
 */
import api from './api';

const BASE = '/api/ai';

/**
 * Generate a new AI insight report.
 * @param {string} period     - '7d' | '30d' | '90d' | '180d' | '365d' | 'all'
 * @param {string} reportType - 'full' | 'revenue' | 'products' | 'customers' | 'recommendations'
 */
export const generateInsights = (period = '30d', reportType = 'full') =>
  api.post(`${BASE}/generate/`, { period, report_type: reportType });

/** Get paginated list of past reports. */
export const getReports = (params = {}) =>
  api.get(`${BASE}/reports/`, { params });

/** Get a single report by id. */
export const getReport = (id) =>
  api.get(`${BASE}/reports/${id}/`);

/** Get the most recent completed report. */
export const getLatestReport = () =>
  api.get(`${BASE}/reports/latest/`);

/** Delete a report. */
export const deleteReport = (id) =>
  api.delete(`${BASE}/reports/${id}/`);
