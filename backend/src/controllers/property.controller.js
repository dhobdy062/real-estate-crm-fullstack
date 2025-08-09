const db = require('../db/connection');
const { ApiError } = require('../middleware/errorHandler');

/**
 * Get all properties
 * @route GET /api/properties
 */
const getProperties = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      sort_by = 'id',
      sort_dir = 'asc',
      property_type,
      listing_status,
    } = req.query;
    
    // Build query
    let query = db('properties').select('*');
    
    // Apply search filter
    if (search) {
      query = query.where((builder) => {
        builder.whereRaw('LOWER(address_street) LIKE ?', [`%${search.toLowerCase()}%`])
          .orWhereRaw('LOWER(address_city) LIKE ?', [`%${search.toLowerCase()}%`])
          .orWhereRaw('LOWER(address_state) LIKE ?', [`%${search.toLowerCase()}%`])
          .orWhereRaw('address_zip LIKE ?', [`%${search}%`])
          .orWhereRaw('mls_number LIKE ?', [`%${search}%`]);
      });
    }
    
    // Filter by property type
    if (property_type) {
      query = query.where('property_type', property_type);
    }
    
    // Filter by listing status
    if (listing_status) {
      query = query.where('listing_status', listing_status);
    }
    
    // Get total count
    const countQuery = query.clone();
    const [{ count }] = await countQuery.count('id as count');
    
    // Apply pagination and sorting
    query = query
      .orderBy(sort_by, sort_dir)
      .limit(limit)
      .offset((page - 1) * limit);
    
    // Execute query
    const properties = await query;
    
    res.status(200).json({
      status: 'success',
      data: {
        properties,
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
 * Get property by ID
 * @route GET /api/properties/:id
 */
const getPropertyById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Get property
    const property = await db('properties').where({ id }).first();
    
    if (!property) {
      return next(new ApiError(404, 'Property not found'));
    }
    
    // Get transactions associated with this property
    const transactions = await db('transactions')
      .join('transaction_statuses', 'transactions.transaction_status_id', '=', 'transaction_statuses.id')
      .join('users', 'transactions.agent_user_id', '=', 'users.id')
      .select(
        'transactions.id',
        'transactions.transaction_name',
        'transactions.transaction_type',
        'transaction_statuses.status_name',
        'transactions.estimated_close_date',
        'transactions.actual_close_date',
        'transactions.price',
        'transactions.agent_user_id',
        db.raw('CONCAT(users.first_name, \' \', users.last_name) as agent_name')
      )
      .where('transactions.property_id', id);
    
    property.transactions = transactions;
    
    res.status(200).json({
      status: 'success',
      data: {
        property,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new property
 * @route POST /api/properties
 */
const createProperty = async (req, res, next) => {
  try {
    const {
      address_street,
      address_city,
      address_state,
      address_zip,
      address_country,
      property_type,
      bedrooms,
      bathrooms,
      square_footage,
      year_built,
      lot_size,
      lot_units,
      mls_number,
      listing_status,
      notes,
    } = req.body;
    
    // Check if MLS number is already used
    if (mls_number) {
      const existingProperty = await db('properties').where({ mls_number }).first();
      if (existingProperty) {
        return next(new ApiError(400, 'A property with this MLS number already exists'));
      }
    }
    
    // Create property
    const [propertyId] = await db('properties').insert({
      address_street,
      address_city,
      address_state,
      address_zip,
      address_country: address_country || 'USA',
      property_type,
      bedrooms,
      bathrooms,
      square_footage,
      year_built,
      lot_size,
      lot_units,
      mls_number,
      listing_status,
      notes,
      created_at: new Date(),
      updated_at: new Date(),
    }).returning('id');
    
    // Get created property
    const property = await db('properties').where({ id: propertyId }).first();
    
    res.status(201).json({
      status: 'success',
      data: {
        property,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update property
 * @route PUT /api/properties/:id
 */
const updateProperty = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      address_street,
      address_city,
      address_state,
      address_zip,
      address_country,
      property_type,
      bedrooms,
      bathrooms,
      square_footage,
      year_built,
      lot_size,
      lot_units,
      mls_number,
      listing_status,
      notes,
    } = req.body;
    
    // Check if property exists
    const property = await db('properties').where({ id }).first();
    if (!property) {
      return next(new ApiError(404, 'Property not found'));
    }
    
    // Check if MLS number is already used by another property
    if (mls_number && mls_number !== property.mls_number) {
      const existingProperty = await db('properties').where({ mls_number }).first();
      if (existingProperty) {
        return next(new ApiError(400, 'A property with this MLS number already exists'));
      }
    }
    
    // Update property
    await db('properties')
      .where({ id })
      .update({
        ...(address_street !== undefined && { address_street }),
        ...(address_city !== undefined && { address_city }),
        ...(address_state !== undefined && { address_state }),
        ...(address_zip !== undefined && { address_zip }),
        ...(address_country !== undefined && { address_country }),
        ...(property_type !== undefined && { property_type }),
        ...(bedrooms !== undefined && { bedrooms }),
        ...(bathrooms !== undefined && { bathrooms }),
        ...(square_footage !== undefined && { square_footage }),
        ...(year_built !== undefined && { year_built }),
        ...(lot_size !== undefined && { lot_size }),
        ...(lot_units !== undefined && { lot_units }),
        ...(mls_number !== undefined && { mls_number }),
        ...(listing_status !== undefined && { listing_status }),
        ...(notes !== undefined && { notes }),
        updated_at: new Date(),
      });
    
    // Get updated property
    const updatedProperty = await db('properties').where({ id }).first();
    
    res.status(200).json({
      status: 'success',
      data: {
        property: updatedProperty,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete property
 * @route DELETE /api/properties/:id
 */
const deleteProperty = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if property exists
    const property = await db('properties').where({ id }).first();
    if (!property) {
      return next(new ApiError(404, 'Property not found'));
    }
    
    // Check if property is used in any transactions
    const transactions = await db('transactions').where({ property_id: id }).first();
    if (transactions) {
      return next(new ApiError(400, 'Cannot delete property that is used in transactions'));
    }
    
    // Delete property
    await db('properties').where({ id }).del();
    
    res.status(200).json({
      status: 'success',
      message: 'Property deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
};
