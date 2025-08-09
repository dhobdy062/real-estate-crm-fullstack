const express = require('express');
const yup = require('yup');
const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  resetPassword,
  deleteUser,
  getRoles,
} = require('../controllers/user.controller');
const { protect, authorize } = require('../middleware/auth');
const { validate, schemas } = require('../utils/validation');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get all roles
router.get('/roles', getRoles);

// Routes that require admin role
router.use(authorize('Admin'));

// Get all users
router.get('/', validate(schemas.pagination, 'query'), getUsers);

// Get user by ID
router.get('/:id', getUserById);

// Create a new user
router.post('/', validate(schemas.userCreate), createUser);

// Update user
router.put('/:id', validate(schemas.userUpdate), updateUser);

// Reset user password
router.post('/:id/reset-password', validate(yup.object({
  new_password: yup.string().required('New password is required').min(8, 'Password must be at least 8 characters'),
})), resetPassword);

// Delete user
router.delete('/:id', deleteUser);

module.exports = router;
