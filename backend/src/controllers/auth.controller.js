const bcrypt = require('bcrypt');
const db = require('../db/connection');
const { generateToken } = require('../utils/jwt');
const { ApiError } = require('../middleware/errorHandler');

/**
 * Register a new user
 * @route POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { first_name, last_name, email, phone_number, password, role_id, license_number } = req.body;
    
    // Check if user already exists
    const existingUser = await db('users').where({ email }).first();
    if (existingUser) {
      return next(new ApiError(400, 'User with this email already exists'));
    }
    
    // Check if role exists
    const role = await db('roles').where({ id: role_id }).first();
    if (!role) {
      return next(new ApiError(400, 'Invalid role ID'));
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Create user
    const [userId] = await db('users').insert({
      first_name,
      last_name,
      email,
      phone_number,
      password_hash: passwordHash,
      role_id,
      license_number,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    }).returning('id');
    
    // Get created user
    const user = await db('users').where({ id: userId }).first();
    
    // Generate token
    const token = generateToken(user);
    
    // Remove sensitive data
    delete user.password_hash;
    
    res.status(201).json({
      status: 'success',
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 * @route POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    // Check if user exists
    const user = await db('users').where({ email }).first();
    if (!user) {
      return next(new ApiError(401, 'Invalid credentials'));
    }
    
    // Check if user is active
    if (!user.is_active) {
      return next(new ApiError(401, 'Your account has been deactivated'));
    }
    
    // Check if password is correct
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return next(new ApiError(401, 'Invalid credentials'));
    }
    
    // Generate token
    const token = generateToken(user);
    
    // Remove sensitive data
    delete user.password_hash;
    
    res.status(200).json({
      status: 'success',
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user profile
 * @route GET /api/auth/me
 */
const getMe = async (req, res, next) => {
  try {
    // Get user with role
    const user = await db('users')
      .join('roles', 'users.role_id', '=', 'roles.id')
      .select(
        'users.id',
        'users.first_name',
        'users.last_name',
        'users.email',
        'users.phone_number',
        'users.role_id',
        'roles.role_name',
        'users.is_active',
        'users.license_number',
        'users.created_at',
        'users.updated_at'
      )
      .where('users.id', req.user.id)
      .first();
    
    if (!user) {
      return next(new ApiError(404, 'User not found'));
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Change password
 * @route POST /api/auth/change-password
 */
const changePassword = async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;
    
    // Get user
    const user = await db('users').where({ id: req.user.id }).first();
    
    // Check if current password is correct
    const isPasswordValid = await bcrypt.compare(current_password, user.password_hash);
    if (!isPasswordValid) {
      return next(new ApiError(401, 'Current password is incorrect'));
    }
    
    // Hash new password
    const passwordHash = await bcrypt.hash(new_password, 10);
    
    // Update password
    await db('users')
      .where({ id: req.user.id })
      .update({
        password_hash: passwordHash,
        updated_at: new Date(),
      });
    
    res.status(200).json({
      status: 'success',
      message: 'Password changed successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  changePassword,
};
