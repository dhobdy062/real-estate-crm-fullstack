const db = require('../db/connection');
const { ApiError } = require('../middleware/errorHandler');

/**
 * Chat with AI assistant
 * @route POST /api/assistant/chat
 */
const chatWithAssistant = async (req, res, next) => {
  const { message } = req.body;
  
  if (!message) {
    return next(new ApiError(400, 'Message is required'));
  }
  
  // Set headers for streaming response
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Transfer-Encoding', 'chunked');
  
  try {
    // Get user context
    const userId = req.user.id;
    
    // Here you would typically:
    // 1. Process the user's message
    // 2. Query relevant data based on the message
    // 3. Send the message to an AI service (like OpenAI)
    // 4. Stream the response back to the client
    
    // For demonstration, we'll simulate a streaming response
    const words = `I'm your AI assistant for the real estate CRM. I can help you with information about your contacts, leads, properties, transactions, and more. What specific data would you like to know about?`.split(' ');
    
    // Log the interaction
    await db('assistant_interactions').insert({
      user_id: userId,
      message,
      timestamp: new Date(),
    });
    
    // Simulate streaming response
    for (const word of words) {
      await new Promise(resolve => setTimeout(resolve, 50));
      res.write(word + ' ');
    }
    
    res.end();
  } catch (error) {
    console.error('Error in AI assistant:', error);
    res.write('Sorry, I encountered an error processing your request.');
    res.end();
  }
};

module.exports = {
  chatWithAssistant,
};