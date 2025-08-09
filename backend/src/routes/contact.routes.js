const express = require('express');
const {
  getContacts,
  getContactById,
  createContact,
  updateContact,
  deleteContact,
} = require('../controllers/contact.controller');
const { protect } = require('../middleware/auth');
const { validate, schemas } = require('../utils/validation');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get all contacts
router.get('/', validate(schemas.pagination, 'query'), getContacts);

// Get contact by ID
router.get('/:id', getContactById);

// Create a new contact
router.post('/', validate(schemas.contactCreate), createContact);

// Update contact
router.put('/:id', validate(schemas.contactUpdate), updateContact);

// Delete contact
router.delete('/:id', deleteContact);

module.exports = router;
