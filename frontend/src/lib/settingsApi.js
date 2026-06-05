/**
 * School Settings API Service
 */

import api from './api'

export const schoolSettingsApi = {
  /**
   * Get school settings (authenticated users)
   */
  get: () => api.get('/school-settings/'),

  /**
   * Update school settings (admin only)
   * @param {Object} data - Settings data to update
   */
  update: (data) => api.patch(`/school-settings/${data.id}/`, data),

  /**
   * Get public school settings (no auth required)
   */
  getPublic: () => api.get('/school-settings/public_settings/'),
}
