const db = require('../db/connection');
const { ApiError } = require('../middleware/errorHandler');

/**
 * Get all transactions
 * @route GET /api/transactions
 */
const getTransactions = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      sort_by = 'id',
      sort_dir = 'asc',
      transaction_type,
      transaction_status_id,
      agent_user_id,
      contact_id,
    } = req.query;
    
    // Build query
    let query = db('transactions')
      .join('properties', 'transactions.property_id', '=', 'properties.id')
      .join('transaction_statuses', 'transactions.transaction_status_id', '=', 'transaction_statuses.id')
      .join('users', 'transactions.agent_user_id', '=', 'users.id')
      .select(
        'transactions.id',
        'transactions.transaction_name',
        'transactions.property_id',
        'properties.address_street',
        'properties.address_city',
        'properties.address_state',
        'properties.address_zip',
        'transactions.transaction_type',
        'transactions.transaction_status_id',
        'transaction_statuses.status_name',
        'transactions.estimated_close_date',
        'transactions.actual_close_date',
        'transactions.price',
        'transactions.commission_percentage',
        'transactions.commission_amount',
        'transactions.agent_user_id',
        db.raw('CONCAT(users.first_name, \' \', users.last_name) as agent_name'),
        'transactions.created_at',
        'transactions.updated_at'
      );
    
    // Apply search filter
    if (search) {
      query = query.where((builder) => {
        builder.whereRaw('LOWER(transactions.transaction_name) LIKE ?', [`%${search.toLowerCase()}%`])
          .orWhereRaw('LOWER(properties.address_street) LIKE ?', [`%${search.toLowerCase()}%`])
          .orWhereRaw('LOWER(properties.address_city) LIKE ?', [`%${search.toLowerCase()}%`])
          .orWhereRaw('properties.address_zip LIKE ?', [`%${search}%`]);
      });
    }
    
    // Filter by transaction type
    if (transaction_type) {
      query = query.where('transactions.transaction_type', transaction_type);
    }
    
    // Filter by transaction status
    if (transaction_status_id) {
      query = query.where('transactions.transaction_status_id', transaction_status_id);
    }
    
    // Filter by agent
    if (agent_user_id) {
      query = query.where('transactions.agent_user_id', agent_user_id);
    }
    
    // Filter by contact
    if (contact_id) {
      query = query.join('transaction_contacts', 'transactions.id', '=', 'transaction_contacts.transaction_id')
        .where('transaction_contacts.contact_id', contact_id);
    }
    
    // Get total count
    const countQuery = query.clone();
    const [{ count }] = await countQuery.count('transactions.id as count');
    
    // Apply pagination and sorting
    query = query
      .orderBy(`transactions.${sort_by}`, sort_dir)
      .limit(limit)
      .offset((page - 1) * limit);
    
    // Execute query
    const transactions = await query;
    
    res.status(200).json({
      status: 'success',
      data: {
        transactions,
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
 * Get transaction by ID
 * @route GET /api/transactions/:id
 */
const getTransactionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Get transaction
    const transaction = await db('transactions')
      .join('properties', 'transactions.property_id', '=', 'properties.id')
      .join('transaction_statuses', 'transactions.transaction_status_id', '=', 'transaction_statuses.id')
      .join('users', 'transactions.agent_user_id', '=', 'users.id')
      .select(
        'transactions.id',
        'transactions.transaction_name',
        'transactions.property_id',
        'properties.address_street',
        'properties.address_city',
        'properties.address_state',
        'properties.address_zip',
        'properties.address_country',
        'properties.property_type',
        'properties.bedrooms',
        'properties.bathrooms',
        'properties.square_footage',
        'properties.year_built',
        'properties.lot_size',
        'properties.lot_units',
        'properties.mls_number',
        'transactions.transaction_type',
        'transactions.transaction_status_id',
        'transaction_statuses.status_name',
        'transactions.estimated_close_date',
        'transactions.actual_close_date',
        'transactions.price',
        'transactions.commission_percentage',
        'transactions.commission_amount',
        'transactions.agent_user_id',
        db.raw('CONCAT(users.first_name, \' \', users.last_name) as agent_name'),
        'transactions.notes',
        'transactions.created_at',
        'transactions.updated_at'
      )
      .where('transactions.id', id)
      .first();
    
    if (!transaction) {
      return next(new ApiError(404, 'Transaction not found'));
    }
    
    // Get contacts associated with this transaction
    const contacts = await db('transaction_contacts')
      .join('contacts', 'transaction_contacts.contact_id', '=', 'contacts.id')
      .select(
        'transaction_contacts.id',
        'transaction_contacts.contact_id',
        'contacts.first_name',
        'contacts.last_name',
        'contacts.email',
        'contacts.phone_primary',
        'transaction_contacts.role',
        'transaction_contacts.notes'
      )
      .where('transaction_contacts.transaction_id', id);
    
    transaction.contacts = contacts;
    
    // Get checklist items
    const checklistItems = await db('transaction_checklist_items')
      .leftJoin('transaction_milestones', 'transaction_checklist_items.milestone_id', '=', 'transaction_milestones.id')
      .leftJoin('users', 'transaction_checklist_items.assigned_user_id', '=', 'users.id')
      .select(
        'transaction_checklist_items.id',
        'transaction_checklist_items.milestone_id',
        'transaction_milestones.milestone_name',
        'transaction_checklist_items.item_description',
        'transaction_checklist_items.due_date',
        'transaction_checklist_items.completed_date',
        'transaction_checklist_items.is_completed',
        'transaction_checklist_items.assigned_user_id',
        db.raw('CONCAT(users.first_name, \' \', users.last_name) as assigned_user_name'),
        'transaction_checklist_items.notes'
      )
      .where('transaction_checklist_items.transaction_id', id)
      .orderBy(['transaction_milestones.default_order', 'transaction_checklist_items.due_date']);
    
    transaction.checklist_items = checklistItems;
    
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
      .where('tasks.related_transaction_id', id)
      .orderBy('tasks.due_date', 'asc');
    
    transaction.tasks = tasks;
    
    res.status(200).json({
      status: 'success',
      data: {
        transaction,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new transaction
 * @route POST /api/transactions
 */
const createTransaction = async (req, res, next) => {
  try {
    const {
      transaction_name,
      property_id,
      transaction_type,
      transaction_status_id,
      estimated_close_date,
      actual_close_date,
      price,
      commission_percentage,
      commission_amount,
      agent_user_id,
      notes,
      contacts,
    } = req.body;
    
    // Check if property exists
    const property = await db('properties').where({ id: property_id }).first();
    if (!property) {
      return next(new ApiError(404, 'Property not found'));
    }
    
    // Start transaction
    await db.transaction(async (trx) => {
      // Create transaction
      const [transactionId] = await trx('transactions').insert({
        transaction_name: transaction_name || `${property.address_street} ${transaction_type}`,
        property_id,
        transaction_type,
        transaction_status_id,
        estimated_close_date,
        actual_close_date,
        price,
        commission_percentage,
        commission_amount,
        agent_user_id,
        notes,
        created_at: new Date(),
        updated_at: new Date(),
      }).returning('id');
      
      // Add contacts if provided
      if (contacts && contacts.length > 0) {
        const contactEntries = contacts.map(contact => ({
          transaction_id: transactionId,
          contact_id: contact.contact_id,
          role: contact.role,
          notes: contact.notes,
        }));
        
        await trx('transaction_contacts').insert(contactEntries);
      }
      
      // Add default checklist items based on transaction type
      const milestones = await trx('transaction_milestones')
        .where({ transaction_type })
        .orderBy('default_order', 'asc');
      
      if (milestones.length > 0) {
        const checklistItems = milestones.map(milestone => ({
          transaction_id: transactionId,
          milestone_id: milestone.id,
          item_description: milestone.milestone_name,
          is_completed: false,
        }));
        
        await trx('transaction_checklist_items').insert(checklistItems);
      }
      
      // Get created transaction
      const transaction = await trx('transactions')
        .join('properties', 'transactions.property_id', '=', 'properties.id')
        .join('transaction_statuses', 'transactions.transaction_status_id', '=', 'transaction_statuses.id')
        .join('users', 'transactions.agent_user_id', '=', 'users.id')
        .select(
          'transactions.id',
          'transactions.transaction_name',
          'transactions.property_id',
          'properties.address_street',
          'properties.address_city',
          'properties.address_state',
          'properties.address_zip',
          'transactions.transaction_type',
          'transactions.transaction_status_id',
          'transaction_statuses.status_name',
          'transactions.estimated_close_date',
          'transactions.actual_close_date',
          'transactions.price',
          'transactions.commission_percentage',
          'transactions.commission_amount',
          'transactions.agent_user_id',
          db.raw('CONCAT(users.first_name, \' \', users.last_name) as agent_name'),
          'transactions.notes',
          'transactions.created_at',
          'transactions.updated_at'
        )
        .where('transactions.id', transactionId)
        .first();
      
      // Get contacts
      if (contacts && contacts.length > 0) {
        const transactionContacts = await trx('transaction_contacts')
          .join('contacts', 'transaction_contacts.contact_id', '=', 'contacts.id')
          .select(
            'transaction_contacts.id',
            'transaction_contacts.contact_id',
            'contacts.first_name',
            'contacts.last_name',
            'contacts.email',
            'contacts.phone_primary',
            'transaction_contacts.role',
            'transaction_contacts.notes'
          )
          .where('transaction_contacts.transaction_id', transactionId);
        
        transaction.contacts = transactionContacts;
      } else {
        transaction.contacts = [];
      }
      
      // Get checklist items
      const checklistItems = await trx('transaction_checklist_items')
        .leftJoin('transaction_milestones', 'transaction_checklist_items.milestone_id', '=', 'transaction_milestones.id')
        .select(
          'transaction_checklist_items.id',
          'transaction_checklist_items.milestone_id',
          'transaction_milestones.milestone_name',
          'transaction_checklist_items.item_description',
          'transaction_checklist_items.due_date',
          'transaction_checklist_items.completed_date',
          'transaction_checklist_items.is_completed',
          'transaction_checklist_items.assigned_user_id',
          'transaction_checklist_items.notes'
        )
        .where('transaction_checklist_items.transaction_id', transactionId)
        .orderBy(['transaction_milestones.default_order', 'transaction_checklist_items.due_date']);
      
      transaction.checklist_items = checklistItems;
      
      res.status(201).json({
        status: 'success',
        data: {
          transaction,
        },
      });
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update transaction
 * @route PUT /api/transactions/:id
 */
const updateTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      transaction_name,
      property_id,
      transaction_type,
      transaction_status_id,
      estimated_close_date,
      actual_close_date,
      price,
      commission_percentage,
      commission_amount,
      agent_user_id,
      notes,
    } = req.body;
    
    // Check if transaction exists
    const transaction = await db('transactions').where({ id }).first();
    if (!transaction) {
      return next(new ApiError(404, 'Transaction not found'));
    }
    
    // Check if property exists if changing
    if (property_id && property_id !== transaction.property_id) {
      const property = await db('properties').where({ id: property_id }).first();
      if (!property) {
        return next(new ApiError(404, 'Property not found'));
      }
    }
    
    // Update transaction
    await db('transactions')
      .where({ id })
      .update({
        ...(transaction_name !== undefined && { transaction_name }),
        ...(property_id !== undefined && { property_id }),
        ...(transaction_type !== undefined && { transaction_type }),
        ...(transaction_status_id !== undefined && { transaction_status_id }),
        ...(estimated_close_date !== undefined && { estimated_close_date }),
        ...(actual_close_date !== undefined && { actual_close_date }),
        ...(price !== undefined && { price }),
        ...(commission_percentage !== undefined && { commission_percentage }),
        ...(commission_amount !== undefined && { commission_amount }),
        ...(agent_user_id !== undefined && { agent_user_id }),
        ...(notes !== undefined && { notes }),
        updated_at: new Date(),
      });
    
    // Get updated transaction
    const updatedTransaction = await db('transactions')
      .join('properties', 'transactions.property_id', '=', 'properties.id')
      .join('transaction_statuses', 'transactions.transaction_status_id', '=', 'transaction_statuses.id')
      .join('users', 'transactions.agent_user_id', '=', 'users.id')
      .select(
        'transactions.id',
        'transactions.transaction_name',
        'transactions.property_id',
        'properties.address_street',
        'properties.address_city',
        'properties.address_state',
        'properties.address_zip',
        'transactions.transaction_type',
        'transactions.transaction_status_id',
        'transaction_statuses.status_name',
        'transactions.estimated_close_date',
        'transactions.actual_close_date',
        'transactions.price',
        'transactions.commission_percentage',
        'transactions.commission_amount',
        'transactions.agent_user_id',
        db.raw('CONCAT(users.first_name, \' \', users.last_name) as agent_name'),
        'transactions.notes',
        'transactions.created_at',
        'transactions.updated_at'
      )
      .where('transactions.id', id)
      .first();
    
    res.status(200).json({
      status: 'success',
      data: {
        transaction: updatedTransaction,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete transaction
 * @route DELETE /api/transactions/:id
 */
const deleteTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if transaction exists
    const transaction = await db('transactions').where({ id }).first();
    if (!transaction) {
      return next(new ApiError(404, 'Transaction not found'));
    }
    
    // Delete transaction
    await db('transactions').where({ id }).del();
    
    res.status(200).json({
      status: 'success',
      message: 'Transaction deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add contact to transaction
 * @route POST /api/transactions/:id/contacts
 */
const addContactToTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { contact_id, role, notes } = req.body;
    
    // Check if transaction exists
    const transaction = await db('transactions').where({ id }).first();
    if (!transaction) {
      return next(new ApiError(404, 'Transaction not found'));
    }
    
    // Check if contact exists
    const contact = await db('contacts').where({ id: contact_id }).first();
    if (!contact) {
      return next(new ApiError(404, 'Contact not found'));
    }
    
    // Check if contact is already associated with this transaction
    const existingContact = await db('transaction_contacts')
      .where({
        transaction_id: id,
        contact_id,
      })
      .first();
    
    if (existingContact) {
      return next(new ApiError(400, 'Contact is already associated with this transaction'));
    }
    
    // Add contact to transaction
    const [transactionContactId] = await db('transaction_contacts').insert({
      transaction_id: id,
      contact_id,
      role,
      notes,
    }).returning('id');
    
    // Get created transaction contact
    const transactionContact = await db('transaction_contacts')
      .join('contacts', 'transaction_contacts.contact_id', '=', 'contacts.id')
      .select(
        'transaction_contacts.id',
        'transaction_contacts.contact_id',
        'contacts.first_name',
        'contacts.last_name',
        'contacts.email',
        'contacts.phone_primary',
        'transaction_contacts.role',
        'transaction_contacts.notes'
      )
      .where('transaction_contacts.id', transactionContactId)
      .first();
    
    res.status(201).json({
      status: 'success',
      data: {
        transaction_contact: transactionContact,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove contact from transaction
 * @route DELETE /api/transactions/:id/contacts/:contactId
 */
const removeContactFromTransaction = async (req, res, next) => {
  try {
    const { id, contactId } = req.params;
    
    // Check if transaction exists
    const transaction = await db('transactions').where({ id }).first();
    if (!transaction) {
      return next(new ApiError(404, 'Transaction not found'));
    }
    
    // Check if transaction contact exists
    const transactionContact = await db('transaction_contacts')
      .where({
        transaction_id: id,
        contact_id: contactId,
      })
      .first();
    
    if (!transactionContact) {
      return next(new ApiError(404, 'Contact is not associated with this transaction'));
    }
    
    // Remove contact from transaction
    await db('transaction_contacts')
      .where({
        transaction_id: id,
        contact_id: contactId,
      })
      .del();
    
    res.status(200).json({
      status: 'success',
      message: 'Contact removed from transaction successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add checklist item to transaction
 * @route POST /api/transactions/:id/checklist
 */
const addChecklistItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { milestone_id, item_description, due_date, assigned_user_id, notes } = req.body;
    
    // Check if transaction exists
    const transaction = await db('transactions').where({ id }).first();
    if (!transaction) {
      return next(new ApiError(404, 'Transaction not found'));
    }
    
    // Check if milestone exists if provided
    if (milestone_id) {
      const milestone = await db('transaction_milestones').where({ id: milestone_id }).first();
      if (!milestone) {
        return next(new ApiError(404, 'Milestone not found'));
      }
    }
    
    // Add checklist item
    const [checklistItemId] = await db('transaction_checklist_items').insert({
      transaction_id: id,
      milestone_id,
      item_description,
      due_date,
      is_completed: false,
      assigned_user_id,
      notes,
    }).returning('id');
    
    // Get created checklist item
    const checklistItem = await db('transaction_checklist_items')
      .leftJoin('transaction_milestones', 'transaction_checklist_items.milestone_id', '=', 'transaction_milestones.id')
      .leftJoin('users', 'transaction_checklist_items.assigned_user_id', '=', 'users.id')
      .select(
        'transaction_checklist_items.id',
        'transaction_checklist_items.milestone_id',
        'transaction_milestones.milestone_name',
        'transaction_checklist_items.item_description',
        'transaction_checklist_items.due_date',
        'transaction_checklist_items.completed_date',
        'transaction_checklist_items.is_completed',
        'transaction_checklist_items.assigned_user_id',
        db.raw('CONCAT(users.first_name, \' \', users.last_name) as assigned_user_name'),
        'transaction_checklist_items.notes'
      )
      .where('transaction_checklist_items.id', checklistItemId)
      .first();
    
    res.status(201).json({
      status: 'success',
      data: {
        checklist_item: checklistItem,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update checklist item
 * @route PUT /api/transactions/:id/checklist/:itemId
 */
const updateChecklistItem = async (req, res, next) => {
  try {
    const { id, itemId } = req.params;
    const { milestone_id, item_description, due_date, is_completed, assigned_user_id, notes } = req.body;
    
    // Check if transaction exists
    const transaction = await db('transactions').where({ id }).first();
    if (!transaction) {
      return next(new ApiError(404, 'Transaction not found'));
    }
    
    // Check if checklist item exists
    const checklistItem = await db('transaction_checklist_items')
      .where({
        id: itemId,
        transaction_id: id,
      })
      .first();
    
    if (!checklistItem) {
      return next(new ApiError(404, 'Checklist item not found'));
    }
    
    // Check if milestone exists if provided
    if (milestone_id) {
      const milestone = await db('transaction_milestones').where({ id: milestone_id }).first();
      if (!milestone) {
        return next(new ApiError(404, 'Milestone not found'));
      }
    }
    
    // Update checklist item
    const updateData = {
      ...(milestone_id !== undefined && { milestone_id }),
      ...(item_description !== undefined && { item_description }),
      ...(due_date !== undefined && { due_date }),
      ...(assigned_user_id !== undefined && { assigned_user_id }),
      ...(notes !== undefined && { notes }),
    };
    
    // Handle completion status
    if (is_completed !== undefined) {
      updateData.is_completed = is_completed;
      
      // Set completed_date if completing the item
      if (is_completed && !checklistItem.is_completed) {
        updateData.completed_date = new Date();
      } else if (!is_completed && checklistItem.is_completed) {
        updateData.completed_date = null;
      }
    }
    
    await db('transaction_checklist_items')
      .where({
        id: itemId,
        transaction_id: id,
      })
      .update(updateData);
    
    // Get updated checklist item
    const updatedChecklistItem = await db('transaction_checklist_items')
      .leftJoin('transaction_milestones', 'transaction_checklist_items.milestone_id', '=', 'transaction_milestones.id')
      .leftJoin('users', 'transaction_checklist_items.assigned_user_id', '=', 'users.id')
      .select(
        'transaction_checklist_items.id',
        'transaction_checklist_items.milestone_id',
        'transaction_milestones.milestone_name',
        'transaction_checklist_items.item_description',
        'transaction_checklist_items.due_date',
        'transaction_checklist_items.completed_date',
        'transaction_checklist_items.is_completed',
        'transaction_checklist_items.assigned_user_id',
        db.raw('CONCAT(users.first_name, \' \', users.last_name) as assigned_user_name'),
        'transaction_checklist_items.notes'
      )
      .where('transaction_checklist_items.id', itemId)
      .first();
    
    res.status(200).json({
      status: 'success',
      data: {
        checklist_item: updatedChecklistItem,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete checklist item
 * @route DELETE /api/transactions/:id/checklist/:itemId
 */
const deleteChecklistItem = async (req, res, next) => {
  try {
    const { id, itemId } = req.params;
    
    // Check if transaction exists
    const transaction = await db('transactions').where({ id }).first();
    if (!transaction) {
      return next(new ApiError(404, 'Transaction not found'));
    }
    
    // Check if checklist item exists
    const checklistItem = await db('transaction_checklist_items')
      .where({
        id: itemId,
        transaction_id: id,
      })
      .first();
    
    if (!checklistItem) {
      return next(new ApiError(404, 'Checklist item not found'));
    }
    
    // Delete checklist item
    await db('transaction_checklist_items')
      .where({
        id: itemId,
        transaction_id: id,
      })
      .del();
    
    res.status(200).json({
      status: 'success',
      message: 'Checklist item deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get transaction statuses
 * @route GET /api/transactions/statuses
 */
const getTransactionStatuses = async (req, res, next) => {
  try {
    const statuses = await db('transaction_statuses')
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

/**
 * Get transaction milestones
 * @route GET /api/transactions/milestones
 */
const getTransactionMilestones = async (req, res, next) => {
  try {
    const { transaction_type } = req.query;
    
    let query = db('transaction_milestones').select('*');
    
    // Filter by transaction type if provided
    if (transaction_type) {
      query = query.where({ transaction_type });
    }
    
    const milestones = await query.orderBy(['transaction_type', 'default_order']);
    
    res.status(200).json({
      status: 'success',
      data: {
        milestones,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  addContactToTransaction,
  removeContactFromTransaction,
  addChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
  getTransactionStatuses,
  getTransactionMilestones,
};
