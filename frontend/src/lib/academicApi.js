/**
 * Academic Calendar API Service
 * For managing Academic Years, Quarters, and School Events
 */

import api from './api'

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
