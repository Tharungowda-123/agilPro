import axiosInstance from './axiosConfig'

export const searchService = {
  advancedSearch: async (payload) => {
    const response = await axiosInstance.post('/search', payload)
    return response.data
  },
  getSuggestions: async (query) => {
    const response = await axiosInstance.get('/search/suggestions', { params: { query } })
    return response.data
  },
  getSavedFilters: async () => {
    const response = await axiosInstance.get('/search/saved')
    return response.data
  },
  saveFilter: async (payload) => {
    const response = await axiosInstance.post('/search/saved', payload)
    return response.data
  },
  updateFilter: async (id, payload) => {
    const response = await axiosInstance.put(`/search/saved/${id}`, payload)
    return response.data
  },
  deleteFilter: async (id) => {
    const response = await axiosInstance.delete(`/search/saved/${id}`)
    return response.data
  },
  getRecentSearches: async () => {
    const response = await axiosInstance.get('/search/recent')
    return response.data
  },
}

export default searchService

