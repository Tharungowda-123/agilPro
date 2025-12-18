import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { userService } from '@/services/api'

/**
 * React Query hooks for users
 */
export const useUsers = (params = {}) => {
  const normalizedParams = {
    ...params,
    page: params?.page ?? 1,
    limit: params?.limit ?? 50,
  }

  return useQuery({
    queryKey: ['users', normalizedParams],
    queryFn: async () => {
      const response = await userService.getUsers(normalizedParams)

      if (!response) {
        return { data: [], pagination: null, message: null }
      }

      const dataArray = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response)
        ? response
        : Array.isArray(response?.data?.data)
        ? response.data.data
        : []

      return {
        data: dataArray,
        pagination: response?.pagination || null,
        message: response?.message || null,
        status: response?.status || null,
      }
    },
    staleTime: 5 * 60 * 1000,
    keepPreviousData: true,
  })
}

export const useUser = (id) => {
  return useQuery({
    queryKey: ['user', id],
    queryFn: async () => {
      const response = await userService.getUser(id)
      return response?.data?.user || response?.data || response
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })
}

export const useUpdateUser = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }) => userService.updateUser(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['user', variables.id] })
      toast.success('User updated successfully!')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update user')
    },
  })
}

export const useUserPerformance = (id) => {
  return useQuery({
    queryKey: ['user', id, 'performance'],
    queryFn: async () => {
      const response = await userService.getUserPerformance(id)
      return response?.data?.performance || response?.data || response
    },
    enabled: !!id,
    staleTime: 1 * 60 * 1000,
  })
}

// ============================================
// ADMIN-ONLY USER MANAGEMENT HOOKS
// ============================================

export const useCreateUser = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data) => userService.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('User created successfully!')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create user')
    },
  })
}

export const useAdminUpdateUser = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }) => userService.adminUpdateUser(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['user', variables.id] })
      toast.success('User updated successfully!')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update user')
    },
  })
}

export const useResetUserPassword = () => {
  return useMutation({
    mutationFn: ({ id, newPassword }) => userService.resetUserPassword(id, newPassword),
    onSuccess: () => {
      toast.success('Password reset successfully!')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to reset password')
    },
  })
}

export const useDeactivateUser = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id) => userService.deactivateUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('User deactivated successfully!')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to deactivate user')
    },
  })
}

export const useActivateUser = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id) => userService.activateUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('User activated successfully!')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to activate user')
    },
  })
}

export const useAssignUserToTeam = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, teamId }) => userService.assignUserToTeam(id, teamId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['user', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['teams'] })
      toast.success('User team assignment updated successfully!')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to assign user to team')
    },
  })
}

export const useBulkUserAction = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userIds, action }) => userService.bulkUserAction(userIds, action),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success(data?.message || 'Bulk action completed successfully!')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to perform bulk action')
    },
  })
}

export const useBulkImportPreview = () => {
  return useMutation({
    mutationFn: (file) => {
      const formData = new FormData()
      formData.append('file', file)
      return userService.previewBulkImport(formData)
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to preview import')
    },
  })
}

export const useBulkImportConfirm = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ users }) => userService.confirmBulkImport({ users }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('Users imported successfully!')
      return data
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to import users')
    },
  })
}

export const useUserActivity = (id, params = {}) => {
  return useQuery({
    queryKey: ['user', id, 'activity', params],
    queryFn: async () => {
      const response = await userService.getUserActivity(id, params)
      return response?.data?.data || response?.data || response
    },
    enabled: !!id,
    staleTime: 1 * 60 * 1000,
  })
}

export const useAddCapacityAdjustment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }) => userService.addCapacityAdjustment(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['team'] })
      toast.success('Capacity adjustment added successfully!')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to add capacity adjustment')
    },
  })
}

export const useRemoveCapacityAdjustment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, adjustmentId }) => userService.removeCapacityAdjustment(id, adjustmentId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['team'] })
      toast.success('Capacity adjustment removed successfully!')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to remove capacity adjustment')
    },
  })
}

// ============================================
// WORKLOAD VISUALIZATION HOOKS
// ============================================

/**
 * Get detailed developer workload
 */
export const useDeveloperWorkload = (id, params = {}) => {
  return useQuery({
    queryKey: ['user', id, 'workload', 'detailed', params],
    queryFn: async () => {
      const response = await userService.getDeveloperWorkload(id, params)
      return response?.data?.workload || response?.data || response
    },
    enabled: !!id,
    staleTime: 1 * 60 * 1000,
  })
}

/**
 * Get historical workload
 */
export const useHistoricalWorkload = (id, params = {}) => {
  return useQuery({
    queryKey: ['user', id, 'workload', 'history', params],
    queryFn: async () => {
      const response = await userService.getHistoricalWorkload(id, params)
      return response?.data?.history || response?.data || response || []
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Get suggested tasks
 */
export const useSuggestedTasks = (id, params = {}) => {
  return useQuery({
    queryKey: ['user', id, 'workload', 'suggestions', params],
    queryFn: async () => {
      const response = await userService.getSuggestedTasks(id, params)
      return response?.data?.suggestions || response?.data || response || []
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  })
}

