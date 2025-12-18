import axiosInstance from './axiosConfig'

export const sprintTemplateService = {
  getTemplates: async (params = {}) => {
    const response = await axiosInstance.get('/sprint-templates', { params })
    return response.data
  },
  createTemplate: async (data) => {
    const response = await axiosInstance.post('/sprint-templates', data)
    return response.data
  },
  updateTemplate: async (id, data) => {
    const response = await axiosInstance.put(`/sprint-templates/${id}`, data)
    return response.data
  },
  deleteTemplate: async (id) => {
    const response = await axiosInstance.delete(`/sprint-templates/${id}`)
    return response.data
  },
  setDefaultTemplate: async (projectId, templateId) => {
    const response = await axiosInstance.patch(
      `/sprint-templates/projects/${projectId}/default`,
      { templateId }
    )
    return response.data
  },
}

export default sprintTemplateService

