// Vercel serverless function wrapper for Express backend
import serverless from 'serverless-http';
import app from '../backend/server.js';

// Export the serverless handler
// The app is exported as default from backend/server.js
export default serverless(app);
