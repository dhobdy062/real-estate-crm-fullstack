const db = require('../db/connection');
const { ApiError } = require('../middleware/errorHandler');

/**
 * Get all tags
 * @route GET /api/tags
 */
const getTags = async (req, res, next) => {
  try {
    const tags = await db('tags').select('*').orderBy('tag_name', 'asc');
    
    res.status(200).json({
      status: 'success',
      data: {
        tags,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get tag by ID
 * @route GET /api/tags/:id
 */
const getTagById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const tag = await db('tags').where({ id }).first();
    
    if (!tag) {
      return next(new ApiError(404, 'Tag not found'));
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        tag,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new tag
 * @route POST /api/tags
 */
const createTag = async (req, res, next) => {
  try {
    const { tag_name, tag_color } = req.body;
    
    // Check if tag already exists
    const existingTag = await db('tags').where({ tag_name }).first();
    if (existingTag) {
      return next(new ApiError(400, 'Tag with this name already exists'));
    }
    
    // Create tag
    const [tagId] = await db('tags').insert({
      tag_name,
      tag_color,
    }).returning('id');
    
    // Get created tag
    const tag = await db('tags').where({ id: tagId }).first();
    
    res.status(201).json({
      status: 'success',
      data: {
        tag,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update tag
 * @route PUT /api/tags/:id
 */
const updateTag = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { tag_name, tag_color } = req.body;
    
    // Check if tag exists
    const tag = await db('tags').where({ id }).first();
    if (!tag) {
      return next(new ApiError(404, 'Tag not found'));
    }
    
    // Check if tag name is already taken by another tag
    if (tag_name && tag_name !== tag.tag_name) {
      const existingTag = await db('tags').where({ tag_name }).first();
      if (existingTag) {
        return next(new ApiError(400, 'Tag with this name already exists'));
      }
    }
    
    // Update tag
    await db('tags')
      .where({ id })
      .update({
        ...(tag_name && { tag_name }),
        ...(tag_color && { tag_color }),
      });
    
    // Get updated tag
    const updatedTag = await db('tags').where({ id }).first();
    
    res.status(200).json({
      status: 'success',
      data: {
        tag: updatedTag,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete tag
 * @route DELETE /api/tags/:id
 */
const deleteTag = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if tag exists
    const tag = await db('tags').where({ id }).first();
    if (!tag) {
      return next(new ApiError(404, 'Tag not found'));
    }
    
    // Delete tag
    await db('tags').where({ id }).del();
    
    res.status(200).json({
      status: 'success',
      message: 'Tag deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTags,
  getTagById,
  createTag,
  updateTag,
  deleteTag,
};
