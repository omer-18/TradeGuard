// Vercel serverless function - Express integration
// Vercel provides Node.js req/res objects that Express can use directly

let app = null;
let initError = null;

async function getApp() {
  if (app) return app;
  if (initError) throw initError;
  
  try {
    console.log('🔄 Initializing Express app...');
    
    // Set VERCEL env var so backend knows it's in serverless mode
    process.env.VERCEL = '1';
    
    const serverModule = await import('../backend/server.js');
    app = serverModule.default;
    
    if (!app) {
      throw new Error('Express app not exported from backend/server.js');
    }
    
    console.log('✅ Express app initialized successfully');
    return app;
  } catch (error) {
    console.error('❌ Failed to initialize Express app:', error);
    console.error('Error stack:', error.stack);
    initError = error;
    throw error;
  }
}

// Vercel handler - receives Node.js req/res objects
export default async function handler(req, res) {
  try {
    const expressApp = await getApp();
    
    // Express can handle Node.js req/res directly
    return new Promise((resolve) => {
      expressApp(req, res, (err) => {
        if (err) {
          console.error('Express error:', err);
          if (!res.headersSent) {
            res.status(500).json({ error: err.message });
          }
        }
        resolve();
      });
    });
  } catch (error) {
    console.error('Handler error:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Internal server error',
        message: error.message 
      });
    }
  }
}
