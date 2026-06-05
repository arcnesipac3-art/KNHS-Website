/**
 * User Management API Service
 * For admin user CRUD operations
 */

import api from './api'

export const userApi = {
  /**
   * Get all users with optional filters
   * @param {Object} filters - { role, is_active, is_approved, search }
   */
  getAll: (filters = {}) => api.get('/users/', { params: filters }),

  /**
   * Get single user details
   */
  getById: (id) => api.get(`/users/${id}/`),

  /**
   * Create new user (admin only)
   */
  create: (data) => api.post('/users/', data),

  /**
   * Update user (admin only)
   */
  update: (id, data) => api.patch(`/users/${id}/`, data),

  /**
   * Delete user (admin only)
   */
  delete: (id) => api.delete(`/users/${id}/`),

  /**
   * Reset user password (admin only)
   */
  resetPassword: (id) => api.post(`/users/${id}/reset_password/`),

  /**
   * Activate user account (admin only)
   */
  activate: (id) => api.post(`/users/${id}/activate/`),

  /**
   * Deactivate user account (admin only)
   */
  deactivate: (id) => api.post(`/users/${id}/deactivate/`),
}
