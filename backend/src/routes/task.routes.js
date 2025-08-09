const express = require('express');
const {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
} = require('../controllers/task.controller');
const { protect } = require('../middleware/auth');
const { validate, schemas } = require('../utils/validation');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get all tasks
router.get('/', validate(schemas.pagination, 'query'), getTasks);

// Get task by ID
router.get('/:id', getTaskById);

// Create a new task
router.post('/', validate(schemas.taskCreate), createTask);

// Update task
router.put('/:id', validate(schemas.taskUpdate), updateTask);

// Delete task
router.delete('/:id', deleteTask);

module.exports = router;
