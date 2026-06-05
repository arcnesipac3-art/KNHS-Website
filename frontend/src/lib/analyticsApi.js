/**
 * Analytics API Service
 */

import api from './api'

export const analyticsApi = {
  /**
   * Get attendance overview analytics
   * @param {Object} params - { date_from, date_to, classroom }
   */
  getAttendanceOverview: (params = {}) => 
    api.get('/analytics/attendance_overview/', { params }),

  /**
   * Get grade analytics and distribution
   * @param {Object} params - { quarter, grade_level, subject }
   */
  getGradeAnalytics: (params = {}) => 
    api.get('/analytics/grade_analytics/', { params }),

  /**
   * Get assignment submission analytics
   * @param {Object} params - { class_subject, date_from }
   */
  getAssignmentAnalytics: (params = {}) => 
    api.get('/analytics/assignment_analytics/', { params }),

  /**
   * Get dashboard overview stats
   */
  getDashboardOverview: () => 
    api.get('/analytics/dashboard_overview/'),
}
