const db = require('../db/connection');
const { ApiError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

/**
 * Global search across multiple entities
 * @route GET /api/search
 */
const globalSearch = async (req, res, next) => {
  try {
    const {
      query,
      entities = 'all',
      page = 1,
      limit = 20,
    } = req.query;
    
    // Validate query parameter
    if (!query || query.trim().length < 2) {
      return next(new ApiError(400, 'Search query must be at least 2 characters'));
    }
    
    // Parse entities to search
    const entitiesToSearch = entities === 'all'
      ? ['contacts', 'leads', 'properties', 'transactions', 'tasks', 'communications']
      : entities.split(',');
    
    // Initialize results object
    const results = {};
    let totalResults = 0;
    
    // Search contacts
    if (entitiesToSearch.includes('contacts')) {
      const contacts = await searchContacts(query, page, limit);
      results.contacts = contacts.data;
      totalResults += contacts.total;
    }
    
    // Search leads
    if (entitiesToSearch.includes('leads')) {
      const leads = await searchLeads(query, page, limit);
      results.leads = leads.data;
      totalResults += leads.total;
    }
    
    // Search properties
    if (entitiesToSearch.includes('properties')) {
      const properties = await searchProperties(query, page, limit);
      results.properties = properties.data;
      totalResults += properties.total;
    }
    
    // Search transactions
    if (entitiesToSearch.includes('transactions')) {
      const transactions = await searchTransactions(query, page, limit);
      results.transactions = transactions.data;
      totalResults += transactions.total;
    }
    
    // Search tasks
    if (entitiesToSearch.includes('tasks')) {
      const tasks = await searchTasks(query, page, limit);
      results.tasks = tasks.data;
      totalResults += tasks.total;
    }
    
    // Search communications
    if (entitiesToSearch.includes('communications')) {
      const communications = await searchCommunications(query, page, limit);
      results.communications = communications.data;
      totalResults += communications.total;
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        query,
        total_results: totalResults,
        results,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Search contacts
 * @param {string} query - Search query
 * @param {number} page - Page number
 * @param {number} limit - Results per page
 * @returns {Object} Search results
 */
const searchContacts = async (query, page, limit) => {
  const searchQuery = `%${query.toLowerCase()}%`;
  
  // Build query
  let dbQuery = db('contacts')
    .leftJoin('users', 'contacts.owner_user_id', '=', 'users.id')
    .select(
      'contacts.id',
      'contacts.first_name',
      'contacts.last_name',
      'contacts.email',
      'contacts.phone_primary',
      'contacts.address_street',
      'contacts.address_city',
      'contacts.address_state',
      'contacts.address_zip',
      'contacts.owner_user_id',
      db.raw('CONCAT(users.first_name, \' \', users.last_name) as owner_name')
    )
    .where((builder) => {
      builder.whereRaw('LOWER(contacts.first_name) LIKE ?', [searchQuery])
        .orWhereRaw('LOWER(contacts.last_name) LIKE ?', [searchQuery])
        .orWhereRaw('LOWER(contacts.email) LIKE ?', [searchQuery])
        .orWhereRaw('contacts.phone_primary LIKE ?', [searchQuery])
        .orWhereRaw('LOWER(contacts.address_street) LIKE ?', [searchQuery])
        .orWhereRaw('LOWER(contacts.address_city) LIKE ?', [searchQuery])
        .orWhereRaw('LOWER(contacts.address_state) LIKE ?', [searchQuery])
        .orWhereRaw('contacts.address_zip LIKE ?', [searchQuery]);
    });
  
  // Get total count
  const countQuery = dbQuery.clone();
  const [{ count }] = await countQuery.count('contacts.id as count');
  
  // Apply pagination
  dbQuery = dbQuery
    .orderBy('contacts.last_name', 'asc')
    .orderBy('contacts.first_name', 'asc')
    .limit(limit)
    .offset((page - 1) * limit);
  
  // Execute query
  const contacts = await dbQuery;
  
  // Add entity_type for frontend display
  contacts.forEach(contact => {
    contact.entity_type = 'Contact';
    contact.display_name = `${contact.first_name} ${contact.last_name}`;
  });
  
  return {
    total: parseInt(count),
    data: contacts,
  };
};

/**
 * Search leads
 * @param {string} query - Search query
 * @param {number} page - Page number
 * @param {number} limit - Results per page
 * @returns {Object} Search results
 */
const searchLeads = async (query, page, limit) => {
  const searchQuery = `%${query.toLowerCase()}%`;
  
  // Build query
  let dbQuery = db('leads')
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
      'leads.assigned_user_id',
      db.raw('CONCAT(users.first_name, \' \', users.last_name) as assigned_user_name')
    )
    .where((builder) => {
      builder.whereRaw('LOWER(leads.first_name) LIKE ?', [searchQuery])
        .orWhereRaw('LOWER(leads.last_name) LIKE ?', [searchQuery])
        .orWhereRaw('LOWER(leads.email) LIKE ?', [searchQuery])
        .orWhereRaw('leads.phone_number LIKE ?', [searchQuery])
        .orWhereRaw('LOWER(leads.inquiry_details) LIKE ?', [searchQuery]);
    });
  
  // Get total count
  const countQuery = dbQuery.clone();
  const [{ count }] = await countQuery.count('leads.id as count');
  
  // Apply pagination
  dbQuery = dbQuery
    .orderBy('leads.created_at', 'desc')
    .limit(limit)
    .offset((page - 1) * limit);
  
  // Execute query
  const leads = await dbQuery;
  
  // Add entity_type for frontend display
  leads.forEach(lead => {
    lead.entity_type = 'Lead';
    lead.display_name = `${lead.first_name} ${lead.last_name}`;
  });
  
  return {
    total: parseInt(count),
    data: leads,
  };
};

/**
 * Search properties
 * @param {string} query - Search query
 * @param {number} page - Page number
 * @param {number} limit - Results per page
 * @returns {Object} Search results
 */
const searchProperties = async (query, page, limit) => {
  const searchQuery = `%${query.toLowerCase()}%`;
  
  // Build query
  let dbQuery = db('properties')
    .select(
      'properties.id',
      'properties.address_street',
      'properties.address_city',
      'properties.address_state',
      'properties.address_zip',
      'properties.property_type',
      'properties.bedrooms',
      'properties.bathrooms',
      'properties.square_footage',
      'properties.listing_status',
      'properties.mls_number'
    )
    .where((builder) => {
      builder.whereRaw('LOWER(properties.address_street) LIKE ?', [searchQuery])
        .orWhereRaw('LOWER(properties.address_city) LIKE ?', [searchQuery])
        .orWhereRaw('LOWER(properties.address_state) LIKE ?', [searchQuery])
        .orWhereRaw('properties.address_zip LIKE ?', [searchQuery])
        .orWhereRaw('properties.mls_number LIKE ?', [searchQuery])
        .orWhereRaw('LOWER(properties.property_type) LIKE ?', [searchQuery])
        .orWhereRaw('LOWER(properties.listing_status) LIKE ?', [searchQuery]);
    });
  
  // Get total count
  const countQuery = dbQuery.clone();
  const [{ count }] = await countQuery.count('properties.id as count');
  
  // Apply pagination
  dbQuery = dbQuery
    .orderBy('properties.address_street', 'asc')
    .limit(limit)
    .offset((page - 1) * limit);
  
  // Execute query
  const properties = await dbQuery;
  
  // Add entity_type for frontend display
  properties.forEach(property => {
    property.entity_type = 'Property';
    property.display_name = `${property.address_street}, ${property.address_city}, ${property.address_state} ${property.address_zip}`;
  });
  
  return {
    total: parseInt(count),
    data: properties,
  };
};

/**
 * Search transactions
 * @param {string} query - Search query
 * @param {number} page - Page number
 * @param {number} limit - Results per page
 * @returns {Object} Search results
 */
const searchTransactions = async (query, page, limit) => {
  const searchQuery = `%${query.toLowerCase()}%`;
  
  // Build query
  let dbQuery = db('transactions')
    .join('properties', 'transactions.property_id', '=', 'properties.id')
    .join('transaction_statuses', 'transactions.transaction_status_id', '=', 'transaction_statuses.id')
    .join('users', 'transactions.agent_user_id', '=', 'users.id')
    .select(
      'transactions.id',
      'transactions.transaction_name',
      'transactions.transaction_type',
      'transactions.transaction_status_id',
      'transaction_statuses.status_name',
      'transactions.property_id',
      'properties.address_street',
      'properties.address_city',
      'properties.address_state',
      'properties.address_zip',
      'transactions.price',
      'transactions.agent_user_id',
      db.raw('CONCAT(users.first_name, \' \', users.last_name) as agent_name')
    )
    .where((builder) => {
      builder.whereRaw('LOWER(transactions.transaction_name) LIKE ?', [searchQuery])
        .orWhereRaw('LOWER(properties.address_street) LIKE ?', [searchQuery])
        .orWhereRaw('LOWER(properties.address_city) LIKE ?', [searchQuery])
        .orWhereRaw('LOWER(properties.address_state) LIKE ?', [searchQuery])
        .orWhereRaw('properties.address_zip LIKE ?', [searchQuery])
        .orWhereRaw('LOWER(transactions.transaction_type) LIKE ?', [searchQuery])
        .orWhereRaw('LOWER(transaction_statuses.status_name) LIKE ?', [searchQuery]);
    });
  
  // Get total count
  const countQuery = dbQuery.clone();
  const [{ count }] = await countQuery.count('transactions.id as count');
  
  // Apply pagination
  dbQuery = dbQuery
    .orderBy('transactions.created_at', 'desc')
    .limit(limit)
    .offset((page - 1) * limit);
  
  // Execute query
  const transactions = await dbQuery;
  
  // Add entity_type for frontend display
  transactions.forEach(transaction => {
    transaction.entity_type = 'Transaction';
    transaction.display_name = transaction.transaction_name || 
      `${transaction.address_street}, ${transaction.address_city} (${transaction.transaction_type})`;
  });
  
  return {
    total: parseInt(count),
    data: transactions,
  };
};

/**
 * Search tasks
 * @param {string} query - Search query
 * @param {number} page - Page number
 * @param {number} limit - Results per page
 * @returns {Object} Search results
 */
const searchTasks = async (query, page, limit) => {
  const searchQuery = `%${query.toLowerCase()}%`;
  
  // Build query
  let dbQuery = db('tasks')
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
      'tasks.related_lead_id',
      'tasks.related_contact_id',
      'tasks.related_transaction_id'
    )
    .where((builder) => {
      builder.whereRaw('LOWER(tasks.task_title) LIKE ?', [searchQuery])
        .orWhereRaw('LOWER(tasks.description) LIKE ?', [searchQuery]);
    });
  
  // Get total count
  const countQuery = dbQuery.clone();
  const [{ count }] = await countQuery.count('tasks.id as count');
  
  // Apply pagination
  dbQuery = dbQuery
    .orderBy('tasks.due_date', 'asc')
    .limit(limit)
    .offset((page - 1) * limit);
  
  // Execute query
  const tasks = await dbQuery;
  
  // Add entity_type for frontend display
  tasks.forEach(task => {
    task.entity_type = 'Task';
    task.display_name = task.task_title;
  });
  
  return {
    total: parseInt(count),
    data: tasks,
  };
};

/**
 * Search communications
 * @param {string} query - Search query
 * @param {number} page - Page number
 * @param {number} limit - Results per page
 * @returns {Object} Search results
 */
const searchCommunications = async (query, page, limit) => {
  const searchQuery = `%${query.toLowerCase()}%`;
  
  // Build query
  let dbQuery = db('communications')
    .leftJoin('users', 'communications.user_id', '=', 'users.id')
    .leftJoin('leads', 'communications.lead_id', '=', 'leads.id')
    .leftJoin('contacts', 'communications.contact_id', '=', 'contacts.id')
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
      db.raw('CONCAT(users.first_name, \' \', users.last_name) as user_name')
    )
    .where((builder) => {
      builder.whereRaw('LOWER(communications.subject) LIKE ?', [searchQuery])
        .orWhereRaw('LOWER(communications.message_content) LIKE ?', [searchQuery]);
    });
  
  // Get total count
  const countQuery = dbQuery.clone();
  const [{ count }] = await countQuery.count('communications.id as count');
  
  // Apply pagination
  dbQuery = dbQuery
    .orderBy('communications.timestamp', 'desc')
    .limit(limit)
    .offset((page - 1) * limit);
  
  // Execute query
  const communications = await dbQuery;
  
  // Add entity_type for frontend display
  communications.forEach(communication => {
    communication.entity_type = 'Communication';
    communication.display_name = communication.subject || 
      `${communication.communication_type} (${new Date(communication.timestamp).toLocaleDateString()})`;
  });
  
  return {
    total: parseInt(count),
    data: communications,
  };
};

/**
 * Search a specific entity type
 * @route GET /api/search/:entity
 */
const searchEntity = async (req, res, next) => {
  try {
    const { entity } = req.params;
    const {
      query,
      page = 1,
      limit = 20,
    } = req.query;
    
    // Validate query parameter
    if (!query || query.trim().length < 2) {
      return next(new ApiError(400, 'Search query must be at least 2 characters'));
    }
    
    let results;
    let total;
    
    // Search the specified entity
    switch (entity) {
      case 'contacts':
        ({ total, data: results } = await searchContacts(query, page, limit));
        break;
      
      case 'leads':
        ({ total, data: results } = await searchLeads(query, page, limit));
        break;
      
      case 'properties':
        ({ total, data: results } = await searchProperties(query, page, limit));
        break;
      
      case 'transactions':
        ({ total, data: results } = await searchTransactions(query, page, limit));
        break;
      
      case 'tasks':
        ({ total, data: results } = await searchTasks(query, page, limit));
        break;
      
      case 'communications':
        ({ total, data: results } = await searchCommunications(query, page, limit));
        break;
      
      default:
        return next(new ApiError(400, `Invalid entity type: ${entity}`));
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        query,
        entity,
        total,
        results,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get search suggestions as user types
 * @route GET /api/search/suggestions
 */
const getSearchSuggestions = async (req, res, next) => {
  try {
    const { query, limit = 10 } = req.query;
    
    // Validate query parameter
    if (!query || query.trim().length < 2) {
      return next(new ApiError(400, 'Search query must be at least 2 characters'));
    }
    
    const searchQuery = `%${query.toLowerCase()}%`;
    const suggestions = [];
    
    // Get contact suggestions
    const contacts = await db('contacts')
      .select(
        'id',
        'first_name',
        'last_name',
        'email'
      )
      .where((builder) => {
        builder.whereRaw('LOWER(first_name) LIKE ?', [searchQuery])
          .orWhereRaw('LOWER(last_name) LIKE ?', [searchQuery])
          .orWhereRaw('LOWER(email) LIKE ?', [searchQuery]);
      })
      .limit(limit / 3);
    
    contacts.forEach(contact => {
      suggestions.push({
        id: contact.id,
        text: `${contact.first_name} ${contact.last_name}`,
        subtext: contact.email || '',
        entity_type: 'Contact',
        url: `/contacts/${contact.id}`,
      });
    });
    
    // Get property suggestions
    const properties = await db('properties')
      .select(
        'id',
        'address_street',
        'address_city',
        'address_state',
        'address_zip'
      )
      .where((builder) => {
        builder.whereRaw('LOWER(address_street) LIKE ?', [searchQuery])
          .orWhereRaw('LOWER(address_city) LIKE ?', [searchQuery])
          .orWhereRaw('address_zip LIKE ?', [searchQuery]);
      })
      .limit(limit / 3);
    
    properties.forEach(property => {
      suggestions.push({
        id: property.id,
        text: `${property.address_street}`,
        subtext: `${property.address_city}, ${property.address_state} ${property.address_zip}`,
        entity_type: 'Property',
        url: `/properties/${property.id}`,
      });
    });
    
    // Get lead suggestions
    const leads = await db('leads')
      .select(
        'id',
        'first_name',
        'last_name',
        'email'
      )
      .where((builder) => {
        builder.whereRaw('LOWER(first_name) LIKE ?', [searchQuery])
          .orWhereRaw('LOWER(last_name) LIKE ?', [searchQuery])
          .orWhereRaw('LOWER(email) LIKE ?', [searchQuery]);
      })
      .limit(limit / 3);
    
    leads.forEach(lead => {
      suggestions.push({
        id: lead.id,
        text: `${lead.first_name} ${lead.last_name}`,
        subtext: lead.email || 'Lead',
        entity_type: 'Lead',
        url: `/leads/${lead.id}`,
      });
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        query,
        suggestions,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  globalSearch,
  searchEntity,
  getSearchSuggestions,
};
