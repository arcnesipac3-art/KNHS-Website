import { QueryClient } from '@tanstack/react-query'

// Create a QueryClient with optimized caching settings
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Default stale time for all queries
      staleTime: 5 * 60 * 1000, // 5 minutes
      // Keep cached data for 10 minutes after it becomes stale
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      // Don't refetch on window focus to reduce unnecessary requests
      refetchOnWindowFocus: false,
      // Retry failed requests once
      retry: 1,
      // Retry with exponential backoff
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      // Retry mutations once
      retry: 1,
      // Don't retry mutations on failure (usually user needs to intervene)
      retryDelay: 1000,
    },
  },
})

// Query key factory for consistent cache keys
export const queryKeys = {
  // Dashboard queries
  dashboard: {
    all: ['dashboard'],
    student: () => ['dashboard', 'student'],
    teacher: () => ['dashboard', 'teacher'],
    admin: () => ['dashboard', 'admin'],
    principal: () => ['dashboard', 'principal'],
    guidance: () => ['dashboard', 'guidance'],
    registrar: () => ['dashboard', 'registrar'],
    parent: () => ['dashboard', 'parent'],
  },

  // User/Student/Teacher queries
  users: {
    all: ['users'],
    lists: () => ['users', 'list'],
    list: (filters) => ['users', 'list', filters],
    details: () => ['users', 'detail'],
    detail: (id) => ['users', 'detail', id],
    students: (filters) => ['users', 'students', filters],
    teachers: (filters) => ['users', 'teachers', filters],
  },

  // Academic queries
  academic: {
    years: {
      all: ['academic', 'years'],
      current: () => ['academic', 'years', 'current'],
    },
    quarters: {
      all: (yearId) => ['academic', 'quarters', yearId],
      current: () => ['academic', 'quarters', 'current'],
    },
    subjects: {
      all: (filters) => ['academic', 'subjects', filters],
      detail: (id) => ['academic', 'subjects', id],
    },
    classrooms: {
      all: (filters) => ['academic', 'classrooms', filters],
      detail: (id) => ['academic', 'classrooms', id],
      enrollments: (id) => ['academic', 'classrooms', id, 'enrollments'],
    },
  },

  // Announcement queries
  announcements: {
    all: (filters) => ['announcements', filters],
    detail: (id) => ['announcements', id],
    unread: () => ['announcements', 'unread'],
  },

  // Assignment queries
  assignments: {
    all: (filters) => ['assignments', filters],
    detail: (id) => ['assignments', id],
    submissions: (id) => ['assignments', id, 'submissions'],
  },

  // Grade queries
  grades: {
    all: (filters) => ['grades', filters],
    student: (studentId) => ['grades', 'student', studentId],
    draft: () => ['grades', 'draft'],
  },

  // Attendance queries
  attendance: {
    summary: () => ['attendance', 'summary'],
    studentAlerts: () => ['attendance', 'student-alerts'],
    history: (filters) => ['attendance', 'history', filters],
  },

  // Schedule queries
  schedule: {
    all: (filters) => ['schedule', filters],
    today: () => ['schedule', 'today'],
  },

  // Notification queries
  notifications: {
    all: (filters) => ['notifications', filters],
    unread: () => ['notifications', 'unread'],
  },

  // Material/Resource queries
  materials: {
    all: (filters) => ['materials', filters],
    detail: (id) => ['materials', id],
  },

  // Enrollment queries
  enrollment: {
    all: (filters) => ['enrollment', filters],
    detail: (id) => ['enrollment', id],
    tracking: (lrn) => ['enrollment', 'tracking', lrn],
  },
}

// Stale time constants for different data types (in milliseconds)
export const staleTime = {
  // Dashboard: 10 minutes - relatively stable data
  dashboard: 10 * 60 * 1000,
  
  // Students: 5 minutes - can change frequently
  students: 5 * 60 * 1000,
  
  // Teachers: 5 minutes - can change frequently
  teachers: 5 * 60 * 1000,
  
  // Subjects: 30 minutes - rarely changes
  subjects: 30 * 60 * 1000,
  
  // Sections/Classrooms: 30 minutes - rarely changes
  sections: 30 * 60 * 1000,
  
  // School Years: 1 hour - very stable
  schoolYears: 60 * 60 * 1000,
  
  // Announcements: 5 minutes - can be posted frequently
  announcements: 5 * 60 * 1000,
  
  // Assignments: 5 minutes - can be created/updated frequently
  assignments: 5 * 60 * 1000,
  
  // Grades: 10 minutes - don't change too often once published
  grades: 10 * 60 * 1000,
  
  // Attendance: 5 minutes - can be updated daily
  attendance: 5 * 60 * 1000,
  
  // Schedule: 30 minutes - relatively stable
  schedule: 30 * 60 * 1000,
  
  // Notifications: 2 minutes - can be frequent
  notifications: 2 * 60 * 1000,
  
  // Materials: 30 minutes - rarely change
  materials: 30 * 60 * 1000,
  
  // Enrollment: 10 minutes - can change during enrollment periods
  enrollment: 10 * 60 * 1000,
}
