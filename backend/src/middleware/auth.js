const jwt = require('jsonwebtoken');
const { ApiError } = require('./errorHandler');
const db = require('../db/connection');

/**
 * Middleware to protect routes that require authentication
 */
const protect = async (req, res, next) => {
  try {
    let token;
    
    // Check if token exists in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    // Check if token exists
    if (!token) {
      return next(new ApiError(401, 'Not authorized to access this route'));
    }
    
    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Check if user still exists
      const user = await db('users').where({ id: decoded.id, is_active: true }).first();
      
      if (!user) {
        return next(new ApiError(401, 'User no longer exists or is inactive'));
      }
      
      // Add user to request object
      req.user = user;
      next();
    } catch (error) {
      return next(new ApiError(401, 'Invalid token'));
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to restrict access to certain roles
 */
const authorize = (...roles) => {
  return async (req, res, next) => {
    try {
      // Get user role
      const role = await db('roles').where({ id: req.user.role_id }).first();
      
      if (!role || !roles.includes(role.role_name)) {
        return next(new ApiError(403, `Role ${role ? role.role_name : 'unknown'} is not authorized to access this route`));
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = {
  protect,
  authorize,
};
