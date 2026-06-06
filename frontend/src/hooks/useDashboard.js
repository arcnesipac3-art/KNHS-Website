import { useQuery } from '@tanstack/react-query'
import { getStudentDashboard, getTeacherDashboard } from '../lib/learningApi'
import { getCurrentAcademicYearWithQuarters } from '../lib/academicApi'
import api from '../lib/api'
import { queryKeys, staleTime } from '../lib/queryClient'

/**
 * Hook for fetching student dashboard data
 */
export function useStudentDashboard() {
  return useQuery({
    queryKey: queryKeys.dashboard.student(),
    queryFn: async () => {
      const data = await getStudentDashboard()
      return data
    },
    staleTime: staleTime.dashboard,
  })
}

/**
 * Hook for fetching teacher dashboard data
 */
export function useTeacherDashboard() {
  return useQuery({
    queryKey: queryKeys.dashboard.teacher(),
    queryFn: async () => {
      const data = await getTeacherDashboard()
      return data
    },
    staleTime: staleTime.dashboard,
  })
}

/**
 * Hook for fetching admin dashboard data
 */
export function useAdminDashboard() {
  return useQuery({
    queryKey: queryKeys.dashboard.admin(),
    queryFn: async () => {
      const { data } = await api.get('/dashboard/')
      return data
    },
    staleTime: staleTime.dashboard,
  })
}

/**
 * Hook for fetching principal dashboard data
 */
export function usePrincipalDashboard() {
  return useQuery({
    queryKey: queryKeys.dashboard.principal(),
    queryFn: async () => {
      const { data } = await api.get('/dashboard/')
      return data
    },
    staleTime: staleTime.dashboard,
  })
}

/**
 * Hook for fetching guidance dashboard data
 */
export function useGuidanceDashboard() {
  return useQuery({
    queryKey: queryKeys.dashboard.guidance(),
    queryFn: async () => {
      const { data } = await api.get('/dashboard/')
      return data
    },
    staleTime: staleTime.dashboard,
  })
}

/**
 * Hook for fetching registrar dashboard data
 */
export function useRegistrarDashboard() {
  return useQuery({
    queryKey: queryKeys.dashboard.registrar(),
    queryFn: async () => {
      const { data } = await api.get('/dashboard/')
      return data
    },
    staleTime: staleTime.dashboard,
  })
}

/**
 * Hook for fetching parent dashboard data
 */
export function useParentDashboard() {
  return useQuery({
    queryKey: queryKeys.dashboard.parent(),
    queryFn: async () => {
      const { data } = await api.get('/dashboard/')
      return data
    },
    staleTime: staleTime.dashboard,
  })
}

/**
 * Hook for fetching current academic year with quarters
 */
export function useCurrentAcademicYear() {
  return useQuery({
    queryKey: queryKeys.academic.years.current(),
    queryFn: async () => {
      const data = await getCurrentAcademicYearWithQuarters()
      return data
    },
    staleTime: staleTime.schoolYears,
  })
}

/**
 * Hook for fetching attendance summary
 */
export function useAttendanceSummary() {
  return useQuery({
    queryKey: queryKeys.attendance.summary(),
    queryFn: async () => {
      const { data } = await api.get('/attendance/summary/')
      return data
    },
    staleTime: staleTime.attendance,
  })
}

/**
 * Hook for fetching student alerts (for teachers)
 */
export function useStudentAlerts() {
  return useQuery({
    queryKey: queryKeys.attendance.studentAlerts(),
    queryFn: async () => {
      const { data } = await api.get('/attendance/student-alerts/')
      return Array.isArray(data) ? data : (data?.results ?? [])
    },
    staleTime: staleTime.attendance,
  })
}

/**
 * Hook for fetching today's schedule
 */
export function useTodaySchedule() {
  return useQuery({
    queryKey: queryKeys.schedule.today(),
    queryFn: async () => {
      const { data } = await api.get('/schedule/today/')
      return Array.isArray(data) ? data : []
    },
    staleTime: staleTime.schedule,
  })
}

/**
 * Hook for fetching recent announcements (for dashboard)
 */
export function useRecentAnnouncements(limit = 5) {
  return useQuery({
    queryKey: queryKeys.announcements.all({ limit }),
    queryFn: async () => {
      const { data } = await api.get('/announcements/', { params: { limit } })
      return Array.isArray(data) ? data : (data?.results ?? [])
    },
    staleTime: staleTime.announcements,
  })
}
