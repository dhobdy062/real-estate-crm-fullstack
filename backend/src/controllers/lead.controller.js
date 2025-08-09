const db = require('../db/connection');
const { ApiError } = require('../middleware/errorHandler');

/**
 * Get all leads
 * @route GET /api/leads
 */
const getLeads = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      sort_by = 'id',
      sort_dir = 'asc',
      assigned_user_id,
      pipeline_status_id,
      lead_source_id,
      tag_id,
    } = req.query;
    
    // Build query
    let query = db('leads')
      .leftJoin('users', 'leads.assigned_user_id', '=', 'users.id')
      .leftJoin('pipeline_statuses', 'leads.pipeline_status_id', '=', 'pipeline_statuses.id')
      .leftJoin('lead_sources', 'leads.lead_source_id', '=', 'lead_sources.id')
      .select(
        'leads.id',
        'leads.first_name',
        'leads.last_name',
        'leads.email',
        'leads.phone_number',
        'leads.lead_source_id',
        'lead_sources.source_name',
        'leads.pipeline_status_id',
        'pipeline_statuses.status_name',
        'leads.inquiry_details',
        'leads.lead_score',
        'leads.assigned_user_id',
        db.raw('CONCAT(users.first_name, \' \', users.last_name) as assigned_user_name'),
        'leads.converted_contact_id',
        'leads.converted_at',
        'leads.external_lead_id',
        'leads.created_at',
        'leads.updated_at'
      );
    
    // Apply search filter
    if (search) {
      query = query.where((builder) => {
        builder.whereRaw('LOWER(leads.first_name) LIKE ?', [`%${search.toLowerCase()}%`])
          .orWhereRaw('LOWER(leads.last_name) LIKE ?', [`%${search.toLowerCase()}%`])
          .orWhereRaw('LOWER(leads.email) LIKE ?', [`%${search.toLowerCase()}%`])
          .orWhereRaw('leads.phone_number LIKE ?', [`%${search}%`]);
      });
    }
    
    // Filter by assigned user
    if (assigned_user_id) {
      query = query.where('leads.assigned_user_id', assigned_user_id);
    }
    
    // Filter by pipeline status
    if (pipeline_status_id) {
      query = query.where('leads.pipeline_status_id', pipeline_status_id);
    }
    
    // Filter by lead source
    if (lead_source_id) {
      query = query.where('leads.lead_source_id', lead_source_id);
    }
    
    // Filter by tag
    if (tag_id) {
      query = query.join('lead_tags', 'leads.id', '=', 'lead_tags.lead_id')
        .where('lead_tags.tag_id', tag_id);
    }
    
    // Get total count
    const countQuery = query.clone();
    const [{ count }] = await countQuery.count('leads.id as count');
    
    // Apply pagination and sorting
    query = query
      .orderBy(`leads.${sort_by}`, sort_dir)
      .limit(limit)
      .offset((page - 1) * limit);
    
    // Execute query
    const leads = await query;
    
    // Get tags for each lead
    const leadIds = leads.map(lead => lead.id);
    
    if (leadIds.length > 0) {
      const leadTags = await db('lead_tags')
        .join('tags', 'lead_tags.tag_id', '=', 'tags.id')
        .select('lead_tags.lead_id', 'tags.id', 'tags.tag_name', 'tags.tag_color')
        .whereIn('lead_tags.lead_id', leadIds);
      
      // Group tags by lead
      const tagsByLead = leadTags.reduce((acc, tag) => {
        if (!acc[tag.lead_id]) {
          acc[tag.lead_id] = [];
        }
        acc[tag.lead_id].push({
          id: tag.id,
          tag_name: tag.tag_name,
          tag_color: tag.tag_color,
        });
        return acc;
      }, {});
      
      // Add tags to leads
      leads.forEach(lead => {
        lead.tags = tagsByLead[lead.id] || [];
      });
    } else {
      leads.forEach(lead => {
        lead.tags = [];
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        leads,
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
 * Get lead by ID
 * @route GET /api/leads/:id
 */
const getLeadById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Get lead
    const lead = await db('leads')
      .leftJoin('users', 'leads.assigned_user_id', '=', 'users.id')
      .leftJoin('pipeline_statuses', 'leads.pipeline_status_id', '=', 'pipeline_statuses.id')
      .leftJoin('lead_sources', 'leads.lead_source_id', '=', 'lead_sources.id')
      .select(
        'leads.id',
        'leads.first_name',
        'leads.last_name',
        'leads.email',
        'leads.phone_number',
        'leads.lead_source_id',
        'lead_sources.source_name',
        'leads.pipeline_status_id',
        'pipeline_statuses.status_name',
        'leads.inquiry_details',
        'leads.lead_score',
        'leads.assigned_user_id',
        db.raw('CONCAT(users.first_name, \' \', users.last_name) as assigned_user_name'),
        'leads.converted_contact_id',
        'leads.converted_at',
        'leads.external_lead_id',
        'leads.created_at',
        'leads.updated_at'
      )
      .where('leads.id', id)
      .first();
    
    if (!lead) {
      return next(new ApiError(404, 'Lead not found'));
    }
    
    // Get tags
    const tags = await db('lead_tags')
      .join('tags', 'lead_tags.tag_id', '=', 'tags.id')
      .select('tags.id', 'tags.tag_name', 'tags.tag_color')
      .where('lead_tags.lead_id', id);
    
    lead.tags = tags;
    
    // Get communications
    const communications = await db('communications')
      .leftJoin('users', 'communications.user_id', '=', 'users.id')
      .select(
        'communications.id',
        'communications.communication_type',
        'communications.direction',
        'communications.status',
        'communications.subject',
        'communications.message_content',
        'communications.timestamp',
        'communications.user_id',
        db.raw('CONCAT(users.first_name, \' \', users.last_name) as user_name')
      )
      .where('communications.lead_id', id)
      .orderBy('communications.timestamp', 'desc')
      .limit(10);
    
    lead.recent_communications = communications;
    
    // Get tasks
    const tasks = await db('tasks')
      .leftJoin('users as assigned', 'tasks.assigned_user_id', '=', 'assigned.id')
      .select(
        'tasks.id',
        'tasks.task_title',
        'tasks.description',
        'tasks.due_date',
        'tasks.status',
        'tasks.priority',
        'tasks.assigned_user_id',
        db.raw('CONCAT(assigned.first_name, \' \', assigned.last_name) as assigned_user_name'),
        'tasks.completed_at'
      )
      .where('tasks.related_lead_id', id)
      .orderBy('tasks.due_date', 'asc')
      .limit(10);
    
    lead.recent_tasks = tasks;
    
    // Get converted contact if exists
    if (lead.converted_contact_id) {
      const contact = await db('contacts')
        .select(
          'id',
          'first_name',
          'last_name',
          'email',
          'phone_primary',
          'address_street',
          'address_city',
          'address_state',
          'address_zip'
        )
        .where('id', lead.converted_contact_id)
        .first();
      
      lead.converted_contact = contact;
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        lead,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new lead
 * @route POST /api/leads
 */
const createLead = async (req, res, next) => {
  try {
    const {
      first_name,
      last_name,
      email,
      phone_number,
      lead_source_id,
      pipeline_status_id,
      inquiry_details,
      lead_score,
      assigned_user_id,
      external_lead_id,
      tags,
    } = req.body;
    
    // Start transaction
    await db.transaction(async (trx) => {
      // Create lead
      const [leadId] = await trx('leads').insert({
        first_name,
        last_name,
        email,
        phone_number,
        lead_source_id,
        pipeline_status_id: pipeline_status_id || 1, // Default to first status if not provided
        inquiry_details,
        lead_score: lead_score || 0,
        assigned_user_id: assigned_user_id || req.user.id,
        external_lead_id,
        created_at: new Date(),
        updated_at: new Date(),
      }).returning('id');
      
      // Add tags if provided
      if (tags && tags.length > 0) {
        const tagEntries = tags.map(tagId => ({
          lead_id: leadId,
          tag_id: tagId,
        }));
        
        await trx('lead_tags').insert(tagEntries);
      }
      
      // Get created lead
      const lead = await trx('leads')
        .leftJoin('users', 'leads.assigned_user_id', '=', 'users.id')
        .leftJoin('pipeline_statuses', 'leads.pipeline_status_id', '=', 'pipeline_statuses.id')
        .leftJoin('lead_sources', 'leads.lead_source_id', '=', 'lead_sources.id')
        .select(
          'leads.id',
          'leads.first_name',
          'leads.last_name',
          'leads.email',
          'leads.phone_number',
          'leads.lead_source_id',
          'lead_sources.source_name',
          'leads.pipeline_status_id',
          'pipeline_statuses.status_name',
          'leads.inquiry_details',
          'leads.lead_score',
          'leads.assigned_user_id',
          db.raw('CONCAT(users.first_name, \' \', users.last_name) as assigned_user_name'),
          'leads.external_lead_id',
          'leads.created_at',
          'leads.updated_at'
        )
        .where('leads.id', leadId)
        .first();
      
      // Get tags
      if (tags && tags.length > 0) {
        const leadTags = await trx('lead_tags')
          .join('tags', 'lead_tags.tag_id', '=', 'tags.id')
          .select('tags.id', 'tags.tag_name', 'tags.tag_color')
          .where('lead_tags.lead_id', leadId);
        
        lead.tags = leadTags;
      } else {
        lead.tags = [];
      }
      
      res.status(201).json({
        status: 'success',
        data: {
          lead,
        },
      });
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update lead
 * @route PUT /api/leads/:id
 */
const updateLead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      first_name,
      last_name,
      email,
      phone_number,
      lead_source_id,
      pipeline_status_id,
      inquiry_details,
      lead_score,
      assigned_user_id,
      external_lead_id,
      tags,
    } = req.body;
    
    // Check if lead exists
    const lead = await db('leads').where({ id }).first();
    if (!lead) {
      return next(new ApiError(404, 'Lead not found'));
    }
    
    // Start transaction
    await db.transaction(async (trx) => {
      // Update lead
      await trx('leads')
        .where({ id })
        .update({
          ...(first_name !== undefined && { first_name }),
          ...(last_name !== undefined && { last_name }),
          ...(email !== undefined && { email }),
          ...(phone_number !== undefined && { phone_number }),
          ...(lead_source_id !== undefined && { lead_source_id }),
          ...(pipeline_status_id !== undefined && { pipeline_status_id }),
          ...(inquiry_details !== undefined && { inquiry_details }),
          ...(lead_score !== undefined && { lead_score }),
          ...(assigned_user_id !== undefined && { assigned_user_id }),
          ...(external_lead_id !== undefined && { external_lead_id }),
          updated_at: new Date(),
        });
      
      // Update tags if provided
      if (tags) {
        // Delete existing tags
        await trx('lead_tags').where({ lead_id: id }).del();
        
        // Add new tags
        if (tags.length > 0) {
          const tagEntries = tags.map(tagId => ({
            lead_id: id,
            tag_id: tagId,
          }));
          
          await trx('lead_tags').insert(tagEntries);
        }
      }
      
      // Get updated lead
      const updatedLead = await trx('leads')
        .leftJoin('users', 'leads.assigned_user_id', '=', 'users.id')
        .leftJoin('pipeline_statuses', 'leads.pipeline_status_id', '=', 'pipeline_statuses.id')
        .leftJoin('lead_sources', 'leads.lead_source_id', '=', 'lead_sources.id')
        .select(
          'leads.id',
          'leads.first_name',
          'leads.last_name',
          'leads.email',
          'leads.phone_number',
          'leads.lead_source_id',
          'lead_sources.source_name',
          'leads.pipeline_status_id',
          'pipeline_statuses.status_name',
          'leads.inquiry_details',
          'leads.lead_score',
          'leads.assigned_user_id',
          db.raw('CONCAT(users.first_name, \' \', users.last_name) as assigned_user_name'),
          'leads.converted_contact_id',
          'leads.converted_at',
          'leads.external_lead_id',
          'leads.created_at',
          'leads.updated_at'
        )
        .where('leads.id', id)
        .first();
      
      // Get tags
      const leadTags = await trx('lead_tags')
        .join('tags', 'lead_tags.tag_id', '=', 'tags.id')
        .select('tags.id', 'tags.tag_name', 'tags.tag_color')
        .where('lead_tags.lead_id', id);
      
      updatedLead.tags = leadTags;
      
      res.status(200).json({
        status: 'success',
        data: {
          lead: updatedLead,
        },
      });
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Convert lead to contact
 * @route POST /api/leads/:id/convert
 */
const convertLead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { contact_id } = req.body;
    
    // Check if lead exists
    const lead = await db('leads').where({ id }).first();
    if (!lead) {
      return next(new ApiError(404, 'Lead not found'));
    }
    
    // Check if lead is already converted
    if (lead.converted_contact_id) {
      return next(new ApiError(400, 'Lead is already converted'));
    }
    
    // Start transaction
    await db.transaction(async (trx) => {
      let contactId = contact_id;
      
      // If no contact_id provided, create a new contact
      if (!contactId) {
        // Create contact from lead data
        [contactId] = await trx('contacts').insert({
          first_name: lead.first_name,
          last_name: lead.last_name,
          email: lead.email,
          phone_primary: lead.phone_number,
          owner_user_id: lead.assigned_user_id,
          created_at: new Date(),
          updated_at: new Date(),
        }).returning('id');
        
        // Copy tags from lead to contact
        const leadTags = await trx('lead_tags').select('tag_id').where({ lead_id: id });
        
        if (leadTags.length > 0) {
          const contactTagEntries = leadTags.map(tag => ({
            contact_id: contactId,
            tag_id: tag.tag_id,
          }));
          
          await trx('contact_tags').insert(contactTagEntries);
        }
      } else {
        // Verify that the contact exists
        const contact = await trx('contacts').where({ id: contactId }).first();
        if (!contact) {
          throw new ApiError(404, 'Contact not found');
        }
      }
      
      // Update lead as converted
      await trx('leads')
        .where({ id })
        .update({
          converted_contact_id: contactId,
          converted_at: new Date(),
          updated_at: new Date(),
        });
      
      // Get converted contact
      const contact = await trx('contacts')
        .leftJoin('users', 'contacts.owner_user_id', '=', 'users.id')
        .select(
          'contacts.id',
          'contacts.first_name',
          'contacts.last_name',
          'contacts.email',
          'contacts.phone_primary',
          'contacts.phone_secondary',
          'contacts.address_street',
          'contacts.address_city',
          'contacts.address_state',
          'contacts.address_zip',
          'contacts.address_country',
          'contacts.preferred_contact_method',
          'contacts.relationship_notes',
          'contacts.owner_user_id',
          db.raw('CONCAT(users.first_name, \' \', users.last_name) as owner_name'),
          'contacts.created_at',
          'contacts.updated_at'
        )
        .where('contacts.id', contactId)
        .first();
      
      // Get contact tags
      const contactTags = await trx('contact_tags')
        .join('tags', 'contact_tags.tag_id', '=', 'tags.id')
        .select('tags.id', 'tags.tag_name', 'tags.tag_color')
        .where('contact_tags.contact_id', contactId);
      
      contact.tags = contactTags;
      
      res.status(200).json({
        status: 'success',
        data: {
          message: 'Lead converted successfully',
          contact,
        },
      });
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete lead
 * @route DELETE /api/leads/:id
 */
const deleteLead = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if lead exists
    const lead = await db('leads').where({ id }).first();
    if (!lead) {
      return next(new ApiError(404, 'Lead not found'));
    }
    
    // Delete lead
    await db('leads').where({ id }).del();
    
    res.status(200).json({
      status: 'success',
      message: 'Lead deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get lead sources
 * @route GET /api/leads/sources
 */
const getLeadSources = async (req, res, next) => {
  try {
    const sources = await db('lead_sources').select('*').orderBy('source_name', 'asc');
    
    res.status(200).json({
      status: 'success',
      data: {
        sources,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get pipeline statuses
 * @route GET /api/leads/pipeline-statuses
 */
const getPipelineStatuses = async (req, res, next) => {
  try {
    const statuses = await db('pipeline_statuses')
      .select('*')
      .orderBy('stage_order', 'asc');
    
    res.status(200).json({
      status: 'success',
      data: {
        statuses,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  convertLead,
  deleteLead,
  getLeadSources,
  getPipelineStatuses,
};
