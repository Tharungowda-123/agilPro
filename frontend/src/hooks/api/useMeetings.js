import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { meetingService } from '@/services/api'

export const useSprintMeetings = (sprintId) => {
  return useQuery({
    queryKey: ['meetings', sprintId],
    queryFn: async () => {
      const response = await meetingService.getSprintMeetings(sprintId)
      return response?.data?.meetings || response?.meetings || response || []
    },
    enabled: !!sprintId,
    staleTime: 60 * 1000,
  })
}

export const useCreateMeeting = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ sprintId, data }) => meetingService.createMeeting(sprintId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['meetings', variables.sprintId] })
      toast.success('Meeting scheduled')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to schedule meeting')
    },
  })
}

export const useUpdateMeeting = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ meetingId, data, sprintId }) => meetingService.updateMeeting(meetingId, data),
    onSuccess: (_, variables) => {
      if (variables.sprintId) {
        queryClient.invalidateQueries({ queryKey: ['meetings', variables.sprintId] })
      }
      toast.success('Meeting updated')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update meeting')
    },
  })
}

export const useDeleteMeeting = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ meetingId }) => meetingService.deleteMeeting(meetingId),
    onSuccess: (_, variables) => {
      if (variables.sprintId) {
        queryClient.invalidateQueries({ queryKey: ['meetings', variables.sprintId] })
      }
      toast.success('Meeting cancelled')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to cancel meeting')
    },
  })
}

export const useAddMeetingNote = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ meetingId, data }) => meetingService.addMeetingNote(meetingId, data),
    onSuccess: (_, variables) => {
      if (variables.sprintId) {
        queryClient.invalidateQueries({ queryKey: ['meetings', variables.sprintId] })
      }
      toast.success('Note added')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to add note')
    },
  })
}

export const useAddAgendaItem = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ meetingId, data }) => meetingService.addAgendaItem(meetingId, data),
    onSuccess: (_, variables) => {
      if (variables.sprintId) {
        queryClient.invalidateQueries({ queryKey: ['meetings', variables.sprintId] })
      }
      toast.success('Agenda updated')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update agenda')
    },
  })
}

export const useResendMeetingInvites = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ meetingId }) => meetingService.resendInvites(meetingId),
    onSuccess: (_, variables) => {
      if (variables.sprintId) {
        queryClient.invalidateQueries({ queryKey: ['meetings', variables.sprintId] })
      }
      toast.success('Invites resent')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to resend invites')
    },
  })
}

