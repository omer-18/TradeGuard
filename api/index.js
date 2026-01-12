// Vercel serverless function - Native Fetch API adapter for Express
// No external dependencies needed - works with Vercel's native Request/Response

import { IncomingMessage, ServerResponse } from 'http';
import { Readable } from 'stream';
import { URL } from 'url';

let app;
let initialized = false;

async function getApp() {
  if (initialized) return app;
  
  console.log('🔄 Initializing Express app...');
  
  try {
    const serverModule = await import('../backend/server.js');
    app = serverModule.default;
    
    if (!app) {
      throw new Error('Express app not found');
    }
    
    initialized = true;
    console.log('✅ Express app ready');
    return app;
  } catch (error) {
    console.error('❌ App initialization failed:', error);
    throw error;
  }
}

// Convert Vercel Request to Node.js IncomingMessage
function createIncomingMessage(vercelRequest) {
  const url = new URL(vercelRequest.url);
  const headers = {};
  
  for (const [key, value] of vercelRequest.headers.entries()) {
    headers[key.toLowerCase()] = value;
  }
  
  // Create a readable stream for the body
  const bodyStream = new Readable({
    read() {
      // Body will be set below
    }
  });
  
  const req = Object.assign(new IncomingMessage(), {
    method: vercelRequest.method,
    url: url.pathname + url.search,
    headers: headers,
    get: function(name) {
      return this.headers[name.toLowerCase()] || this.headers[name];
    }
  });
  
  // Handle body
  if (vercelRequest.body) {
    const bodyStr = typeof vercelRequest.body === 'string' 
      ? vercelRequest.body 
      : JSON.stringify(vercelRequest.body);
    bodyStream.push(bodyStr);
    bodyStream.push(null);
    req.body = vercelRequest.body;
  } else {
    bodyStream.push(null);
  }
  
  req.pipe = () => bodyStream;
  return req;
}

// Convert Node.js ServerResponse to Vercel Response
function createServerResponse() {
  let statusCode = 200;
  const headers = {};
  let bodyChunks = [];
  let ended = false;
  
  const res = Object.assign(new ServerResponse({}), {
    statusCode: 200,
    
    setHeader: function(name, value) {
      headers[name.toLowerCase()] = value;
      return this;
    },
    
    getHeader: function(name) {
      return headers[name.toLowerCase()];
    },
    
    writeHead: function(code, responseHeaders) {
      this.statusCode = code;
      statusCode = code;
      if (responseHeaders) {
        Object.assign(headers, responseHeaders);
      }
      return this;
    },
    
    write: function(chunk) {
      if (!ended) {
        bodyChunks.push(chunk);
      }
      return true;
    },
    
    end: function(chunk) {
      if (ended) return this;
      if (chunk) {
        bodyChunks.push(chunk);
      }
      ended = true;
      return this;
    },
    
    status: function(code) {
      this.statusCode = code;
      statusCode = code;
      return this;
    },
    
    json: function(data) {
      this.setHeader('content-type', 'application/json');
      this.end(JSON.stringify(data));
      return this;
    },
    
    send: function(data) {
      if (typeof data === 'object') {
        this.setHeader('content-type', 'application/json');
        this.end(JSON.stringify(data));
      } else {
        this.end(data);
      }
      return this;
    },
    
    // Get response data for Vercel
    getResponse: function() {
      const body = Buffer.concat(bodyChunks).toString();
      return {
        status: statusCode,
        headers: headers,
        body: body
      };
    }
  });
  
  return res;
}

// Main Vercel handler
export default async function handler(vercelRequest) {
  try {
    const expressApp = await getApp();
    
    // Create Node.js request/response objects
    const req = createIncomingMessage(vercelRequest);
    const res = createServerResponse();
    
    // Read body for POST/PUT/PATCH
    if (['POST', 'PUT', 'PATCH'].includes(vercelRequest.method)) {
      try {
        const contentType = vercelRequest.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          req.body = await vercelRequest.json();
        } else {
          req.body = await vercelRequest.text();
        }
      } catch (e) {
        req.body = null;
      }
    }
    
    // Handle Express app
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Request timeout'));
      }, 28000);
      
      const originalEnd = res.end;
      res.end = function(...args) {
        clearTimeout(timeout);
        originalEnd.apply(this, args);
        resolve();
      };
      
      expressApp(req, res, (err) => {
        clearTimeout(timeout);
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
    
    // Get response
    const responseData = res.getResponse();
    
    return new Response(responseData.body || '', {
      status: responseData.status || 200,
      headers: responseData.headers
    });
    
  } catch (error) {
    console.error('Handler error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error.message
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
