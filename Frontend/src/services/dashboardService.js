/**
 * dashboardService.js
 * -------------------
 * API calls for all Dashboard & Analytics endpoints.
 */
import api from './api';

const BASE = '/api/dashboard';

/**
 * Common params: { period, date_from, date_to }
 * period: '7d' | '30d' | '90d' | '180d' | '365d' | 'all'
 */

export const getDashboardSummary   = (params = {}) => api.get(`${BASE}/summary/`,           { params });
export const getRevenueTrend       = (params = {}) => api.get(`${BASE}/revenue-trend/`,      { params });
export const getSalesByCategory    = (params = {}) => api.get(`${BASE}/sales-by-category/`,  { params });
export const getTopProducts        = (params = {}) => api.get(`${BASE}/top-products/`,        { params });
export const getTopCustomers       = (params = {}) => api.get(`${BASE}/top-customers/`,       { params });
export const getRecentSales        = (params = {}) => api.get(`${BASE}/recent-sales/`,        { params });
export const getMonthlySummary     = (params = {}) => api.get(`${BASE}/monthly-summary/`,    { params });
