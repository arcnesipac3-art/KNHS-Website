/**
 * Academic Structure API Service
 * Sprint 2: Academic years, quarters, subjects, classrooms, enrollments
 * Added: Academic Calendar Management (years, quarters, events)
 * Added: Admin classroom management functions
 */

import api from './api'

// ============================================================================
// ACADEMIC YEARS
// ============================================================================

export const academicYearApi = {
  /**
   * Get all academic years
   */
  getAll: () => api.get('/academic-years/'),

  /**
   * Get single academic year
   */
  getById: (id) => api.get(`/academic-years/${id}/`),

  /**
   * Create new academic year (admin only)
   */
  create: (data) => api.post('/academic-years/', data),

  /**
   * Update academic year (admin only)
   */
  update: (id, data) => api.patch(`/academic-years/${id}/`, data),

  /**
   * Delete academic year (admin only)
   */
  delete: (id) => api.delete(`/academic-years/${id}/`),

  /**
   * Set as current academic year (admin only)
   */
  setCurrent: (id) => api.post(`/academic-years/${id}/set_current/`),
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
    return api.get('/quarters/', { params })
  },

  /**
   * Get single quarter
   */
  getById: (id) => api.get(`/quarters/${id}/`),

  /**
   * Create new quarter (admin only)
   */
  create: (data) => api.post('/quarters/', data),

  /**
   * Update quarter (admin only)
   */
  update: (id, data) => api.patch(`/quarters/${id}/`, data),

  /**
   * Delete quarter (admin only)
   */
  delete: (id) => api.delete(`/quarters/${id}/`),
}

// ============================================================================
// SUBJECTS
// ============================================================================

export const subjectApi = {
  /**
   * Get all subjects with optional filters
   * @param {Object} filters - { grade_level, strand, active_only }
   */
  getAll: (filters = {}) => api.get('/subjects/', { params: filters }),

  /**
   * Get single subject
   */
  getById: (id) => api.get(`/subjects/${id}/`),

  /**
   * Create new subject (admin only)
   */
  create: (data) => api.post('/subjects/', data),

  /**
   * Update subject (admin only)
   */
  update: (id, data) => api.patch(`/subjects/${id}/`, data),

  /**
   * Delete subject (admin only)
   */
  delete: (id) => api.delete(`/subjects/${id}/`),
}

// ============================================================================
// CLASSROOMS
// ============================================================================

export const classroomApi = {
  /**
   * Get all classrooms with optional filters
   * @param {Object} filters - { academic_year, grade_level, advised }
   */
  getAll: (filters = {}) => api.get('/classrooms/', { params: filters }),

  /**
   * Get single classroom detail (includes join_code for teacher/admin)
   */
  getById: (id) => api.get(`/classrooms/${id}/`),

  /**
   * Create new classroom (admin only)
   */
  create: (data) => api.post('/classrooms/', data),

  /**
   * Update classroom (admin only)
   */
  update: (id, data) => api.patch(`/classrooms/${id}/`, data),

  /**
   * Delete classroom (admin only)
   */
  delete: (id) => api.delete(`/classrooms/${id}/`),

  /**
   * Join classroom using join code (student only)
   */
  join: (joinCode) => api.post('/classrooms/join/', { join_code: joinCode }),

  /**
   * Regenerate join code for classroom (adviser/admin only)
   */
  regenerateCode: (id) => api.post(`/classrooms/${id}/regenerate_code/`),

  /**
   * Get enrollments for a classroom
   * @param {string} id - Classroom ID
   * @param {string} status - Optional status filter (active, transferred, dropped, completed)
   */
  getEnrollments: (id, status) => {
    const params = status ? { status } : {}
    return api.get(`/classrooms/${id}/enrollments/`, { params })
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
  getAll: (filters = {}) => api.get('/class-subjects/', { params: filters }),

  /**
   * Get single class subject
   */
  getById: (id) => api.get(`/class-subjects/${id}/`),

  /**
   * Create new class subject (admin only)
   */
  create: (data) => api.post('/class-subjects/', data),

  /**
   * Update class subject (admin only)
   */
  update: (id, data) => api.patch(`/class-subjects/${id}/`, data),

  /**
   * Delete class subject (admin only)
   */
  delete: (id) => api.delete(`/class-subjects/${id}/`),
}

// ============================================================================
// ENROLLMENTS
// ============================================================================

export const enrollmentApi = {
  /**
   * Get all enrollments with optional filters
   * @param {Object} filters - { classroom, student, status }
   */
  getAll: (filters = {}) => api.get('/enrollments/', { params: filters }),

  /**
   * Get single enrollment
   */
  getById: (id) => api.get(`/enrollments/${id}/`),

  /**
   * Create new enrollment (admin only)
   */
  create: (data) => api.post('/enrollments/', data),

  /**
   * Update enrollment (admin only)
   */
  update: (id, data) => api.patch(`/enrollments/${id}/`, data),

  /**
   * Delete enrollment (admin only)
   */
  delete: (id) => api.delete(`/enrollments/${id}/`),

  /**
   * Transfer student to different classroom (admin only)
   */
  transfer: (id, newClassroomId) =>
    api.post(`/enrollments/${id}/transfer/`, { new_classroom_id: newClassroomId }),
}

// ============================================================================
// ACADEMIC CALENDAR MANAGEMENT (NEW)
// ============================================================================

export const academicCalendarApi = {
  // Academic Years
  getAcademicYears: () => api.get('/academic-years/'),
  
  createAcademicYear: (data) => api.post('/academic-years/', data),
  
  updateAcademicYear: (id, data) => api.patch(`/academic-years/${id}/`, data),
  
  deleteAcademicYear: (id) => api.delete(`/academic-years/${id}/`),
  
  setCurrentAcademicYear: (id) => api.post(`/academic-years/${id}/set_current/`),

  // Quarters
  getQuarters: (academicYearId = null) => {
    const params = academicYearId ? { academic_year: academicYearId } : {}
    return api.get('/quarters/', { params })
  },
  
  createQuarter: (data) => api.post('/quarters/', data),
  
  updateQuarter: (id, data) => api.patch(`/quarters/${id}/`, data),
  
  deleteQuarter: (id) => api.delete(`/quarters/${id}/`),

  // School Events
  getEvents: (filters = {}) => api.get('/events/', { params: filters }),
  
  createEvent: (data) => api.post('/events/', data),
  
  updateEvent: (id, data) => api.patch(`/events/${id}/`, data),
  
  deleteEvent: (id) => api.delete(`/events/${id}/`),
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Get current academic year and its quarters
 */
export async function getCurrentAcademicYearWithQuarters() {
  const { data: yearsData } = await academicYearApi.getAll()
  // Handle both paginated { results: [...] } and plain array responses
  const years = Array.isArray(yearsData) ? yearsData : (yearsData?.results ?? [])
  const currentYear = years.find((y) => y.is_current)

  if (!currentYear) {
    return { academicYear: null, quarters: [] }
  }

  const { data: quartersData } = await quarterApi.getAll(currentYear.id)
  // Handle both paginated and plain array responses
  const quarters = Array.isArray(quartersData) ? quartersData : (quartersData?.results ?? [])

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
  // Handle both paginated { results: [...] } and plain array responses
  return Array.isArray(data) ? data : (data?.results ?? [])
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
  return Array.isArray(data) ? data : (data?.results ?? [])
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

  const subjectsData = subjectsResponse.data
  const enrollmentsData = enrollmentsResponse.data

  return {
    classroom: classroomResponse.data,
    subjects: Array.isArray(subjectsData) ? subjectsData : (subjectsData?.results ?? []),
    enrollments: Array.isArray(enrollmentsData) ? enrollmentsData : (enrollmentsData?.results ?? []),
  }
}

// ============================================================================
// ADMIN CLASSROOM MANAGEMENT
// ============================================================================

/**
 * Get all teachers for classroom assignment
 */
export async function getTeachers() {
  const { data } = await api.get('/users/', { params: { role: 'teacher' } })
  return Array.isArray(data) ? data : (data?.results ?? [])
}

/**
 * Get all students for enrollment
 */
export async function getStudents(filters = {}) {
  const { data } = await api.get('/users/', { params: { role: 'student', ...filters } })
  return Array.isArray(data) ? data : (data?.results ?? [])
}

/**
 * Create a new classroom (admin only)
 */
export async function createClassroom(classroomData) {
  const { data } = await classroomApi.create(classroomData)
  return data
}

/**
 * Update a classroom (admin only)
 */
export async function updateClassroom(classroomId, classroomData) {
  const { data } = await classroomApi.update(classroomId, classroomData)
  return data
}

/**
 * Delete a classroom (admin only)
 */
export async function deleteClassroom(classroomId) {
  await classroomApi.delete(classroomId)
}

/**
 * Assign subject to classroom (admin only)
 */
export async function assignSubjectToClassroom(classSubjectData) {
  const { data } = await classSubjectApi.create(classSubjectData)
  return data
}

/**
 * Remove subject from classroom (admin only)
 */
export async function removeSubjectFromClassroom(classSubjectId) {
  await classSubjectApi.delete(classSubjectId)
}

/**
 * Enroll student in classroom (admin only)
 */
export async function enrollStudent(enrollmentData) {
  const { data } = await enrollmentApi.create(enrollmentData)
  return data
}

/**
 * Remove student from classroom (admin only)
 */
export async function removeStudent(enrollmentId) {
  await enrollmentApi.delete(enrollmentId)
}
