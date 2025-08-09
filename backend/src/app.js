// Add this with your other route imports
const assistantRoutes = require('./routes/assistant.routes');

// Add this with your other app.use statements
app.use('/api/assistant', assistantRoutes);