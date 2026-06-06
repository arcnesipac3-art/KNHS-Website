import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { userApi } from '../lib/userApi'
import { queryKeys, staleTime } from '../lib/queryClient'

/**
 * Hook for fetching users with optional filters
 * @param {Object} filters - { role, is_active, is_approved, search, grade_level, strand }
 */
export function useUsers(filters = {}) {
  return useQuery({
    queryKey: queryKeys.users.list(filters),
    queryFn: async () => {
      const { data } = await userApi.getAll(filters)
      return Array.isArray(data) ? data : (data?.results ?? [])
    },
    staleTime: filters.role === 'student' ? staleTime.students : 
               filters.role === 'teacher' ? staleTime.teachers : 
               5 * 60 * 1000, // Default 5 minutes for other roles
  })
}

/**
 * Hook for fetching a single user by ID
 */
export function useUser(id) {
  return useQuery({
    queryKey: queryKeys.users.detail(id),
    queryFn: async () => {
      const { data } = await userApi.getById(id)
      return data
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Hook for creating a new user
 */
export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (userData) => {
      const { data } = await userApi.create(userData)
      return data
    },
    onSuccess: () => {
      // Invalidate users list to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() })
      queryClient.invalidateQueries({ queryKey: queryKeys.users.students() })
      queryClient.invalidateQueries({ queryKey: queryKeys.users.teachers() })
    },
  })
}

/**
 * Hook for updating a user
 */
export function useUpdateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...userData }) => {
      const { data } = await userApi.update(id, userData)
      return data
    },
    onSuccess: (data, variables) => {
      // Invalidate specific user and users list
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() })
      queryClient.invalidateQueries({ queryKey: queryKeys.users.students() })
      queryClient.invalidateQueries({ queryKey: queryKeys.users.teachers() })
    },
  })
}

/**
 * Hook for deleting a user
 */
export function useDeleteUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id) => {
      await userApi.delete(id)
      return id
    },
    onSuccess: (id) => {
      // Invalidate specific user and users list
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() })
      queryClient.invalidateQueries({ queryKey: queryKeys.users.students() })
      queryClient.invalidateQueries({ queryKey: queryKeys.users.teachers() })
    },
  })
}

/**
 * Hook for activating/deactivating a user
 */
export function useToggleUserActive() {
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
      // Invalidate specific user and users list
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(result.id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() })
      queryClient.invalidateQueries({ queryKey: queryKeys.users.students() })
      queryClient.invalidateQueries({ queryKey: queryKeys.users.teachers() })
    },
  })
}

/**
 * Hook for resetting user password
 */
export function useResetUserPassword() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id) => {
      const { data } = await userApi.resetPassword(id)
      return data
    },
    onSuccess: (data, id) => {
      // Invalidate specific user
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(id) })
    },
  })
}
