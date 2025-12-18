import axiosInstance from './axiosConfig'

export const meetingService = {
  getSprintMeetings: async (sprintId, params = {}) => {
    const response = await axiosInstance.get(`/sprints/${sprintId}/meetings`, { params })
    return response.data
  },
  createMeeting: async (sprintId, data) => {
    const response = await axiosInstance.post(`/sprints/${sprintId}/meetings`, data)
    return response.data
  },
  updateMeeting: async (meetingId, data) => {
    const response = await axiosInstance.put(`/meetings/${meetingId}`, data)
    return response.data
  },
  deleteMeeting: async (meetingId) => {
    const response = await axiosInstance.delete(`/meetings/${meetingId}`)
    return response.data
  },
  addAgendaItem: async (meetingId, data) => {
    const response = await axiosInstance.post(`/meetings/${meetingId}/agenda`, data)
    return response.data
  },
  addMeetingNote: async (meetingId, data) => {
    const response = await axiosInstance.post(`/meetings/${meetingId}/notes`, data)
    return response.data
  },
  resendInvites: async (meetingId) => {
    const response = await axiosInstance.post(`/meetings/${meetingId}/resend-invites`)
    return response.data
  },
}

export default meetingService

