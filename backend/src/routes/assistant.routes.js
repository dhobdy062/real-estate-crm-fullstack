const express = require('express');
const { chatWithAssistant } = require('../controllers/assistant.controller');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Chat endpoint
router.post('/chat', chatWithAssistant);

module.exports = router;