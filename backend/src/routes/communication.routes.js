const express = require('express');
const yup = require('yup');
const {
  getCommunications,
  getCommunicationById,
  createCommunication,
  updateCommunication,
  deleteCommunication,
  getTemplates,
  createTemplate,
} = require('../controllers/communication.controller');
const { protect } = require('../middleware/auth');
const { validate, schemas } = require('../utils/validation');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get communication templates
router.get('/templates', getTemplates);

// Create a new template
router.post('/templates', validate(yup.object({
  template_name: yup.string().required('Template name is required').max(150),
  template_type: yup.string().required('Template type is required').max(20),
  subject: yup.string().max(255),
  body_content: yup.string().required('Body content is required'),
})), createTemplate);

// Get all communications
router.get('/', validate(schemas.pagination, 'query'), getCommunications);

// Get communication by ID
router.get('/:id', getCommunicationById);

// Create a new communication
router.post('/', validate(schemas.communicationCreate), createCommunication);

// Update communication
router.put('/:id', validate(schemas.communicationUpdate), updateCommunication);

// Delete communication
router.delete('/:id', deleteCommunication);

module.exports = router;
