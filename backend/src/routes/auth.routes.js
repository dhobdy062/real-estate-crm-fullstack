const express = require('express');
const yup = require('yup');
const { register, login, getMe, changePassword } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');
const { validate, schemas } = require('../utils/validation');

const router = express.Router();

// Public routes
router.post('/register', validate(schemas.userCreate), register);
router.post('/login', validate(schemas.login), login);

// Protected routes
router.get('/me', protect, getMe);
router.post('/change-password', protect, validate(yup.object({
  current_password: yup.string().required('Current password is required'),
  new_password: yup.string().required('New password is required').min(8, 'Password must be at least 8 characters'),
})), changePassword);

module.exports = router;
