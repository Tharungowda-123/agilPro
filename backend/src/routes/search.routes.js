import express from 'express'
import {
  advancedSearch,
  saveFilter,
  getSavedFilters,
  updateSavedFilter,
  deleteSavedFilter,
  getRecentSearches,
  getSearchSuggestions,
} from '../controllers/search.controller.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

router.use(authenticateToken)

router.post('/', advancedSearch)
router.get('/saved', getSavedFilters)
router.post('/saved', saveFilter)
router.put('/saved/:id', updateSavedFilter)
router.delete('/saved/:id', deleteSavedFilter)
router.get('/recent', getRecentSearches)
router.get('/suggestions', getSearchSuggestions)

export default router

