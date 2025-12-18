import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import axiosInstance from '@/services/api/axiosConfig'

const mapUser = (user) => {
  if (!user) return null
  if (typeof user === 'string') {
    return { id: user }
  }
  return {
    id: user._id || user.id || user,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    role: user.role,
  }
}

const mapComment = (comment) => {
  if (!comment) return null
  return {
    id: comment.id || comment._id,
    content: comment.content || comment.text,
    createdAt: comment.createdAt || comment.timestamp,
    updatedAt: comment.updatedAt,
    isEdited: comment.isEdited || comment.edited || false,
    user: mapUser(comment.user),
    mentions: (comment.mentions || []).map(mapUser),
    parentComment: comment.parentComment,
    threadId: comment.threadId || comment.id || comment._id,
    reactions: comment.reactions || [],
    editHistory: comment.editHistory || [],
    resolved: comment.resolved || false,
    pinned: comment.pinned || false,
    resolvedBy: mapUser(comment.resolvedBy),
    pinnedBy: mapUser(comment.pinnedBy),
  }
}

/**
 * React Query hooks for comments
 */
export const useComments = (entityType, entityId) => {
  return useQuery({
    queryKey: ['comments', entityType, entityId],
    queryFn: async () => {
      const endpoint = entityType === 'story' 
        ? `/comments/stories/${entityId}/comments`
        : `/comments/tasks/${entityId}/comments`
      const response = await axiosInstance.get(endpoint)
      const threads = response.data.data?.threads || response.data.threads || []
      return threads.map((thread) => ({
        threadId: thread.threadId,
        root: mapComment(thread.root),
        replies: (thread.replies || []).map(mapComment),
        resolved: thread.resolved || false,
        pinned: thread.pinned || false,
        resolvedBy: mapUser(thread.resolvedBy),
        pinnedBy: mapUser(thread.pinnedBy),
      }))
    },
    enabled: !!entityType && !!entityId,
    staleTime: 1 * 60 * 1000, // 1 minute
  })
}

export const useCreateComment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ entityType, entityId, content, parentCommentId }) => {
      const endpoint = entityType === 'story'
        ? `/comments/stories/${entityId}/comments`
        : `/comments/tasks/${entityId}/comments`
      return axiosInstance.post(endpoint, { content, parentCommentId })
    },
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['comments', variables.entityType, variables.entityId] 
      })
      toast.success('Comment added successfully!')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to add comment')
    },
  })
}

export const useUpdateComment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, content, entityType, entityId }) => {
      return axiosInstance.put(`/comments/${id}`, { content })
    },
    onSuccess: (response, variables) => {
      if (variables.entityType && variables.entityId) {
        queryClient.invalidateQueries({
          queryKey: ['comments', variables.entityType, variables.entityId],
        })
      } else {
        queryClient.invalidateQueries({ queryKey: ['comments'] })
      }
      toast.success('Comment updated successfully!')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update comment')
    },
  })
}

export const useDeleteComment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, entityType, entityId }) => {
      return axiosInstance.delete(`/comments/${id}`)
    },
    onSuccess: (_, variables) => {
      if (variables?.entityType && variables?.entityId) {
        queryClient.invalidateQueries({ queryKey: ['comments', variables.entityType, variables.entityId] })
      } else {
        queryClient.invalidateQueries({ queryKey: ['comments'] })
      }
      toast.success('Comment deleted successfully!')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete comment')
    },
  })
}

export const useAddReaction = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ commentId, emoji, entityType, entityId }) =>
      axiosInstance.post(`/comments/${commentId}/reactions`, { emoji }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', variables.entityType, variables.entityId] })
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to add reaction')
    },
  })
}

export const useRemoveReaction = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ commentId, emoji, entityType, entityId }) =>
      axiosInstance.delete(`/comments/${commentId}/reactions`, { data: { emoji } }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', variables.entityType, variables.entityId] })
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to remove reaction')
    },
  })
}

export const useResolveCommentThread = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ commentId, resolved, entityType, entityId }) =>
      axiosInstance.patch(`/comments/${commentId}/resolve`, { resolved }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', variables.entityType, variables.entityId] })
      toast.success(variables.resolved ? 'Thread resolved' : 'Thread reopened')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update thread status')
    },
  })
}

export const usePinComment = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ commentId, pinned, entityType, entityId }) =>
      axiosInstance.patch(`/comments/${commentId}/pin`, { pinned }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', variables.entityType, variables.entityId] })
      toast.success(variables.pinned ? 'Comment pinned' : 'Comment unpinned')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update pin status')
    },
  })
}

export const useCommentHistory = (commentId, enabled = false) => {
  return useQuery({
    queryKey: ['comment-history', commentId],
    queryFn: async () => {
      const response = await axiosInstance.get(`/comments/${commentId}/history`)
      return response.data.data?.editHistory || []
    },
    enabled: Boolean(commentId) && enabled,
    staleTime: 5 * 60 * 1000,
  })
}

