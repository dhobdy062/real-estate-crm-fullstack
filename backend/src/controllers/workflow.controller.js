const db = require('../db/connection');
const { ApiError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

/**
 * Get all workflows
 * @route GET /api/workflows
 */
const getWorkflows = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      sort_by = 'id',
      sort_dir = 'asc',
      trigger_entity,
      is_active,
      created_by_user_id,
    } = req.query;
    
    // Build query
    let query = db('workflows')
      .leftJoin('users', 'workflows.created_by_user_id', '=', 'users.id')
      .select(
        'workflows.id',
        'workflows.workflow_name',
        'workflows.trigger_entity',
        'workflows.trigger_condition',
        'workflows.description',
        'workflows.is_active',
        'workflows.created_by_user_id',
        db.raw('CONCAT(users.first_name, \' \', users.last_name) as created_by_user_name'),
        'workflows.created_at',
        'workflows.updated_at'
      );
    
    // Apply search filter
    if (search) {
      query = query.where((builder) => {
        builder.whereRaw('LOWER(workflows.workflow_name) LIKE ?', [`%${search.toLowerCase()}%`])
          .orWhereRaw('LOWER(workflows.description) LIKE ?', [`%${search.toLowerCase()}%`]);
      });
    }
    
    // Filter by trigger entity
    if (trigger_entity) {
      query = query.where('workflows.trigger_entity', trigger_entity);
    }
    
    // Filter by active status
    if (is_active !== undefined) {
      query = query.where('workflows.is_active', is_active === 'true');
    }
    
    // Filter by creator
    if (created_by_user_id) {
      query = query.where('workflows.created_by_user_id', created_by_user_id);
    }
    
    // Get total count
    const countQuery = query.clone();
    const [{ count }] = await countQuery.count('workflows.id as count');
    
    // Apply pagination and sorting
    query = query
      .orderBy(`workflows.${sort_by}`, sort_dir)
      .limit(limit)
      .offset((page - 1) * limit);
    
    // Execute query
    const workflows = await query;
    
    // Get step counts for each workflow
    const workflowIds = workflows.map(workflow => workflow.id);
    
    if (workflowIds.length > 0) {
      const stepCounts = await db('workflow_steps')
        .select('workflow_id')
        .count('id as step_count')
        .whereIn('workflow_id', workflowIds)
        .groupBy('workflow_id');
      
      // Create a map of workflow_id to step_count
      const stepCountMap = stepCounts.reduce((acc, item) => {
        acc[item.workflow_id] = parseInt(item.step_count);
        return acc;
      }, {});
      
      // Add step_count to each workflow
      workflows.forEach(workflow => {
        workflow.step_count = stepCountMap[workflow.id] || 0;
      });
    } else {
      workflows.forEach(workflow => {
        workflow.step_count = 0;
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        workflows,
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
 * Get workflow by ID
 * @route GET /api/workflows/:id
 */
const getWorkflowById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Get workflow
    const workflow = await db('workflows')
      .leftJoin('users', 'workflows.created_by_user_id', '=', 'users.id')
      .select(
        'workflows.id',
        'workflows.workflow_name',
        'workflows.trigger_entity',
        'workflows.trigger_condition',
        'workflows.description',
        'workflows.is_active',
        'workflows.created_by_user_id',
        db.raw('CONCAT(users.first_name, \' \', users.last_name) as created_by_user_name'),
        'workflows.created_at',
        'workflows.updated_at'
      )
      .where('workflows.id', id)
      .first();
    
    if (!workflow) {
      return next(new ApiError(404, 'Workflow not found'));
    }
    
    // Get workflow steps
    const steps = await db('workflow_steps')
      .select('*')
      .where('workflow_id', id)
      .orderBy('step_order', 'asc');
    
    workflow.steps = steps;
    
    res.status(200).json({
      status: 'success',
      data: {
        workflow,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new workflow
 * @route POST /api/workflows
 */
const createWorkflow = async (req, res, next) => {
  try {
    const {
      workflow_name,
      trigger_entity,
      trigger_condition,
      description,
      is_active,
      steps,
    } = req.body;
    
    // Start transaction
    await db.transaction(async (trx) => {
      // Create workflow
      const [workflowId] = await trx('workflows').insert({
        workflow_name,
        trigger_entity,
        trigger_condition,
        description,
        is_active: is_active !== undefined ? is_active : true,
        created_by_user_id: req.user.id,
        created_at: new Date(),
        updated_at: new Date(),
      }).returning('id');
      
      // Add steps if provided
      if (steps && steps.length > 0) {
        const stepEntries = steps.map((step, index) => ({
          workflow_id: workflowId,
          step_order: index + 1,
          action_type: step.action_type,
          action_details: step.action_details,
          delay_days: step.delay_days || 0,
          delay_hours: step.delay_hours || 0,
          step_name: step.step_name,
        }));
        
        await trx('workflow_steps').insert(stepEntries);
      }
      
      // Get created workflow
      const workflow = await trx('workflows')
        .leftJoin('users', 'workflows.created_by_user_id', '=', 'users.id')
        .select(
          'workflows.id',
          'workflows.workflow_name',
          'workflows.trigger_entity',
          'workflows.trigger_condition',
          'workflows.description',
          'workflows.is_active',
          'workflows.created_by_user_id',
          db.raw('CONCAT(users.first_name, \' \', users.last_name) as created_by_user_name'),
          'workflows.created_at',
          'workflows.updated_at'
        )
        .where('workflows.id', workflowId)
        .first();
      
      // Get workflow steps
      const workflowSteps = await trx('workflow_steps')
        .select('*')
        .where('workflow_id', workflowId)
        .orderBy('step_order', 'asc');
      
      workflow.steps = workflowSteps;
      
      res.status(201).json({
        status: 'success',
        data: {
          workflow,
        },
      });
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update workflow
 * @route PUT /api/workflows/:id
 */
const updateWorkflow = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      workflow_name,
      trigger_entity,
      trigger_condition,
      description,
      is_active,
    } = req.body;
    
    // Check if workflow exists
    const workflow = await db('workflows').where({ id }).first();
    if (!workflow) {
      return next(new ApiError(404, 'Workflow not found'));
    }
    
    // Update workflow
    await db('workflows')
      .where({ id })
      .update({
        ...(workflow_name !== undefined && { workflow_name }),
        ...(trigger_entity !== undefined && { trigger_entity }),
        ...(trigger_condition !== undefined && { trigger_condition }),
        ...(description !== undefined && { description }),
        ...(is_active !== undefined && { is_active }),
        updated_at: new Date(),
      });
    
    // Get updated workflow
    const updatedWorkflow = await db('workflows')
      .leftJoin('users', 'workflows.created_by_user_id', '=', 'users.id')
      .select(
        'workflows.id',
        'workflows.workflow_name',
        'workflows.trigger_entity',
        'workflows.trigger_condition',
        'workflows.description',
        'workflows.is_active',
        'workflows.created_by_user_id',
        db.raw('CONCAT(users.first_name, \' \', users.last_name) as created_by_user_name'),
        'workflows.created_at',
        'workflows.updated_at'
      )
      .where('workflows.id', id)
      .first();
    
    res.status(200).json({
      status: 'success',
      data: {
        workflow: updatedWorkflow,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete workflow
 * @route DELETE /api/workflows/:id
 */
const deleteWorkflow = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if workflow exists
    const workflow = await db('workflows').where({ id }).first();
    if (!workflow) {
      return next(new ApiError(404, 'Workflow not found'));
    }
    
    // Delete workflow (steps will be deleted via CASCADE)
    await db('workflows').where({ id }).del();
    
    res.status(200).json({
      status: 'success',
      message: 'Workflow deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get workflow steps
 * @route GET /api/workflows/:id/steps
 */
const getWorkflowSteps = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if workflow exists
    const workflow = await db('workflows').where({ id }).first();
    if (!workflow) {
      return next(new ApiError(404, 'Workflow not found'));
    }
    
    // Get workflow steps
    const steps = await db('workflow_steps')
      .select('*')
      .where('workflow_id', id)
      .orderBy('step_order', 'asc');
    
    res.status(200).json({
      status: 'success',
      data: {
        steps,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create workflow step
 * @route POST /api/workflows/:id/steps
 */
const createWorkflowStep = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      action_type,
      action_details,
      delay_days,
      delay_hours,
      step_name,
      step_order,
    } = req.body;
    
    // Check if workflow exists
    const workflow = await db('workflows').where({ id }).first();
    if (!workflow) {
      return next(new ApiError(404, 'Workflow not found'));
    }
    
    // Start transaction
    await db.transaction(async (trx) => {
      // Get max step order if not provided
      let newStepOrder = step_order;
      if (!newStepOrder) {
        const maxOrderResult = await trx('workflow_steps')
          .where('workflow_id', id)
          .max('step_order as max_order')
          .first();
        
        newStepOrder = (maxOrderResult.max_order || 0) + 1;
      } else {
        // If step_order is provided, shift existing steps to make room
        await trx('workflow_steps')
          .where('workflow_id', id)
          .where('step_order', '>=', newStepOrder)
          .increment('step_order', 1);
      }
      
      // Create step
      const [stepId] = await trx('workflow_steps').insert({
        workflow_id: id,
        step_order: newStepOrder,
        action_type,
        action_details,
        delay_days: delay_days || 0,
        delay_hours: delay_hours || 0,
        step_name,
      }).returning('id');
      
      // Get created step
      const step = await trx('workflow_steps')
        .select('*')
        .where('id', stepId)
        .first();
      
      res.status(201).json({
        status: 'success',
        data: {
          step,
        },
      });
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update workflow step
 * @route PUT /api/workflows/:id/steps/:stepId
 */
const updateWorkflowStep = async (req, res, next) => {
  try {
    const { id, stepId } = req.params;
    const {
      action_type,
      action_details,
      delay_days,
      delay_hours,
      step_name,
      step_order,
    } = req.body;
    
    // Check if workflow exists
    const workflow = await db('workflows').where({ id }).first();
    if (!workflow) {
      return next(new ApiError(404, 'Workflow not found'));
    }
    
    // Check if step exists
    const step = await db('workflow_steps')
      .where({
        id: stepId,
        workflow_id: id,
      })
      .first();
    
    if (!step) {
      return next(new ApiError(404, 'Workflow step not found'));
    }
    
    // Start transaction
    await db.transaction(async (trx) => {
      // Handle step reordering if needed
      if (step_order !== undefined && step_order !== step.step_order) {
        if (step_order > step.step_order) {
          // Moving down: decrement steps in between
          await trx('workflow_steps')
            .where('workflow_id', id)
            .where('step_order', '>', step.step_order)
            .where('step_order', '<=', step_order)
            .decrement('step_order', 1);
        } else {
          // Moving up: increment steps in between
          await trx('workflow_steps')
            .where('workflow_id', id)
            .where('step_order', '<', step.step_order)
            .where('step_order', '>=', step_order)
            .increment('step_order', 1);
        }
      }
      
      // Update step
      await trx('workflow_steps')
        .where({ id: stepId })
        .update({
          ...(action_type !== undefined && { action_type }),
          ...(action_details !== undefined && { action_details }),
          ...(delay_days !== undefined && { delay_days }),
          ...(delay_hours !== undefined && { delay_hours }),
          ...(step_name !== undefined && { step_name }),
          ...(step_order !== undefined && { step_order }),
        });
      
      // Get updated step
      const updatedStep = await trx('workflow_steps')
        .select('*')
        .where('id', stepId)
        .first();
      
      res.status(200).json({
        status: 'success',
        data: {
          step: updatedStep,
        },
      });
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete workflow step
 * @route DELETE /api/workflows/:id/steps/:stepId
 */
const deleteWorkflowStep = async (req, res, next) => {
  try {
    const { id, stepId } = req.params;
    
    // Check if workflow exists
    const workflow = await db('workflows').where({ id }).first();
    if (!workflow) {
      return next(new ApiError(404, 'Workflow not found'));
    }
    
    // Check if step exists
    const step = await db('workflow_steps')
      .where({
        id: stepId,
        workflow_id: id,
      })
      .first();
    
    if (!step) {
      return next(new ApiError(404, 'Workflow step not found'));
    }
    
    // Start transaction
    await db.transaction(async (trx) => {
      // Delete step
      await trx('workflow_steps').where({ id: stepId }).del();
      
      // Reorder remaining steps
      await trx('workflow_steps')
        .where('workflow_id', id)
        .where('step_order', '>', step.step_order)
        .decrement('step_order', 1);
      
      res.status(200).json({
        status: 'success',
        message: 'Workflow step deleted successfully',
      });
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reorder workflow steps
 * @route PUT /api/workflows/:id/steps/reorder
 */
const reorderWorkflowSteps = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { step_order } = req.body;
    
    // step_order should be an array of { id, order } objects
    if (!Array.isArray(step_order)) {
      return next(new ApiError(400, 'step_order must be an array'));
    }
    
    // Check if workflow exists
    const workflow = await db('workflows').where({ id }).first();
    if (!workflow) {
      return next(new ApiError(404, 'Workflow not found'));
    }
    
    // Start transaction
    await db.transaction(async (trx) => {
      // Update each step's order
      for (const item of step_order) {
        await trx('workflow_steps')
          .where({
            id: item.id,
            workflow_id: id,
          })
          .update({
            step_order: item.order,
          });
      }
      
      // Get updated steps
      const steps = await trx('workflow_steps')
        .select('*')
        .where('workflow_id', id)
        .orderBy('step_order', 'asc');
      
      res.status(200).json({
        status: 'success',
        data: {
          steps,
        },
      });
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Execute workflow manually
 * @route POST /api/workflows/:id/execute
 */
const executeWorkflow = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { entity_type, entity_id } = req.body;
    
    // Check if workflow exists
    const workflow = await db('workflows').where({ id }).first();
    if (!workflow) {
      return next(new ApiError(404, 'Workflow not found'));
    }
    
    // Validate entity type matches workflow trigger entity
    if (workflow.trigger_entity !== entity_type) {
      return next(new ApiError(400, `This workflow is designed for ${workflow.trigger_entity} entities, not ${entity_type}`));
    }
    
    // Check if entity exists
    let entity;
    switch (entity_type) {
      case 'Lead':
        entity = await db('leads').where({ id: entity_id }).first();
        break;
      case 'Contact':
        entity = await db('contacts').where({ id: entity_id }).first();
        break;
      case 'Transaction':
        entity = await db('transactions').where({ id: entity_id }).first();
        break;
      default:
        return next(new ApiError(400, `Unsupported entity type: ${entity_type}`));
    }
    
    if (!entity) {
      return next(new ApiError(404, `${entity_type} with ID ${entity_id} not found`));
    }
    
    // Get workflow steps
    const steps = await db('workflow_steps')
      .select('*')
      .where('workflow_id', id)
      .orderBy('step_order', 'asc');
    
    if (steps.length === 0) {
      return next(new ApiError(400, 'Workflow has no steps to execute'));
    }
    
    // Process immediate steps and schedule delayed steps
    const processedSteps = [];
    const scheduledSteps = [];
    
    for (const step of steps) {
      // Process step based on action type
      try {
        if (step.delay_days === 0 && step.delay_hours === 0) {
          // Execute immediate steps
          await executeWorkflowStep(step, entity_type, entity_id, req.user.id);
          processedSteps.push(step.id);
        } else {
          // Schedule delayed steps (in a real system, you would use a job queue)
          // For now, we'll just log that it would be scheduled
          const delayMs = (step.delay_days * 24 * 60 * 60 * 1000) + (step.delay_hours * 60 * 60 * 1000);
          const scheduledTime = new Date(Date.now() + delayMs);
          
          logger.info(`Scheduled workflow step ${step.id} for ${scheduledTime.toISOString()}`);
          scheduledSteps.push({
            step_id: step.id,
            scheduled_time: scheduledTime,
          });
        }
      } catch (error) {
        logger.error(`Error executing workflow step ${step.id}:`, error);
        // Continue with other steps even if one fails
      }
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Workflow execution initiated',
      data: {
        processed_steps: processedSteps,
        scheduled_steps: scheduledSteps,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Execute a single workflow step
 * @param {Object} step - The workflow step to execute
 * @param {string} entityType - The type of entity (Lead, Contact, Transaction)
 * @param {number} entityId - The ID of the entity
 * @param {number} userId - The ID of the user executing the workflow
 */
const executeWorkflowStep = async (step, entityType, entityId, userId) => {
  switch (step.action_type) {
    case 'Create Task':
      await createTaskFromWorkflow(step, entityType, entityId, userId);
      break;
    case 'Send Email':
      await createCommunicationFromWorkflow(step, entityType, entityId, userId, 'Email');
      break;
    case 'Send SMS':
      await createCommunicationFromWorkflow(step, entityType, entityId, userId, 'SMS');
      break;
    case 'Update Field':
      await updateEntityField(step, entityType, entityId);
      break;
    case 'Add Tag':
      await addTagToEntity(step, entityType, entityId);
      break;
    default:
      logger.warn(`Unsupported action type: ${step.action_type}`);
  }
};

/**
 * Create a task from a workflow step
 */
const createTaskFromWorkflow = async (step, entityType, entityId, userId) => {
  const actionDetails = step.action_details;
  
  if (!actionDetails || !actionDetails.task_title) {
    throw new Error('Task title is required in action_details');
  }
  
  // Calculate due date if specified
  let dueDate = null;
  if (actionDetails.due_days) {
    dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + actionDetails.due_days);
  }
  
  // Create task
  const taskData = {
    task_title: actionDetails.task_title,
    description: actionDetails.description || '',
    due_date: dueDate,
    status: 'Pending',
    priority: actionDetails.priority || 'Normal',
    assigned_user_id: actionDetails.assigned_user_id || userId,
    created_by_user_id: userId,
    workflow_step_id: step.id,
    created_at: new Date(),
    updated_at: new Date(),
  };
  
  // Add the appropriate related entity field
  switch (entityType) {
    case 'Lead':
      taskData.related_lead_id = entityId;
      break;
    case 'Contact':
      taskData.related_contact_id = entityId;
      break;
    case 'Transaction':
      taskData.related_transaction_id = entityId;
      break;
  }
  
  await db('tasks').insert(taskData);
};

/**
 * Create a communication from a workflow step
 */
const createCommunicationFromWorkflow = async (step, entityType, entityId, userId, communicationType) => {
  const actionDetails = step.action_details;
  
  if (!actionDetails) {
    throw new Error('Action details are required');
  }
  
  // Get template if specified
  let subject = actionDetails.subject || '';
  let messageContent = actionDetails.message_content || '';
  
  if (actionDetails.template_id) {
    const template = await db('communication_templates')
      .where({ id: actionDetails.template_id })
      .first();
    
    if (template) {
      subject = template.subject || subject;
      messageContent = template.body_content || messageContent;
    }
  }
  
  // Create communication data
  const communicationData = {
    communication_type: communicationType,
    direction: 'Outbound',
    status: 'Scheduled',
    subject,
    message_content: messageContent,
    timestamp: new Date(),
    user_id: userId,
    template_id: actionDetails.template_id,
    scheduled_time: new Date(),
  };
  
  // Add the appropriate related entity field
  switch (entityType) {
    case 'Lead':
      communicationData.lead_id = entityId;
      break;
    case 'Contact':
      communicationData.contact_id = entityId;
      break;
  }
  
  await db('communications').insert(communicationData);
};

/**
 * Update an entity field from a workflow step
 */
const updateEntityField = async (step, entityType, entityId) => {
  const actionDetails = step.action_details;
  
  if (!actionDetails || !actionDetails.field_name || actionDetails.field_value === undefined) {
    throw new Error('field_name and field_value are required in action_details');
  }
  
  const { field_name, field_value } = actionDetails;
  
  // Update the appropriate entity
  switch (entityType) {
    case 'Lead':
      await db('leads')
        .where({ id: entityId })
        .update({
          [field_name]: field_value,
          updated_at: new Date(),
        });
      break;
    case 'Contact':
      await db('contacts')
        .where({ id: entityId })
        .update({
          [field_name]: field_value,
          updated_at: new Date(),
        });
      break;
    case 'Transaction':
      await db('transactions')
        .where({ id: entityId })
        .update({
          [field_name]: field_value,
          updated_at: new Date(),
        });
      break;
  }
};

/**
 * Add a tag to an entity from a workflow step
 */
const addTagToEntity = async (step, entityType, entityId) => {
  const actionDetails = step.action_details;
  
  if (!actionDetails || !actionDetails.tag_id) {
    throw new Error('tag_id is required in action_details');
  }
  
  const { tag_id } = actionDetails;
  
  // Check if tag exists
  const tag = await db('tags').where({ id: tag_id }).first();
  if (!tag) {
    throw new Error(`Tag with ID ${tag_id} not found`);
  }
  
  // Add tag to the appropriate entity
  switch (entityType) {
    case 'Lead':
      // Check if tag is already applied
      const existingLeadTag = await db('lead_tags')
        .where({
          lead_id: entityId,
          tag_id,
        })
        .first();
      
      if (!existingLeadTag) {
        await db('lead_tags').insert({
          lead_id: entityId,
          tag_id,
        });
      }
      break;
    case 'Contact':
      // Check if tag is already applied
      const existingContactTag = await db('contact_tags')
        .where({
          contact_id: entityId,
          tag_id,
        })
        .first();
      
      if (!existingContactTag) {
        await db('contact_tags').insert({
          contact_id: entityId,
          tag_id,
        });
      }
      break;
  }
};

module.exports = {
  getWorkflows,
  getWorkflowById,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
  getWorkflowSteps,
  createWorkflowStep,
  updateWorkflowStep,
  deleteWorkflowStep,
  reorderWorkflowSteps,
  executeWorkflow,
};
