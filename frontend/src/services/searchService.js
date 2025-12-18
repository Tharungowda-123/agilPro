import { searchService as apiSearchService } from './api'

/**
 * Search Service
 * Handles global search across all entities
 */
class SearchService {
  constructor() {
    this.recentSearches = this.loadRecentSearches()
  }

  loadRecentSearches() {
    try {
      const stored = localStorage.getItem('recentSearches')
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  saveRecentSearches() {
    try {
      localStorage.setItem('recentSearches', JSON.stringify(this.recentSearches))
    } catch {
      // Ignore localStorage errors
    }
  }

  addRecentSearch(query) {
    if (!query.trim()) return

    // Remove if already exists
    this.recentSearches = this.recentSearches.filter((q) => q !== query)
    // Add to beginning
    this.recentSearches.unshift(query)
    // Keep only last 10
    this.recentSearches = this.recentSearches.slice(0, 10)
    this.saveRecentSearches()
  }

  getRecentSearches() {
    return this.recentSearches
  }

  clearRecentSearches() {
    this.recentSearches = []
    this.saveRecentSearches()
  }

  highlightMatch(text, query) {
    if (!query.trim()) return text

    const regex = new RegExp(`(${query})`, 'gi')
    const parts = text.split(regex)

    // Return array of objects with type and content for rendering
    // Components using this should render the highlighted parts
    return parts.map((part, index) => {
      const isMatch = regex.test(part)
      return {
        key: index,
        text: part,
        highlighted: isMatch,
      }
    })
  }

  async searchAdvanced(payload) {
    this.addRecentSearch(payload?.query || '')
    const response = await apiSearchService.advancedSearch(payload)
    return response?.data || response
  }

  async fetchSavedFilters() {
    const response = await apiSearchService.getSavedFilters()
    return response?.data || response
  }

  async saveFilter(payload) {
    const response = await apiSearchService.saveFilter(payload)
    return response?.data || response
  }

  async updateFilter(id, payload) {
    const response = await apiSearchService.updateFilter(id, payload)
    return response?.data || response
  }

  async deleteFilter(id) {
    return apiSearchService.deleteFilter(id)
  }

  async fetchServerRecentSearches() {
    const response = await apiSearchService.getRecentSearches()
    return response?.data || response
  }

  async fetchSuggestions(query) {
    const response = await apiSearchService.getSuggestions(query)
    return response?.data || response
  }
}

export const searchService = new SearchService()
export default searchService

