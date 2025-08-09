const express = require('express');
const yup = require('yup');
const {
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
} = require('../controllers/transaction.controller');
const { protect } = require('../middleware/auth');
const { validate, schemas } = require('../utils/validation');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get transaction statuses
router.get('/statuses', getTransactionStatuses);

// Get transaction milestones
router.get('/milestones', getTransactionMilestones);

// Get all transactions
router.get('/', validate(schemas.pagination, 'query'), getTransactions);

// Get transaction by ID
router.get('/:id', getTransactionById);

// Create a new transaction
router.post('/', validate(schemas.transactionCreate), createTransaction);

// Update transaction
router.put('/:id', validate(schemas.transactionUpdate), updateTransaction);

// Delete transaction
router.delete('/:id', deleteTransaction);

// Add contact to transaction
router.post('/:id/contacts', validate(yup.object({
  contact_id: yup.number().required('Contact ID is required').positive().integer(),
  role: yup.string().required('Role is required').max(50),
  notes: yup.string(),
})), addContactToTransaction);

// Remove contact from transaction
router.delete('/:id/contacts/:contactId', removeContactFromTransaction);

// Add checklist item to transaction
router.post('/:id/checklist', validate(yup.object({
  milestone_id: yup.number().positive().integer(),
  item_description: yup.string().required('Item description is required').max(255),
  due_date: yup.date(),
  assigned_user_id: yup.number().positive().integer(),
  notes: yup.string(),
})), addChecklistItem);

// Update checklist item
router.put('/:id/checklist/:itemId', validate(yup.object({
  milestone_id: yup.number().positive().integer(),
  item_description: yup.string().max(255),
  due_date: yup.date(),
  is_completed: yup.boolean(),
  assigned_user_id: yup.number().positive().integer(),
  notes: yup.string(),
})), updateChecklistItem);

// Delete checklist item
router.delete('/:id/checklist/:itemId', deleteChecklistItem);

module.exports = router;
