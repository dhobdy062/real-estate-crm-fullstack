const express = require('express');
const {
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  convertLead,
  deleteLead,
  getLeadSources,
  getPipelineStatuses,
} = require('../controllers/lead.controller');
const { protect } = require('../middleware/auth');
const { validate, schemas } = require('../utils/validation');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get lead sources
router.get('/sources', getLeadSources);

// Get pipeline statuses
router.get('/pipeline-statuses', getPipelineStatuses);

// Get all leads
router.get('/', validate(schemas.pagination, 'query'), getLeads);

// Get lead by ID
router.get('/:id', getLeadById);

// Create a new lead
router.post('/', validate(schemas.leadCreate), createLead);

// Update lead
router.put('/:id', validate(schemas.leadUpdate), updateLead);

// Convert lead to contact
router.post('/:id/convert', validate(schemas.leadConvert), convertLead);

// Delete lead
router.delete('/:id', deleteLead);

module.exports = router;
