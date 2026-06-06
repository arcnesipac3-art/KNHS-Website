import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../lib/queryClient'
import { userApi } from '../lib/userApi'
import { announcementApi } from '../lib/learningApi'
import { getCurrentAcademicYearWithQuarters } from '../lib/academicApi'
import api from '../lib/api'

/**
 * Hook for prefetching data for frequently visited pages
 * Call this in your layout component or on route change to improve perceived performance
 */
export function usePrefetch() {
  const queryClient = useQueryClient()

  /**
   * Prefetch dashboard data based on user role
   */
  const prefetchDashboard = (role) => {
    switch (role) {
      case 'student':
        queryClient.prefetchQuery({
          queryKey: queryKeys.dashboard.student(),
          queryFn: async () => {
            const { getStudentDashboard } = await import('../lib/learningApi')
            return getStudentDashboard()
          },
          staleTime: 10 * 60 * 1000, // 10 minutes
        })
        break
      case 'teacher':
        queryClient.prefetchQuery({
          queryKey: queryKeys.dashboard.teacher(),
          queryFn: async () => {
            const { getTeacherDashboard } = await import('../lib/learningApi')
            return getTeacherDashboard()
          },
          staleTime: 10 * 60 * 1000,
        })
        break
      case 'admin':
        queryClient.prefetchQuery({
          queryKey: queryKeys.dashboard.admin(),
          queryFn: async () => {
            const { data } = await api.get('/dashboard/admin/')
            return data
          },
          staleTime: 10 * 60 * 1000,
        })
        break
      case 'principal':
        queryClient.prefetchQuery({
          queryKey: queryKeys.dashboard.principal(),
          queryFn: async () => {
            const { data } = await api.get('/dashboard/principal/')
            return data
          },
          staleTime: 10 * 60 * 1000,
        })
        break
      case 'guidance':
        queryClient.prefetchQuery({
          queryKey: queryKeys.dashboard.guidance(),
          queryFn: async () => {
            const { data } = await api.get('/dashboard/guidance/')
            return data
          },
          staleTime: 10 * 60 * 1000,
        })
        break
      case 'registrar':
        queryClient.prefetchQuery({
          queryKey: queryKeys.dashboard.registrar(),
          queryFn: async () => {
            const { data } = await api.get('/dashboard/registrar/')
            return data
          },
          staleTime: 10 * 60 * 1000,
        })
        break
      case 'parent':
        queryClient.prefetchQuery({
          queryKey: queryKeys.dashboard.parent(),
          queryFn: async () => {
            const { data } = await api.get('/dashboard/parent/')
            return data
          },
          staleTime: 10 * 60 * 1000,
        })
        break
    }
  }

  /**
   * Prefetch students list
   */
  const prefetchStudents = (filters = {}) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.users.students(filters),
      queryFn: async () => {
        const { data } = await userApi.getAll({ ...filters, role: 'student' })
        return Array.isArray(data) ? data : (data?.results ?? [])
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
    })
  }

  /**
   * Prefetch teachers list
   */
  const prefetchTeachers = (filters = {}) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.users.teachers(filters),
      queryFn: async () => {
        const { data } = await userApi.getAll({ ...filters, role: 'teacher' })
        return Array.isArray(data) ? data : (data?.results ?? [])
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
    })
  }

  /**
   * Prefetch announcements
   */
  const prefetchAnnouncements = (filters = {}) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.announcements.all(filters),
      queryFn: async () => {
        const { data } = await announcementApi.getAll(filters)
        return Array.isArray(data) ? data : (data?.results ?? [])
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
    })
  }

  /**
   * Prefetch current academic year
   */
  const prefetchAcademicYear = () => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.academic.years.current(),
      queryFn: async () => {
        return getCurrentAcademicYearWithQuarters()
      },
      staleTime: 60 * 60 * 1000, // 1 hour
    })
  }

  /**
   * Prefetch classes/classrooms
   */
  const prefetchClasses = (filters = {}) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.academic.classrooms.all(filters),
      queryFn: async () => {
        const { classroomApi } = await import('../lib/academicApi')
        const { data } = await classroomApi.getAll(filters)
        return Array.isArray(data) ? data : (data?.results ?? [])
      },
      staleTime: 30 * 60 * 1000, // 30 minutes
    })
  }

  /**
   * Prefetch all common data for a logged-in user
   * Call this after successful login
   */
  const prefetchCommonData = (user) => {
    if (!user) return

    // Prefetch dashboard based on role
    prefetchDashboard(user.role)

    // Prefetch academic year (needed by most dashboards)
    prefetchAcademicYear()

    // Prefetch announcements (shown in all dashboards)
    prefetchAnnouncements({ limit: 5 })

    // Role-specific prefetching
    if (user.role === 'admin' || user.role === 'principal') {
      // Prefetch students and teachers for admin users
      prefetchStudents()
      prefetchTeachers()
      prefetchClasses()
    }

    if (user.role === 'teacher') {
      // Prefetch today's schedule for teachers
      queryClient.prefetchQuery({
        queryKey: queryKeys.schedule.today(),
        queryFn: async () => {
          const { data } = await api.get('/schedule/today/')
          return Array.isArray(data) ? data : []
        },
        staleTime: 30 * 60 * 1000,
      })
    }

    if (user.role === 'student') {
      // Prefetch attendance summary for students
      queryClient.prefetchQuery({
        queryKey: queryKeys.attendance.summary(),
        queryFn: async () => {
          const { data } = await api.get('/attendance/summary/')
          return data
        },
        staleTime: 5 * 60 * 1000,
      })
    }
  }

  return {
    prefetchDashboard,
    prefetchStudents,
    prefetchTeachers,
    prefetchAnnouncements,
    prefetchAcademicYear,
    prefetchClasses,
    prefetchCommonData,
  }
}
