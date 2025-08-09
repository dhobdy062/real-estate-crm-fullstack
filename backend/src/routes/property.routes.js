const express = require('express');
const {
  getProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
} = require('../controllers/property.controller');
const { protect } = require('../middleware/auth');
const { validate, schemas } = require('../utils/validation');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get all properties
router.get('/', validate(schemas.pagination, 'query'), getProperties);

// Get property by ID
router.get('/:id', getPropertyById);

// Create a new property
router.post('/', validate(schemas.propertyCreate), createProperty);

// Update property
router.put('/:id', validate(schemas.propertyUpdate), updateProperty);

// Delete property
router.delete('/:id', deleteProperty);

module.exports = router;
