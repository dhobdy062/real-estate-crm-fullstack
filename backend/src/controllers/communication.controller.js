const db = require('../db/connection');
const { ApiError } = require('../middleware/errorHandler');

/**
 * Get all communications
 * @route GET /api/communications
 */
const getCommunications = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      sort_by = 'timestamp',
      sort_dir = 'desc',
      communication_type,
      direction,
      status,
      lead_id,
      contact_id,
      user_id,
      date_start,
      date_end,
    } = req.query;
    
    // Build query
    let query = db('communications')
      .leftJoin('users', 'communications.user_id', '=', 'users.id')
      .leftJoin('leads', 'communications.lead_id', '=', 'leads.id')
      .leftJoin('contacts', 'communications.contact_id', '=', 'contacts.id')
      .leftJoin('communication_templates', 'communications.template_id', '=', 'communication_templates.id')
      .select(
        'communications.id',
        'communications.communication_type',
        'communications.direction',
        'communications.status',
        'communications.subject',
        'communications.message_content',
        'communications.timestamp',
        'communications.lead_id',
        db.raw('CONCAT(leads.first_name, \' \', leads.last_name) as lead_name'),
        'communications.contact_id',
        db.raw('CONCAT(contacts.first_name, \' \', contacts.last_name) as contact_name'),
        'communications.user_id',
        db.raw('CONCAT(users.first_name, \' \', users.last_name) as user_name'),
        'communications.template_id',
        'communication_templates.template_name',
        'communications.external_message_id',
        'communications.scheduled_time'
      );
    
    // Apply search filter
    if (search) {
      query = query.where((builder) => {
        builder.whereRaw('LOWER(communications.subject) LIKE ?', [`%${search.toLowerCase()}%`])
          .orWhereRaw('LOWER(communications.message_content) LIKE ?', [`%${search.toLowerCase()}%`]);
      });
    }
    
    // Filter by communication type
    if (communication_type) {
      query = query.where('communications.communication_type', communication_type);
    }
    
    // Filter by direction
    if (direction) {
      query = query.where('communications.direction', direction);
    }
    
    // Filter by status
    if (status) {
      query = query.where('communications.status', status);
    }
    
    // Filter by lead
    if (lead_id) {
      query = query.where('communications.lead_id', lead_id);
    }
    
    // Filter by contact
    if (contact_id) {
      query = query.where('communications.contact_id', contact_id);
    }
    
    // Filter by user
    if (user_id) {
      query = query.where('communications.user_id', user_id);
    }
    
    // Filter by date range
    if (date_start) {
      query = query.where('communications.timestamp', '>=', date_start);
    }
    
    if (date_end) {
      query = query.where('communications.timestamp', '<=', date_end);
    }
    
    // Get total count
    const countQuery = query.clone();
    const [{ count }] = await countQuery.count('communications.id as count');
    
    // Apply pagination and sorting
    query = query
      .orderBy(`communications.${sort_by}`, sort_dir)
      .limit(limit)
      .offset((page - 1) * limit);
    
    // Execute query
    const communications = await query;
    
    res.status(200).json({
      status: 'success',
      data: {
        communications,
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
 * Get communication by ID
 * @route GET /api/communications/:id
 */
const getCommunicationById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Get communication
    const communication = await db('communications')
      .leftJoin('users', 'communications.user_id', '=', 'users.id')
      .leftJoin('leads', 'communications.lead_id', '=', 'leads.id')
      .leftJoin('contacts', 'communications.contact_id', '=', 'contacts.id')
      .leftJoin('communication_templates', 'communications.template_id', '=', 'communication_templates.id')
      .select(
        'communications.id',
        'communications.communication_type',
        'communications.direction',
        'communications.status',
        'communications.subject',
        'communications.message_content',
        'communications.timestamp',
        'communications.lead_id',
        'leads.first_name as lead_first_name',
        'leads.last_name as lead_last_name',
        'leads.email as lead_email',
        'communications.contact_id',
        'contacts.first_name as contact_first_name',
        'contacts.last_name as contact_last_name',
        'contacts.email as contact_email',
        'communications.user_id',
        'users.first_name as user_first_name',
        'users.last_name as user_last_name',
        'communications.template_id',
        'communication_templates.template_name',
        'communications.external_message_id',
        'communications.scheduled_time'
      )
      .where('communications.id', id)
      .first();
    
    if (!communication) {
      return next(new ApiError(404, 'Communication not found'));
    }
    
    // Format the response
    const formattedCommunication = {
      id: communication.id,
      communication_type: communication.communication_type,
      direction: communication.direction,
      status: communication.status,
      subject: communication.subject,
      message_content: communication.message_content,
      timestamp: communication.timestamp,
      scheduled_time: communication.scheduled_time,
      external_message_id: communication.external_message_id,
      lead: communication.lead_id ? {
        id: communication.lead_id,
        first_name: communication.lead_first_name,
        last_name: communication.lead_last_name,
        email: communication.lead_email,
      } : null,
      contact: communication.contact_id ? {
        id: communication.contact_id,
        first_name: communication.contact_first_name,
        last_name: communication.contact_last_name,
        email: communication.contact_email,
      } : null,
      user: communication.user_id ? {
        id: communication.user_id,
        first_name: communication.user_first_name,
        last_name: communication.user_last_name,
      } : null,
      template: communication.template_id ? {
        id: communication.template_id,
        template_name: communication.template_name,
      } : null,
    };
    
    res.status(200).json({
      status: 'success',
      data: {
        communication: formattedCommunication,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new communication
 * @route POST /api/communications
 */
const createCommunication = async (req, res, next) => {
  try {
    const {
      communication_type,
      direction,
      status,
      subject,
      message_content,
      lead_id,
      contact_id,
      template_id,
      external_message_id,
      scheduled_time,
    } = req.body;
    
    // Validate that either lead_id or contact_id is provided
    if (!lead_id && !contact_id) {
      return next(new ApiError(400, 'Either lead_id or contact_id is required'));
    }
    
    // Create communication
    const [communicationId] = await db('communications').insert({
      communication_type,
      direction,
      status,
      subject,
      message_content,
      timestamp: new Date(),
      lead_id,
      contact_id,
      user_id: req.user.id,
      template_id,
      external_message_id,
      scheduled_time,
    }).returning('id');
    
    // Get created communication
    const communication = await db('communications')
      .leftJoin('users', 'communications.user_id', '=', 'users.id')
      .leftJoin('leads', 'communications.lead_id', '=', 'leads.id')
      .leftJoin('contacts', 'communications.contact_id', '=', 'contacts.id')
      .leftJoin('communication_templates', 'communications.template_id', '=', 'communication_templates.id')
      .select(
        'communications.id',
        'communications.communication_type',
        'communications.direction',
        'communications.status',
        'communications.subject',
        'communications.message_content',
        'communications.timestamp',
        'communications.lead_id',
        db.raw('CONCAT(leads.first_name, \' \', leads.last_name) as lead_name'),
        'communications.contact_id',
        db.raw('CONCAT(contacts.first_name, \' \', contacts.last_name) as contact_name'),
        'communications.user_id',
        db.raw('CONCAT(users.first_name, \' \', users.last_name) as user_name'),
        'communications.template_id',
        'communication_templates.template_name',
        'communications.external_message_id',
        'communications.scheduled_time'
      )
      .where('communications.id', communicationId)
      .first();
    
    res.status(201).json({
      status: 'success',
      data: {
        communication,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update communication
 * @route PUT /api/communications/:id
 */
const updateCommunication = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      status,
      subject,
      message_content,
      scheduled_time,
    } = req.body;
    
    // Check if communication exists
    const communication = await db('communications').where({ id }).first();
    if (!communication) {
      return next(new ApiError(404, 'Communication not found'));
    }
    
    // Update communication
    await db('communications')
      .where({ id })
      .update({
        ...(status !== undefined && { status }),
        ...(subject !== undefined && { subject }),
        ...(message_content !== undefined && { message_content }),
        ...(scheduled_time !== undefined && { scheduled_time }),
      });
    
    // Get updated communication
    const updatedCommunication = await db('communications')
      .leftJoin('users', 'communications.user_id', '=', 'users.id')
      .leftJoin('leads', 'communications.lead_id', '=', 'leads.id')
      .leftJoin('contacts', 'communications.contact_id', '=', 'contacts.id')
      .leftJoin('communication_templates', 'communications.template_id', '=', 'communication_templates.id')
      .select(
        'communications.id',
        'communications.communication_type',
        'communications.direction',
        'communications.status',
        'communications.subject',
        'communications.message_content',
        'communications.timestamp',
        'communications.lead_id',
        db.raw('CONCAT(leads.first_name, \' \', leads.last_name) as lead_name'),
        'communications.contact_id',
        db.raw('CONCAT(contacts.first_name, \' \', contacts.last_name) as contact_name'),
        'communications.user_id',
        db.raw('CONCAT(users.first_name, \' \', users.last_name) as user_name'),
        'communications.template_id',
        'communication_templates.template_name',
        'communications.external_message_id',
        'communications.scheduled_time'
      )
      .where('communications.id', id)
      .first();
    
    res.status(200).json({
      status: 'success',
      data: {
        communication: updatedCommunication,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete communication
 * @route DELETE /api/communications/:id
 */
const deleteCommunication = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if communication exists
    const communication = await db('communications').where({ id }).first();
    if (!communication) {
      return next(new ApiError(404, 'Communication not found'));
    }
    
    // Delete communication
    await db('communications').where({ id }).del();
    
    res.status(200).json({
      status: 'success',
      message: 'Communication deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get communication templates
 * @route GET /api/communications/templates
 */
const getTemplates = async (req, res, next) => {
  try {
    const { template_type } = req.query;
    
    let query = db('communication_templates')
      .select('*')
      .where('is_active', true);
    
    // Filter by template type if provided
    if (template_type) {
      query = query.where('template_type', template_type);
    }
    
    const templates = await query.orderBy('template_name', 'asc');
    
    res.status(200).json({
      status: 'success',
      data: {
        templates,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new template
 * @route POST /api/communications/templates
 */
const createTemplate = async (req, res, next) => {
  try {
    const {
      template_name,
      template_type,
      subject,
      body_content,
    } = req.body;
    
    // Create template
    const [templateId] = await db('communication_templates').insert({
      template_name,
      template_type,
      subject,
      body_content,
      is_active: true,
      created_by_user_id: req.user.id,
      created_at: new Date(),
      updated_at: new Date(),
    }).returning('id');
    
    // Get created template
    const template = await db('communication_templates').where({ id: templateId }).first();
    
    res.status(201).json({
      status: 'success',
      data: {
        template,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCommunications,
  getCommunicationById,
  createCommunication,
  updateCommunication,
  deleteCommunication,
  getTemplates,
  createTemplate,
};
