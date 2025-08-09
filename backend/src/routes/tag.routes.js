const express = require('express');
const yup = require('yup');
const {
  getTags,
  getTagById,
  createTag,
  updateTag,
  deleteTag,
} = require('../controllers/tag.controller');
const { protect, authorize } = require('../middleware/auth');
const { validate } = require('../utils/validation');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get all tags
router.get('/', getTags);

// Get tag by ID
router.get('/:id', getTagById);

// Routes that require admin or manager role
router.use(authorize('Admin', 'Manager'));

// Create a new tag
router.post('/', validate(yup.object({
  tag_name: yup.string().required('Tag name is required').max(50),
  tag_color: yup.string().matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid color format').max(7),
})), createTag);

// Update tag
router.put('/:id', validate(yup.object({
  tag_name: yup.string().max(50),
  tag_color: yup.string().matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid color format').max(7),
})), updateTag);

// Delete tag
router.delete('/:id', deleteTag);

module.exports = router;
