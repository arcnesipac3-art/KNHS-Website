import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { userApi } from '../lib/userApi'
import { queryKeys, staleTime } from '../lib/queryClient'

/**
 * Hook for fetching teachers with optional filters
 * @param {Object} filters - { role: 'teacher', is_active, is_approved, search }
 */
export function useTeachers(filters = {}) {
  const teacherFilters = { ...filters, role: 'teacher' }
  
  return useQuery({
    queryKey: queryKeys.users.teachers(teacherFilters),
    queryFn: async () => {
      const { data } = await userApi.getAll(teacherFilters)
      return Array.isArray(data) ? data : (data?.results ?? [])
    },
    staleTime: staleTime.teachers,
  })
}

/**
 * Hook for fetching a single teacher by ID
 */
export function useTeacher(id) {
  return useQuery({
    queryKey: queryKeys.users.detail(id),
    queryFn: async () => {
      const { data } = await userApi.getById(id)
      return data
    },
    enabled: !!id,
    staleTime: staleTime.teachers,
  })
}

/**
 * Hook for creating a new teacher
 */
export function useCreateTeacher() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (userData) => {
      const { data } = await userApi.create({ ...userData, role: 'teacher' })
      return data
    },
    onSuccess: () => {
      // Invalidate teachers list to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.users.teachers() })
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() })
    },
  })
}

/**
 * Hook for updating a teacher
 */
export function useUpdateTeacher() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...userData }) => {
      const { data } = await userApi.update(id, userData)
      return data
    },
    onSuccess: (data, variables) => {
      // Invalidate specific teacher and teachers list
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.users.teachers() })
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() })
    },
  })
}

/**
 * Hook for deleting a teacher
 */
export function useDeleteTeacher() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id) => {
      await userApi.delete(id)
      return id
    },
    onSuccess: (id) => {
      // Invalidate specific teacher and teachers list
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.users.teachers() })
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() })
    },
  })
}

/**
 * Hook for activating/deactivating a teacher
 */
export function useToggleTeacherActive() {
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
      // Invalidate specific teacher and teachers list
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(result.id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.users.teachers() })
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() })
    },
  })
}

/**
 * Hook for resetting teacher password
 */
export function useResetTeacherPassword() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id) => {
      const { data } = await userApi.resetPassword(id)
      return data
    },
    onSuccess: (data, id) => {
      // Invalidate specific teacher
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(id) })
    },
  })
}
