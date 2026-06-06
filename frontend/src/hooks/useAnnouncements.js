import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { announcementApi } from '../lib/learningApi'
import { queryKeys, staleTime } from '../lib/queryClient'

/**
 * Hook for fetching announcements with optional filters
 * @param {Object} filters - { exclude_expired, limit, audience_type, audience_ref }
 */
export function useAnnouncements(filters = {}) {
  return useQuery({
    queryKey: queryKeys.announcements.all(filters),
    queryFn: async () => {
      const { data } = await announcementApi.getAll(filters)
      return Array.isArray(data) ? data : (data?.results ?? [])
    },
    staleTime: staleTime.announcements,
  })
}

/**
 * Hook for fetching a single announcement by ID
 */
export function useAnnouncement(id) {
  return useQuery({
    queryKey: queryKeys.announcements.detail(id),
    queryFn: async () => {
      const { data } = await announcementApi.getById(id)
      return data
    },
    enabled: !!id,
    staleTime: staleTime.announcements,
  })
}

/**
 * Hook for fetching unread announcements
 */
export function useUnreadAnnouncements() {
  return useQuery({
    queryKey: queryKeys.announcements.unread(),
    queryFn: async () => {
      const { data } = await announcementApi.getUnread()
      return Array.isArray(data) ? data : (data?.results ?? [])
    },
    staleTime: staleTime.announcements,
  })
}

/**
 * Hook for creating a new announcement
 */
export function useCreateAnnouncement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (announcementData) => {
      const { data } = await announcementApi.create(announcementData)
      return data
    },
    onSuccess: () => {
      // Invalidate all announcement queries
      queryClient.invalidateQueries({ queryKey: queryKeys.announcements.all() })
      queryClient.invalidateQueries({ queryKey: queryKeys.announcements.unread() })
    },
  })
}

/**
 * Hook for updating an announcement
 */
export function useUpdateAnnouncement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...announcementData }) => {
      const { data } = await announcementApi.update(id, announcementData)
      return data
    },
    onSuccess: (data, variables) => {
      // Invalidate specific announcement and all announcements
      queryClient.invalidateQueries({ queryKey: queryKeys.announcements.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.announcements.all() })
    },
  })
}

/**
 * Hook for deleting an announcement
 */
export function useDeleteAnnouncement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id) => {
      await announcementApi.delete(id)
      return id
    },
    onSuccess: (id) => {
      // Invalidate specific announcement and all announcements
      queryClient.invalidateQueries({ queryKey: queryKeys.announcements.detail(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.announcements.all() })
      queryClient.invalidateQueries({ queryKey: queryKeys.announcements.unread() })
    },
  })
}

/**
 * Hook for liking an announcement
 */
export function useLikeAnnouncement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id) => {
      await announcementApi.like(id)
      return id
    },
    onSuccess: (id) => {
      // Invalidate specific announcement to update like count
      queryClient.invalidateQueries({ queryKey: queryKeys.announcements.detail(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.announcements.all() })
    },
  })
}

/**
 * Hook for unliking an announcement
 */
export function useUnlikeAnnouncement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id) => {
      await announcementApi.unlike(id)
      return id
    },
    onSuccess: (id) => {
      // Invalidate specific announcement to update like count
      queryClient.invalidateQueries({ queryKey: queryKeys.announcements.detail(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.announcements.all() })
    },
  })
}

/**
 * Hook for commenting on an announcement
 */
export function useCommentAnnouncement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, content }) => {
      const { data } = await announcementApi.comment(id, content)
      return data
    },
    onSuccess: (data, variables) => {
      // Invalidate specific announcement to update comments
      queryClient.invalidateQueries({ queryKey: queryKeys.announcements.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.announcements.all() })
    },
  })
}

/**
 * Hook for marking an announcement as read
 */
export function useMarkAnnouncementRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id) => {
      await announcementApi.markRead(id)
      return id
    },
    onSuccess: (id) => {
      // Invalidate specific announcement and unread announcements
      queryClient.invalidateQueries({ queryKey: queryKeys.announcements.detail(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.announcements.unread() })
      queryClient.invalidateQueries({ queryKey: queryKeys.announcements.all() })
    },
  })
}
