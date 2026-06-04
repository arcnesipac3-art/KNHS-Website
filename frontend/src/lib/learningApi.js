/**
 * Learning Features API Service
 * Sprint 3: Assignments, Submissions, Materials, Grades, Attendance, Communications
 */

import api from './api'

// ============================================================================
// ASSIGNMENTS
// ============================================================================

export const assignmentApi = {
  /**
   * Get all assignments with optional filters
   * @param {Object} filters - { class_subject, status }
   */
  getAll: (filters = {}) => api.get('/assignments/', { params: filters }),

  /**
   * Get single assignment
   */
  getById: (id) => api.get(`/assignments/${id}/`),

  /**
   * Create new assignment (teacher/admin)
   */
  create: (data) => api.post('/assignments/', data),

  /**
   * Update assignment (teacher/admin)
   */
  update: (id, data) => api.patch(`/assignments/${id}/`, data),

  /**
   * Delete assignment (teacher/admin)
   */
  delete: (id) => api.delete(`/assignments/${id}/`),

  /**
   * Publish assignment (teacher/admin)
   */
  publish: (id) => api.post(`/assignments/${id}/publish/`),

  /**
   * Get all submissions for an assignment (teacher)
   */
  getSubmissions: (id) => api.get(`/assignments/${id}/submissions/`),
}

// ============================================================================
// SUBMISSIONS
// ============================================================================

export const submissionApi = {
  /**
   * Get all submissions with optional filters
   * @param {Object} filters - { assignment }
   */
  getAll: (filters = {}) => api.get('/submissions/', { params: filters }),

  /**
   * Get single submission
   */
  getById: (id) => api.get(`/submissions/${id}/`),

  /**
   * Submit assignment (student)
   * @param {Object} data - { assignment_id, file_urls, text_response }
   */
  submit: (data) => api.post('/submissions/submit/', data),

  /**
   * Grade submission (teacher/admin)
   * @param {string} id - Submission ID
   * @param {Object} data - { score, feedback }
   */
  grade: (id, data) => api.post(`/submissions/${id}/grade/`, data),
}

// ============================================================================
// LEARNING MATERIALS
// ============================================================================

export const learningMaterialApi = {
  /**
   * Get all learning materials with optional filters
   * @param {Object} filters - { class_subject }
   */
  getAll: (filters = {}) => api.get('/learning-materials/', { params: filters }),

  /**
   * Get single learning material
   */
  getById: (id) => api.get(`/learning-materials/${id}/`),

  /**
   * Upload learning material (teacher/admin)
   */
  create: (data) => api.post('/learning-materials/', data),

  /**
   * Update learning material (teacher/admin)
   */
  update: (id, data) => api.patch(`/learning-materials/${id}/`, data),

  /**
   * Delete learning material (teacher/admin)
   */
  delete: (id) => api.delete(`/learning-materials/${id}/`),
}

// ============================================================================
// GRADES
// ============================================================================

export const gradeApi = {
  /**
   * Get all grades with optional filters
   * @param {Object} filters - { class_subject, quarter, student }
   */
  getAll: (filters = {}) => api.get('/grades/', { params: filters }),

  /**
   * Get single grade
   */
  getById: (id) => api.get(`/grades/${id}/`),

  /**
   * Batch grade input (teacher/admin)
   * @param {Object} data - { class_subject_id, quarter_id, grades: [...] }
   */
  batchInput: (data) => api.post('/grades/batch_input/', data),

  /**
   * Publish grades for class-subject-quarter (teacher/admin)
   * @param {Object} data - { class_subject_id, quarter_id }
   */
  publish: (data) => api.post('/grades/publish/', data),

  /**
   * Unlock published grade (admin only)
   * @param {string} id - Grade ID
   * @param {string} reason - Reason for unlock
   */
  unlock: (id, reason) => api.post(`/grades/${id}/unlock/`, { reason }),
}

// ============================================================================
// ATTENDANCE
// ============================================================================

export const attendanceApi = {
  /**
   * Get attendance records with optional filters
   * @param {Object} filters - { classroom, date_from, date_to, student }
   */
  getAll: (filters = {}) => api.get('/attendance/', { params: filters }),

  /**
   * Get single attendance record
   */
  getById: (id) => api.get(`/attendance/${id}/`),

  /**
   * Bulk mark attendance (teacher/admin)
   * @param {Object} data - { classroom_id, date, attendance: [...] }
   */
  bulkMark: (data) => api.post('/attendance/bulk_mark/', data),

  /**
   * Get attendance summary for classroom
   * @param {string} classroomId - Classroom ID
   * @param {string} dateFrom - Start date (YYYY-MM-DD)
   * @param {string} dateTo - End date (YYYY-MM-DD)
   */
  getSummary: (classroomId, dateFrom, dateTo) =>
    api.get('/attendance/summary/', {
      params: { classroom: classroomId, date_from: dateFrom, date_to: dateTo },
    }),
}

// ============================================================================
// ANNOUNCEMENTS
// ============================================================================

export const announcementApi = {
  /**
   * Get all announcements with optional filters
   * @param {Object} filters - { exclude_expired }
   */
  getAll: (filters = {}) => api.get('/announcements/', { params: filters }),

  /**
   * Get single announcement
   */
  getById: (id) => api.get(`/announcements/${id}/`),

  /**
   * Create announcement (teacher for classroom, admin for all)
   */
  create: (data) => api.post('/announcements/', data),

  /**
   * Update announcement
   */
  update: (id, data) => api.patch(`/announcements/${id}/`, data),

  /**
   * Delete announcement
   */
  delete: (id) => api.delete(`/announcements/${id}/`),

  /**
   * Publish announcement
   * @param {string} id - Announcement ID
   * @param {Object} data - { publish_now, scheduled_time? }
   */
  publish: (id, data) => api.post(`/announcements/${id}/publish/`, data),

  /**
   * Mark announcement as read
   */
  markRead: (id) => api.post(`/announcements/${id}/mark_read/`),

  /**
   * Get unread announcements
   */
  getUnread: () => api.get('/announcements/unread/'),
}

// ============================================================================
// NOTIFICATIONS
// ============================================================================

export const notificationApi = {
  /**
   * Get all notifications with optional filters
   * @param {Object} filters - { is_read }
   */
  getAll: (filters = {}) => api.get('/notifications/', { params: filters }),

  /**
   * Get single notification
   */
  getById: (id) => api.get(`/notifications/${id}/`),

  /**
   * Mark all notifications as read
   */
  markAllRead: () => api.post('/notifications/mark_all_read/'),

  /**
   * Mark single notification as read
   */
  markRead: (id) => api.post(`/notifications/${id}/mark_read/`),

  /**
   * Get unread notification count
   */
  getUnreadCount: () => api.get('/notifications/unread_count/'),
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Get all data for a class-subject
 */
export async function getClassSubjectContent(classSubjectId) {
  const [assignmentsRes, materialsRes] = await Promise.all([
    assignmentApi.getAll({ class_subject: classSubjectId, status: 'published' }),
    learningMaterialApi.getAll({ class_subject: classSubjectId }),
  ])

  return {
    assignments: assignmentsRes.data,
    materials: materialsRes.data,
  }
}

/**
 * Get student's grades for current quarter
 */
export async function getMyCurrentGrades(quarterId) {
  const { data } = await gradeApi.getAll({ quarter: quarterId })
  return data
}

/**
 * Get student's pending assignments
 */
export async function getMyPendingAssignments() {
  const { data } = await assignmentApi.getAll({ status: 'published' })
  
  // Get submissions to check what's already submitted
  const { data: submissions } = await submissionApi.getAll()
  const submittedIds = new Set(submissions.map((s) => s.assignment))

  // Filter to assignments not yet submitted and not overdue
  return data.filter((assignment) => 
    !submittedIds.has(assignment.id) && !assignment.is_overdue
  )
}

/**
 * Get dashboard data for student
 */
export async function getStudentDashboard() {
  const [announcementsRes, notificationsRes, assignmentsRes, gradesRes] = await Promise.all([
    announcementApi.getUnread(),
    notificationApi.getAll({ is_read: false }),
    assignmentApi.getAll({ status: 'published' }),
    gradeApi.getAll(),
  ])

  const { data: submissions } = await submissionApi.getAll()
  const submittedIds = new Set(submissions.map((s) => s.assignment))

  const pendingAssignments = assignmentsRes.data.filter(
    (a) => !submittedIds.has(a.id) && !a.is_overdue
  )
  const overdueAssignments = assignmentsRes.data.filter(
    (a) => !submittedIds.has(a.id) && a.is_overdue
  )

  return {
    unreadAnnouncements: announcementsRes.data,
    unreadNotifications: notificationsRes.data,
    pendingAssignments,
    overdueAssignments,
    publishedGrades: gradesRes.data.filter((g) => g.status === 'published'),
    stats: {
      pendingCount: pendingAssignments.length,
      overdueCount: overdueAssignments.length,
      unreadNotifications: notificationsRes.data.length,
    },
  }
}

/**
 * Get dashboard data for teacher
 */
export async function getTeacherDashboard() {
  const [assignmentsRes, submissionsRes, gradesRes] = await Promise.all([
    assignmentApi.getAll(),
    submissionApi.getAll(),
    gradeApi.getAll(),
  ])

  const ungradedSubmissions = submissionsRes.data.filter((s) => s.status === 'submitted' || s.status === 'late')
  const draftGrades = gradesRes.data.filter((g) => g.status === 'draft' || g.status === 'computed')

  return {
    myAssignments: assignmentsRes.data,
    ungradedSubmissions,
    draftGrades,
    stats: {
      totalAssignments: assignmentsRes.data.length,
      ungradedCount: ungradedSubmissions.length,
      draftGradesCount: draftGrades.length,
    },
  }
}
