const db = require('../db/connection');
const { ApiError } = require('../middleware/errorHandler');

/**
 * Get all contacts
 * @route GET /api/contacts
 */
const getContacts = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, sort_by = 'id', sort_dir = 'asc', owner_user_id, tag_id } = req.query;
    
    // Build query
    let query = db('contacts')
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
      );
    
    // Apply search filter
    if (search) {
      query = query.where((builder) => {
        builder.whereRaw('LOWER(contacts.first_name) LIKE ?', [`%${search.toLowerCase()}%`])
          .orWhereRaw('LOWER(contacts.last_name) LIKE ?', [`%${search.toLowerCase()}%`])
          .orWhereRaw('LOWER(contacts.email) LIKE ?', [`%${search.toLowerCase()}%`])
          .orWhereRaw('contacts.phone_primary LIKE ?', [`%${search}%`]);
      });
    }
    
    // Filter by owner
    if (owner_user_id) {
      query = query.where('contacts.owner_user_id', owner_user_id);
    }
    
    // Filter by tag
    if (tag_id) {
      query = query.join('contact_tags', 'contacts.id', '=', 'contact_tags.contact_id')
        .where('contact_tags.tag_id', tag_id);
    }
    
    // Get total count
    const countQuery = query.clone();
    const [{ count }] = await countQuery.count('contacts.id as count');
    
    // Apply pagination and sorting
    query = query
      .orderBy(`contacts.${sort_by}`, sort_dir)
      .limit(limit)
      .offset((page - 1) * limit);
    
    // Execute query
    const contacts = await query;
    
    // Get tags for each contact
    const contactIds = contacts.map(contact => contact.id);
    
    if (contactIds.length > 0) {
      const contactTags = await db('contact_tags')
        .join('tags', 'contact_tags.tag_id', '=', 'tags.id')
        .select('contact_tags.contact_id', 'tags.id', 'tags.tag_name', 'tags.tag_color')
        .whereIn('contact_tags.contact_id', contactIds);
      
      // Group tags by contact
      const tagsByContact = contactTags.reduce((acc, tag) => {
        if (!acc[tag.contact_id]) {
          acc[tag.contact_id] = [];
        }
        acc[tag.contact_id].push({
          id: tag.id,
          tag_name: tag.tag_name,
          tag_color: tag.tag_color,
        });
        return acc;
      }, {});
      
      // Add tags to contacts
      contacts.forEach(contact => {
        contact.tags = tagsByContact[contact.id] || [];
      });
    } else {
      contacts.forEach(contact => {
        contact.tags = [];
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        contacts,
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
 * Get contact by ID
 * @route GET /api/contacts/:id
 */
const getContactById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Get contact
    const contact = await db('contacts')
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
      .where('contacts.id', id)
      .first();
    
    if (!contact) {
      return next(new ApiError(404, 'Contact not found'));
    }
    
    // Get tags
    const tags = await db('contact_tags')
      .join('tags', 'contact_tags.tag_id', '=', 'tags.id')
      .select('tags.id', 'tags.tag_name', 'tags.tag_color')
      .where('contact_tags.contact_id', id);
    
    contact.tags = tags;
    
    // Get related transactions
    const transactions = await db('transaction_contacts')
      .join('transactions', 'transaction_contacts.transaction_id', '=', 'transactions.id')
      .join('properties', 'transactions.property_id', '=', 'properties.id')
      .join('transaction_statuses', 'transactions.transaction_status_id', '=', 'transaction_statuses.id')
      .select(
        'transactions.id',
        'transactions.transaction_name',
        'transactions.transaction_type',
        'transaction_contacts.role',
        'transaction_statuses.status_name',
        'properties.address_street',
        'properties.address_city',
        'properties.address_state',
        'properties.address_zip',
        'transactions.price',
        'transactions.estimated_close_date',
        'transactions.actual_close_date'
      )
      .where('transaction_contacts.contact_id', id);
    
    contact.transactions = transactions;
    
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
      .where('communications.contact_id', id)
      .orderBy('communications.timestamp', 'desc')
      .limit(10);
    
    contact.recent_communications = communications;
    
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
      .where('tasks.related_contact_id', id)
      .orderBy('tasks.due_date', 'asc')
      .limit(10);
    
    contact.recent_tasks = tasks;
    
    res.status(200).json({
      status: 'success',
      data: {
        contact,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new contact
 * @route POST /api/contacts
 */
const createContact = async (req, res, next) => {
  try {
    const {
      first_name,
      last_name,
      email,
      phone_primary,
      phone_secondary,
      address_street,
      address_city,
      address_state,
      address_zip,
      address_country,
      preferred_contact_method,
      relationship_notes,
      owner_user_id,
      tags,
    } = req.body;
    
    // Check if email is already taken
    if (email) {
      const existingContact = await db('contacts').where({ email }).first();
      if (existingContact) {
        return next(new ApiError(400, 'A contact with this email already exists'));
      }
    }
    
    // Start transaction
    await db.transaction(async (trx) => {
      // Create contact
      const [contactId] = await trx('contacts').insert({
        first_name,
        last_name,
        email,
        phone_primary,
        phone_secondary,
        address_street,
        address_city,
        address_state,
        address_zip,
        address_country,
        preferred_contact_method,
        relationship_notes,
        owner_user_id: owner_user_id || req.user.id,
        created_at: new Date(),
        updated_at: new Date(),
      }).returning('id');
      
      // Add tags if provided
      if (tags && tags.length > 0) {
        const tagEntries = tags.map(tagId => ({
          contact_id: contactId,
          tag_id: tagId,
        }));
        
        await trx('contact_tags').insert(tagEntries);
      }
      
      // Get created contact
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
      
      // Get tags
      if (tags && tags.length > 0) {
        const contactTags = await trx('contact_tags')
          .join('tags', 'contact_tags.tag_id', '=', 'tags.id')
          .select('tags.id', 'tags.tag_name', 'tags.tag_color')
          .where('contact_tags.contact_id', contactId);
        
        contact.tags = contactTags;
      } else {
        contact.tags = [];
      }
      
      res.status(201).json({
        status: 'success',
        data: {
          contact,
        },
      });
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update contact
 * @route PUT /api/contacts/:id
 */
const updateContact = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      first_name,
      last_name,
      email,
      phone_primary,
      phone_secondary,
      address_street,
      address_city,
      address_state,
      address_zip,
      address_country,
      preferred_contact_method,
      relationship_notes,
      owner_user_id,
      tags,
    } = req.body;
    
    // Check if contact exists
    const contact = await db('contacts').where({ id }).first();
    if (!contact) {
      return next(new ApiError(404, 'Contact not found'));
    }
    
    // Check if email is already taken by another contact
    if (email && email !== contact.email) {
      const existingContact = await db('contacts').where({ email }).first();
      if (existingContact) {
        return next(new ApiError(400, 'A contact with this email already exists'));
      }
    }
    
    // Start transaction
    await db.transaction(async (trx) => {
      // Update contact
      await trx('contacts')
        .where({ id })
        .update({
          ...(first_name !== undefined && { first_name }),
          ...(last_name !== undefined && { last_name }),
          ...(email !== undefined && { email }),
          ...(phone_primary !== undefined && { phone_primary }),
          ...(phone_secondary !== undefined && { phone_secondary }),
          ...(address_street !== undefined && { address_street }),
          ...(address_city !== undefined && { address_city }),
          ...(address_state !== undefined && { address_state }),
          ...(address_zip !== undefined && { address_zip }),
          ...(address_country !== undefined && { address_country }),
          ...(preferred_contact_method !== undefined && { preferred_contact_method }),
          ...(relationship_notes !== undefined && { relationship_notes }),
          ...(owner_user_id !== undefined && { owner_user_id }),
          updated_at: new Date(),
        });
      
      // Update tags if provided
      if (tags) {
        // Delete existing tags
        await trx('contact_tags').where({ contact_id: id }).del();
        
        // Add new tags
        if (tags.length > 0) {
          const tagEntries = tags.map(tagId => ({
            contact_id: id,
            tag_id: tagId,
          }));
          
          await trx('contact_tags').insert(tagEntries);
        }
      }
      
      // Get updated contact
      const updatedContact = await trx('contacts')
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
        .where('contacts.id', id)
        .first();
      
      // Get tags
      const contactTags = await trx('contact_tags')
        .join('tags', 'contact_tags.tag_id', '=', 'tags.id')
        .select('tags.id', 'tags.tag_name', 'tags.tag_color')
        .where('contact_tags.contact_id', id);
      
      updatedContact.tags = contactTags;
      
      res.status(200).json({
        status: 'success',
        data: {
          contact: updatedContact,
        },
      });
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete contact
 * @route DELETE /api/contacts/:id
 */
const deleteContact = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if contact exists
    const contact = await db('contacts').where({ id }).first();
    if (!contact) {
      return next(new ApiError(404, 'Contact not found'));
    }
    
    // Delete contact
    await db('contacts').where({ id }).del();
    
    res.status(200).json({
      status: 'success',
      message: 'Contact deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getContacts,
  getContactById,
  createContact,
  updateContact,
  deleteContact,
};
