const express = require('express');
const yup = require('yup');
const {
  globalSearch,
  searchEntity,
  getSearchSuggestions,
} = require('../controllers/search.controller');
const { protect } = require('../middleware/auth');
const { validate } = require('../utils/validation');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get search suggestions as user types
router.get('/suggestions', validate(yup.object({
  query: yup.string().required('Search query is required').min(2, 'Search query must be at least 2 characters'),
  limit: yup.number().integer().min(1).max(50),
}), 'query'), getSearchSuggestions);

// Search a specific entity type
router.get('/:entity', validate(yup.object({
  query: yup.string().required('Search query is required').min(2, 'Search query must be at least 2 characters'),
  page: yup.number().integer().min(1),
  limit: yup.number().integer().min(1).max(100),
}), 'query'), searchEntity);

// Global search across multiple entities
router.get('/', validate(yup.object({
  query: yup.string().required('Search query is required').min(2, 'Search query must be at least 2 characters'),
  entities: yup.string(),
  page: yup.number().integer().min(1),
  limit: yup.number().integer().min(1).max(100),
}), 'query'), globalSearch);

module.exports = router;
