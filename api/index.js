// Vercel serverless function wrapper for Express backend
import serverless from 'serverless-http';

console.log('🔄 Starting serverless function initialization...');
console.log('📦 Importing backend server...');

let app;
try {
  // Import the Express app from backend (synchronous import)
  const serverModule = await import('../backend/server.js');
  console.log('✅ Backend server module imported');
  console.log('Module exports:', Object.keys(serverModule));
  
  app = serverModule.default;
  
  if (!app) {
    throw new Error('Express app not found in server module. Available exports: ' + Object.keys(serverModule).join(', '));
  }
  
  console.log('✅ Express app found');
} catch (error) {
  console.error('❌ Failed to import backend server');
  console.error('Error message:', error.message);
  console.error('Error code:', error.code);
  console.error('Error stack:', error.stack);
  
  // Create a minimal error app
  const express = (await import('express')).default;
  app = express();
  app.use((req, res) => {
    res.status(500).json({
      error: 'Server initialization failed',
      message: error.message,
      code: error.code,
      hint: 'Check Vercel function logs for details'
    });
  });
}

console.log('✅ Creating serverless handler...');
const handler = serverless(app);
console.log('✅ Serverless function initialized successfully');

export default handler;
