/**
 * Academic Structure API Service
 * Sprint 2: Academic years, quarters, subjects, classrooms, enrollments
 * Added: Academic Calendar Management (years, quarters, events)
 */

import api from './api'

// ============================================================================
// ACADEMIC YEARS
// ============================================================================

export const academicYearApi = {
  /**
   * Get all academic years
   */
  getAll: () => api.get('/academics/academic-years/'),

  /**
   * Get single academic year
   */
  getById: (id) => api.get(`/academics/academic-years/${id}/`),

  /**
   * Create new academic year (admin only)
   */
  create: (data) => api.post('/academics/academic-years/', data),

  /**
   * Update academic year (admin only)
   */
  update: (id, data) => api.patch(`/academics/academic-years/${id}/`, data),

  /**
   * Delete academic year (admin only)
   */
  delete: (id) => api.delete(`/academics/academic-years/${id}/`),

  /**
   * Set as current academic year (admin only)
   */
  setCurrent: (id) => api.post(`/academics/academic-years/${id}/set_current/`),
}

// ============================================================================
// QUARTERS
// ============================================================================

export const quarterApi = {
  /**
   * Get all quarters, optionally filtered by academic year
   */
  getAll: (academicYearId) => {
    const params = academicYearId ? { academic_year: academicYearId } : {}
    return api.get('/academics/quarters/', { params })
  },

  /**
   * Get single quarter
   */
  getById: (id) => api.get(`/academics/quarters/${id}/`),

  /**
   * Create new quarter (admin only)
   */
  create: (data) => api.post('/academics/quarters/', data),

  /**
   * Update quarter (admin only)
   */
  update: (id, data) => api.patch(`/academics/quarters/${id}/`, data),

  /**
   * Delete quarter (admin only)
   */
  delete: (id) => api.delete(`/academics/quarters/${id}/`),
}

// ============================================================================
// SUBJECTS
// ============================================================================

export const subjectApi = {
  /**
   * Get all subjects with optional filters
   * @param {Object} filters - { grade_level, strand, active_only }
   */
  getAll: (filters = {}) => api.get('/academics/subjects/', { params: filters }),

  /**
   * Get single subject
   */
  getById: (id) => api.get(`/academics/subjects/${id}/`),

  /**
   * Create new subject (admin only)
   */
  create: (data) => api.post('/academics/subjects/', data),

  /**
   * Update subject (admin only)
   */
  update: (id, data) => api.patch(`/academics/subjects/${id}/`, data),

  /**
   * Delete subject (admin only)
   */
  delete: (id) => api.delete(`/academics/subjects/${id}/`),
}

// ============================================================================
// CLASSROOMS
// ============================================================================

export const classroomApi = {
  /**
   * Get all classrooms with optional filters
   * @param {Object} filters - { academic_year, grade_level, advised }
   */
  getAll: (filters = {}) => api.get('/academics/classrooms/', { params: filters }),

  /**
   * Get single classroom detail (includes join_code for teacher/admin)
   */
  getById: (id) => api.get(`/academics/classrooms/${id}/`),

  /**
   * Create new classroom (admin only)
   */
  create: (data) => api.post('/academics/classrooms/', data),

  /**
   * Update classroom (admin only)
   */
  update: (id, data) => api.patch(`/academics/classrooms/${id}/`, data),

  /**
   * Delete classroom (admin only)
   */
  delete: (id) => api.delete(`/academics/classrooms/${id}/`),

  /**
   * Join classroom using join code (student only)
   */
  join: (joinCode) => api.post('/academics/classrooms/join/', { join_code: joinCode }),

  /**
   * Regenerate join code for classroom (adviser/admin only)
   */
  regenerateCode: (id) => api.post(`/academics/classrooms/${id}/regenerate_code/`),

  /**
   * Get enrollments for a classroom
   * @param {string} id - Classroom ID
   * @param {string} status - Optional status filter (active, transferred, dropped, completed)
   */
  getEnrollments: (id, status) => {
    const params = status ? { status } : {}
    return api.get(`/academics/classrooms/${id}/enrollments/`, { params })
  },
}

// ============================================================================
// CLASS SUBJECTS
// ============================================================================

export const classSubjectApi = {
  /**
   * Get all class subjects with optional filters
   * @param {Object} filters - { classroom }
   */
  getAll: (filters = {}) => api.get('/academics/class-subjects/', { params: filters }),

  /**
   * Get single class subject
   */
  getById: (id) => api.get(`/academics/class-subjects/${id}/`),

  /**
   * Create new class subject (admin only)
   */
  create: (data) => api.post('/academics/class-subjects/', data),

  /**
   * Update class subject (admin only)
   */
  update: (id, data) => api.patch(`/academics/class-subjects/${id}/`, data),

  /**
   * Delete class subject (admin only)
   */
  delete: (id) => api.delete(`/academics/class-subjects/${id}/`),
}

// ============================================================================
// ENROLLMENTS
// ============================================================================

export const enrollmentApi = {
  /**
   * Get all enrollments with optional filters
   * @param {Object} filters - { classroom, student, status }
   */
  getAll: (filters = {}) => api.get('/academics/enrollments/', { params: filters }),

  /**
   * Get single enrollment
   */
  getById: (id) => api.get(`/academics/enrollments/${id}/`),

  /**
   * Create new enrollment (admin only)
   */
  create: (data) => api.post('/academics/enrollments/', data),

  /**
   * Update enrollment (admin only)
   */
  update: (id, data) => api.patch(`/academics/enrollments/${id}/`, data),

  /**
   * Delete enrollment (admin only)
   */
  delete: (id) => api.delete(`/academics/enrollments/${id}/`),

  /**
   * Transfer student to different classroom (admin only)
   */
  transfer: (id, newClassroomId) =>
    api.post(`/academics/enrollments/${id}/transfer/`, { new_classroom_id: newClassroomId }),
}

// ============================================================================
// ACADEMIC CALENDAR MANAGEMENT (NEW)
// ============================================================================

export const academicCalendarApi = {
  // Academic Years
  getAcademicYears: () => api.get('/academics/academic-years/'),
  
  createAcademicYear: (data) => api.post('/academics/academic-years/', data),
  
  updateAcademicYear: (id, data) => api.patch(`/academics/academic-years/${id}/`, data),
  
  deleteAcademicYear: (id) => api.delete(`/academics/academic-years/${id}/`),
  
  setCurrentAcademicYear: (id) => api.post(`/academics/academic-years/${id}/set_current/`),

  // Quarters
  getQuarters: (academicYearId = null) => {
    const params = academicYearId ? { academic_year: academicYearId } : {}
    return api.get('/academics/quarters/', { params })
  },
  
  createQuarter: (data) => api.post('/academics/quarters/', data),
  
  updateQuarter: (id, data) => api.patch(`/academics/quarters/${id}/`, data),
  
  deleteQuarter: (id) => api.delete(`/academics/quarters/${id}/`),

  // School Events
  getEvents: (filters = {}) => api.get('/academics/events/', { params: filters }),
  
  createEvent: (data) => api.post('/academics/events/', data),
  
  updateEvent: (id, data) => api.patch(`/academics/events/${id}/`, data),
  
  deleteEvent: (id) => api.delete(`/academics/events/${id}/`),
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Get current academic year and its quarters
 */
export async function getCurrentAcademicYearWithQuarters() {
  const { data: years } = await academicYearApi.getAll()
  const currentYear = years.find((y) => y.is_current)

  if (!currentYear) {
    return { academicYear: null, quarters: [] }
  }

  const { data: quarters } = await quarterApi.getAll(currentYear.id)

  return {
    academicYear: currentYear,
    quarters: quarters.sort((a, b) => a.number - b.number),
  }
}

/**
 * Get my classes (student or teacher view)
 */
export async function getMyClasses() {
  const { data } = await classroomApi.getAll()
  return data
}

/**
 * Get subjects for a specific grade level and strand
 */
export async function getSubjectsForGrade(gradeLevel, strand = '') {
  const filters = { grade_level: gradeLevel, active_only: true }
  if (strand) {
    filters.strand = strand
  }
  const { data } = await subjectApi.getAll(filters)
  return data
}

/**
 * Get classroom with all its subjects and enrollments
 */
export async function getClassroomDetails(classroomId) {
  const [classroomResponse, subjectsResponse, enrollmentsResponse] = await Promise.all([
    classroomApi.getById(classroomId),
    classSubjectApi.getAll({ classroom: classroomId }),
    classroomApi.getEnrollments(classroomId, 'active'),
  ])

  return {
    classroom: classroomResponse.data,
    subjects: subjectsResponse.data,
    enrollments: enrollmentsResponse.data,
  }
}
