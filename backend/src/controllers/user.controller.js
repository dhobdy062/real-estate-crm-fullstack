const bcrypt = require('bcrypt');
const db = require('../db/connection');
const { ApiError } = require('../middleware/errorHandler');

/**
 * Get all users
 * @route GET /api/users
 */
const getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, sort_by = 'id', sort_dir = 'asc' } = req.query;
    
    // Build query
    let query = db('users')
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
      );
    
    // Apply search filter
    if (search) {
      query = query.where((builder) => {
        builder.whereRaw('LOWER(users.first_name) LIKE ?', [`%${search.toLowerCase()}%`])
          .orWhereRaw('LOWER(users.last_name) LIKE ?', [`%${search.toLowerCase()}%`])
          .orWhereRaw('LOWER(users.email) LIKE ?', [`%${search.toLowerCase()}%`]);
      });
    }
    
    // Get total count
    const countQuery = query.clone();
    const [{ count }] = await countQuery.count('users.id as count');
    
    // Apply pagination and sorting
    query = query
      .orderBy(`users.${sort_by}`, sort_dir)
      .limit(limit)
      .offset((page - 1) * limit);
    
    // Execute query
    const users = await query;
    
    res.status(200).json({
      status: 'success',
      data: {
        users,
        pagination: {
          total: parseInt(count),
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user by ID
 * @route GET /api/users/:id
 */
const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
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
      .where('users.id', id)
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
 * Create a new user
 * @route POST /api/users
 */
const createUser = async (req, res, next) => {
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
      .where('users.id', userId)
      .first();
    
    res.status(201).json({
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
 * Update user
 * @route PUT /api/users/:id
 */
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { first_name, last_name, email, phone_number, role_id, is_active, license_number } = req.body;
    
    // Check if user exists
    const user = await db('users').where({ id }).first();
    if (!user) {
      return next(new ApiError(404, 'User not found'));
    }
    
    // Check if email is already taken by another user
    if (email && email !== user.email) {
      const existingUser = await db('users').where({ email }).first();
      if (existingUser) {
        return next(new ApiError(400, 'Email is already taken'));
      }
    }
    
    // Check if role exists
    if (role_id) {
      const role = await db('roles').where({ id: role_id }).first();
      if (!role) {
        return next(new ApiError(400, 'Invalid role ID'));
      }
    }
    
    // Update user
    await db('users')
      .where({ id })
      .update({
        ...(first_name && { first_name }),
        ...(last_name && { last_name }),
        ...(email && { email }),
        ...(phone_number !== undefined && { phone_number }),
        ...(role_id && { role_id }),
        ...(is_active !== undefined && { is_active }),
        ...(license_number !== undefined && { license_number }),
        updated_at: new Date(),
      });
    
    // Get updated user
    const updatedUser = await db('users')
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
      .where('users.id', id)
      .first();
    
    res.status(200).json({
      status: 'success',
      data: {
        user: updatedUser,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reset user password
 * @route POST /api/users/:id/reset-password
 */
const resetPassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { new_password } = req.body;
    
    // Check if user exists
    const user = await db('users').where({ id }).first();
    if (!user) {
      return next(new ApiError(404, 'User not found'));
    }
    
    // Hash new password
    const passwordHash = await bcrypt.hash(new_password, 10);
    
    // Update password
    await db('users')
      .where({ id })
      .update({
        password_hash: passwordHash,
        updated_at: new Date(),
      });
    
    res.status(200).json({
      status: 'success',
      message: 'Password reset successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete user
 * @route DELETE /api/users/:id
 */
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if user exists
    const user = await db('users').where({ id }).first();
    if (!user) {
      return next(new ApiError(404, 'User not found'));
    }
    
    // Check if user is trying to delete themselves
    if (parseInt(id) === req.user.id) {
      return next(new ApiError(400, 'You cannot delete your own account'));
    }
    
    // Delete user
    await db('users').where({ id }).del();
    
    res.status(200).json({
      status: 'success',
      message: 'User deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all roles
 * @route GET /api/users/roles
 */
const getRoles = async (req, res, next) => {
  try {
    const roles = await db('roles').select('*');
    
    res.status(200).json({
      status: 'success',
      data: {
        roles,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  resetPassword,
  deleteUser,
  getRoles,
};
