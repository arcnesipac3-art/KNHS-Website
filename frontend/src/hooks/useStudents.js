import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { userApi } from '../lib/userApi'
import { queryKeys, staleTime } from '../lib/queryClient'

/**
 * Hook for fetching students with optional filters
 * @param {Object} filters - { role: 'student', is_active, is_approved, search, grade_level, strand }
 */
export function useStudents(filters = {}) {
  const studentFilters = { ...filters, role: 'student' }
  
  return useQuery({
    queryKey: queryKeys.users.students(studentFilters),
    queryFn: async () => {
      const { data } = await userApi.getAll(studentFilters)
      return Array.isArray(data) ? data : (data?.results ?? [])
    },
    staleTime: staleTime.students,
  })
}

/**
 * Hook for fetching a single student by ID
 */
export function useStudent(id) {
  return useQuery({
    queryKey: queryKeys.users.detail(id),
    queryFn: async () => {
      const { data } = await userApi.getById(id)
      return data
    },
    enabled: !!id,
    staleTime: staleTime.students,
  })
}

/**
 * Hook for creating a new student
 */
export function useCreateStudent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (userData) => {
      const { data } = await userApi.create({ ...userData, role: 'student' })
      return data
    },
    onSuccess: () => {
      // Invalidate students list to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.users.students() })
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() })
    },
  })
}

/**
 * Hook for updating a student
 */
export function useUpdateStudent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...userData }) => {
      const { data } = await userApi.update(id, userData)
      return data
    },
    onSuccess: (data, variables) => {
      // Invalidate specific student and students list
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.users.students() })
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() })
    },
  })
}

/**
 * Hook for deleting a student
 */
export function useDeleteStudent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id) => {
      await userApi.delete(id)
      return id
    },
    onSuccess: (id) => {
      // Invalidate specific student and students list
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.users.students() })
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() })
    },
  })
}

/**
 * Hook for activating/deactivating a student
 */
export function useToggleStudentActive() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, isActive }) => {
      if (isActive) {
        await userApi.deactivate(id)
      } else {
        await userApi.activate(id)
      }
      return { id, isActive }
    },
    onSuccess: (result) => {
      // Invalidate specific student and students list
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(result.id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.users.students() })
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() })
    },
  })
}

/**
 * Hook for resetting student password
 */
export function useResetStudentPassword() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id) => {
      const { data } = await userApi.resetPassword(id)
      return data
    },
    onSuccess: (data, id) => {
      // Invalidate specific student
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(id) })
    },
  })
}
