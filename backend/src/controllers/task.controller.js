const db = require('../db/connection');
const { ApiError } = require('../middleware/errorHandler');

/**
 * Get all tasks
 * @route GET /api/tasks
 */
const getTasks = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      sort_by = 'due_date',
      sort_dir = 'asc',
      status,
      priority,
      assigned_user_id,
      related_lead_id,
      related_contact_id,
      related_transaction_id,
      due_date_start,
      due_date_end,
    } = req.query;
    
    // Build query
    let query = db('tasks')
      .leftJoin('users as assigned', 'tasks.assigned_user_id', '=', 'assigned.id')
      .leftJoin('users as created', 'tasks.created_by_user_id', '=', 'created.id')
      .select(
        'tasks.id',
        'tasks.task_title',
        'tasks.description',
        'tasks.due_date',
        'tasks.status',
        'tasks.priority',
        'tasks.assigned_user_id',
        db.raw('CONCAT(assigned.first_name, \' \', assigned.last_name) as assigned_user_name'),
        'tasks.created_by_user_id',
        db.raw('CONCAT(created.first_name, \' \', created.last_name) as created_by_user_name'),
        'tasks.completed_at',
        'tasks.related_lead_id',
        'tasks.related_contact_id',
        'tasks.related_transaction_id',
        'tasks.workflow_step_id',
        'tasks.created_at',
        'tasks.updated_at'
      );
    
    // Apply search filter
    if (search) {
      query = query.where((builder) => {
        builder.whereRaw('LOWER(tasks.task_title) LIKE ?', [`%${search.toLowerCase()}%`])
          .orWhereRaw('LOWER(tasks.description) LIKE ?', [`%${search.toLowerCase()}%`]);
      });
    }
    
    // Filter by status
    if (status) {
      query = query.where('tasks.status', status);
    }
    
    // Filter by priority
    if (priority) {
      query = query.where('tasks.priority', priority);
    }
    
    // Filter by assigned user
    if (assigned_user_id) {
      query = query.where('tasks.assigned_user_id', assigned_user_id);
    } else {
      // Default to current user's tasks if no specific user is requested
      query = query.where('tasks.assigned_user_id', req.user.id);
    }
    
    // Filter by related entities
    if (related_lead_id) {
      query = query.where('tasks.related_lead_id', related_lead_id);
    }
    
    if (related_contact_id) {
      query = query.where('tasks.related_contact_id', related_contact_id);
    }
    
    if (related_transaction_id) {
      query = query.where('tasks.related_transaction_id', related_transaction_id);
    }
    
    // Filter by due date range
    if (due_date_start) {
      query = query.where('tasks.due_date', '>=', due_date_start);
    }
    
    if (due_date_end) {
      query = query.where('tasks.due_date', '<=', due_date_end);
    }
    
    // Get total count
    const countQuery = query.clone();
    const [{ count }] = await countQuery.count('tasks.id as count');
    
    // Apply pagination and sorting
    query = query
      .orderBy(`tasks.${sort_by}`, sort_dir)
      .limit(limit)
      .offset((page - 1) * limit);
    
    // Execute query
    const tasks = await query;
    
    // Get related entity details for each task
    for (const task of tasks) {
      if (task.related_lead_id) {
        const lead = await db('leads')
          .select('id', 'first_name', 'last_name', 'email')
          .where('id', task.related_lead_id)
          .first();
        
        task.related_lead = lead;
      }
      
      if (task.related_contact_id) {
        const contact = await db('contacts')
          .select('id', 'first_name', 'last_name', 'email')
          .where('id', task.related_contact_id)
          .first();
        
        task.related_contact = contact;
      }
      
      if (task.related_transaction_id) {
        const transaction = await db('transactions')
          .join('properties', 'transactions.property_id', '=', 'properties.id')
          .select(
            'transactions.id',
            'transactions.transaction_name',
            'properties.address_street',
            'properties.address_city',
            'properties.address_state'
          )
          .where('transactions.id', task.related_transaction_id)
          .first();
        
        task.related_transaction = transaction;
      }
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        tasks,
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
 * Get task by ID
 * @route GET /api/tasks/:id
 */
const getTaskById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Get task
    const task = await db('tasks')
      .leftJoin('users as assigned', 'tasks.assigned_user_id', '=', 'assigned.id')
      .leftJoin('users as created', 'tasks.created_by_user_id', '=', 'created.id')
      .select(
        'tasks.id',
        'tasks.task_title',
        'tasks.description',
        'tasks.due_date',
        'tasks.status',
        'tasks.priority',
        'tasks.assigned_user_id',
        db.raw('CONCAT(assigned.first_name, \' \', assigned.last_name) as assigned_user_name'),
        'tasks.created_by_user_id',
        db.raw('CONCAT(created.first_name, \' \', created.last_name) as created_by_user_name'),
        'tasks.completed_at',
        'tasks.related_lead_id',
        'tasks.related_contact_id',
        'tasks.related_transaction_id',
        'tasks.workflow_step_id',
        'tasks.created_at',
        'tasks.updated_at'
      )
      .where('tasks.id', id)
      .first();
    
    if (!task) {
      return next(new ApiError(404, 'Task not found'));
    }
    
    // Get related entity details
    if (task.related_lead_id) {
      const lead = await db('leads')
        .select('id', 'first_name', 'last_name', 'email', 'phone_number')
        .where('id', task.related_lead_id)
        .first();
      
      task.related_lead = lead;
    }
    
    if (task.related_contact_id) {
      const contact = await db('contacts')
        .select('id', 'first_name', 'last_name', 'email', 'phone_primary')
        .where('id', task.related_contact_id)
        .first();
      
      task.related_contact = contact;
    }
    
    if (task.related_transaction_id) {
      const transaction = await db('transactions')
        .join('properties', 'transactions.property_id', '=', 'properties.id')
        .join('transaction_statuses', 'transactions.transaction_status_id', '=', 'transaction_statuses.id')
        .select(
          'transactions.id',
          'transactions.transaction_name',
          'transactions.transaction_type',
          'transaction_statuses.status_name',
          'properties.address_street',
          'properties.address_city',
          'properties.address_state',
          'properties.address_zip'
        )
        .where('transactions.id', task.related_transaction_id)
        .first();
      
      task.related_transaction = transaction;
    }
    
    if (task.workflow_step_id) {
      const workflowStep = await db('workflow_steps')
        .join('workflows', 'workflow_steps.workflow_id', '=', 'workflows.id')
        .select(
          'workflow_steps.id',
          'workflow_steps.step_name',
          'workflows.id as workflow_id',
          'workflows.workflow_name'
        )
        .where('workflow_steps.id', task.workflow_step_id)
        .first();
      
      task.workflow_step = workflowStep;
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        task,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new task
 * @route POST /api/tasks
 */
const createTask = async (req, res, next) => {
  try {
    const {
      task_title,
      description,
      due_date,
      status,
      priority,
      assigned_user_id,
      related_lead_id,
      related_contact_id,
      related_transaction_id,
    } = req.body;
    
    // Create task
    const [taskId] = await db('tasks').insert({
      task_title,
      description,
      due_date,
      status: status || 'Pending',
      priority: priority || 'Normal',
      assigned_user_id: assigned_user_id || req.user.id,
      created_by_user_id: req.user.id,
      related_lead_id,
      related_contact_id,
      related_transaction_id,
      created_at: new Date(),
      updated_at: new Date(),
    }).returning('id');
    
    // Get created task
    const task = await db('tasks')
      .leftJoin('users as assigned', 'tasks.assigned_user_id', '=', 'assigned.id')
      .leftJoin('users as created', 'tasks.created_by_user_id', '=', 'created.id')
      .select(
        'tasks.id',
        'tasks.task_title',
        'tasks.description',
        'tasks.due_date',
        'tasks.status',
        'tasks.priority',
        'tasks.assigned_user_id',
        db.raw('CONCAT(assigned.first_name, \' \', assigned.last_name) as assigned_user_name'),
        'tasks.created_by_user_id',
        db.raw('CONCAT(created.first_name, \' \', created.last_name) as created_by_user_name'),
        'tasks.related_lead_id',
        'tasks.related_contact_id',
        'tasks.related_transaction_id',
        'tasks.created_at',
        'tasks.updated_at'
      )
      .where('tasks.id', taskId)
      .first();
    
    res.status(201).json({
      status: 'success',
      data: {
        task,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update task
 * @route PUT /api/tasks/:id
 */
const updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      task_title,
      description,
      due_date,
      status,
      priority,
      assigned_user_id,
      completed_at,
    } = req.body;
    
    // Check if task exists
    const task = await db('tasks').where({ id }).first();
    if (!task) {
      return next(new ApiError(404, 'Task not found'));
    }
    
    // Update task
    const updateData = {
      ...(task_title !== undefined && { task_title }),
      ...(description !== undefined && { description }),
      ...(due_date !== undefined && { due_date }),
      ...(status !== undefined && { status }),
      ...(priority !== undefined && { priority }),
      ...(assigned_user_id !== undefined && { assigned_user_id }),
      updated_at: new Date(),
    };
    
    // Handle completion status
    if (status === 'Completed' && task.status !== 'Completed') {
      updateData.completed_at = new Date();
    } else if (status !== 'Completed' && task.status === 'Completed') {
      updateData.completed_at = null;
    } else if (completed_at !== undefined) {
      updateData.completed_at = completed_at;
      if (completed_at && task.status !== 'Completed') {
        updateData.status = 'Completed';
      } else if (!completed_at && task.status === 'Completed') {
        updateData.status = 'Pending';
      }
    }
    
    await db('tasks').where({ id }).update(updateData);
    
    // Get updated task
    const updatedTask = await db('tasks')
      .leftJoin('users as assigned', 'tasks.assigned_user_id', '=', 'assigned.id')
      .leftJoin('users as created', 'tasks.created_by_user_id', '=', 'created.id')
      .select(
        'tasks.id',
        'tasks.task_title',
        'tasks.description',
        'tasks.due_date',
        'tasks.status',
        'tasks.priority',
        'tasks.assigned_user_id',
        db.raw('CONCAT(assigned.first_name, \' \', assigned.last_name) as assigned_user_name'),
        'tasks.created_by_user_id',
        db.raw('CONCAT(created.first_name, \' \', created.last_name) as created_by_user_name'),
        'tasks.completed_at',
        'tasks.related_lead_id',
        'tasks.related_contact_id',
        'tasks.related_transaction_id',
        'tasks.workflow_step_id',
        'tasks.created_at',
        'tasks.updated_at'
      )
      .where('tasks.id', id)
      .first();
    
    res.status(200).json({
      status: 'success',
      data: {
        task: updatedTask,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete task
 * @route DELETE /api/tasks/:id
 */
const deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if task exists
    const task = await db('tasks').where({ id }).first();
    if (!task) {
      return next(new ApiError(404, 'Task not found'));
    }
    
    // Delete task
    await db('tasks').where({ id }).del();
    
    res.status(200).json({
      status: 'success',
      message: 'Task deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
};
