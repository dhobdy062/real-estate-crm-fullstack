const express = require('express');
const yup = require('yup');
const {
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
} = require('../controllers/workflow.controller');
const { protect, authorize } = require('../middleware/auth');
const { validate } = require('../utils/validation');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get all workflows
router.get('/', getWorkflows);

// Get workflow by ID
router.get('/:id', getWorkflowById);

// Create a new workflow
router.post('/', validate(yup.object({
  workflow_name: yup.string().required('Workflow name is required').max(150),
  trigger_entity: yup.string().required('Trigger entity is required').max(20),
  trigger_condition: yup.string().required('Trigger condition is required'),
  description: yup.string(),
  is_active: yup.boolean(),
  steps: yup.array().of(
    yup.object({
      action_type: yup.string().required('Action type is required').max(50),
      action_details: yup.object(),
      delay_days: yup.number().integer().min(0),
      delay_hours: yup.number().integer().min(0),
      step_name: yup.string().max(100),
    })
  ),
})), createWorkflow);

// Update workflow
router.put('/:id', validate(yup.object({
  workflow_name: yup.string().max(150),
  trigger_entity: yup.string().max(20),
  trigger_condition: yup.string(),
  description: yup.string(),
  is_active: yup.boolean(),
})), updateWorkflow);

// Delete workflow
router.delete('/:id', deleteWorkflow);

// Get workflow steps
router.get('/:id/steps', getWorkflowSteps);

// Create workflow step
router.post('/:id/steps', validate(yup.object({
  action_type: yup.string().required('Action type is required').max(50),
  action_details: yup.object(),
  delay_days: yup.number().integer().min(0),
  delay_hours: yup.number().integer().min(0),
  step_name: yup.string().max(100),
  step_order: yup.number().integer().min(1),
})), createWorkflowStep);

// Update workflow step
router.put('/:id/steps/:stepId', validate(yup.object({
  action_type: yup.string().max(50),
  action_details: yup.object(),
  delay_days: yup.number().integer().min(0),
  delay_hours: yup.number().integer().min(0),
  step_name: yup.string().max(100),
  step_order: yup.number().integer().min(1),
})), updateWorkflowStep);

// Delete workflow step
router.delete('/:id/steps/:stepId', deleteWorkflowStep);

// Reorder workflow steps
router.put('/:id/steps/reorder', validate(yup.object({
  step_order: yup.array().of(
    yup.object({
      id: yup.number().required('Step ID is required'),
      order: yup.number().required('Order is required').min(1),
    })
  ).required('Step order is required'),
})), reorderWorkflowSteps);

// Execute workflow manually
router.post('/:id/execute', validate(yup.object({
  entity_type: yup.string().required('Entity type is required').oneOf(['Lead', 'Contact', 'Transaction']),
  entity_id: yup.number().required('Entity ID is required').positive().integer(),
})), executeWorkflow);

module.exports = router;
