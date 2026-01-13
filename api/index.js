// Vercel serverless function - Express adapter with better compatibility
// Handles Express middleware requirements
// NO serverless-http dependency - uses native Fetch API

import { Readable } from 'stream';

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
    console.error('Error details:', error.message, error.stack);
    throw error;
  }
}

// Main Vercel handler
export default async function handler(vercelRequest) {
  try {
    console.log('📥 Request received:', vercelRequest.method, vercelRequest.url);
    
    const expressApp = await getApp();
    const url = new URL(vercelRequest.url);
    
    console.log('📍 Processing route:', url.pathname);
    
    // Read body first if present
    let bodyData = null;
    if (['POST', 'PUT', 'PATCH'].includes(vercelRequest.method)) {
      try {
        const contentType = vercelRequest.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          bodyData = await vercelRequest.json();
        } else {
          bodyData = await vercelRequest.text();
        }
      } catch (e) {
        bodyData = null;
      }
    }
    
    // Create request object with stream for body
    const headers = {};
    for (const [key, value] of vercelRequest.headers.entries()) {
      headers[key.toLowerCase()] = value;
    }
    
    // Create body stream for Express middleware
    const bodyStream = new Readable();
    if (bodyData) {
      const bodyStr = typeof bodyData === 'string' ? bodyData : JSON.stringify(bodyData);
      bodyStream.push(bodyStr);
    }
    bodyStream.push(null);
    
    const req = Object.assign(Object.create(Readable.prototype), {
      method: vercelRequest.method,
      url: url.pathname + url.search,
      originalUrl: url.pathname + url.search,
      path: url.pathname,
      query: Object.fromEntries(url.searchParams),
      headers: headers,
      header: headers,
      body: bodyData,
      rawBody: bodyData,
      get: function(name) {
        return this.headers[name.toLowerCase()] || this.headers[name];
      },
      // Stream methods for Express middleware
      pipe: function() { return bodyStream; },
      on: function() { return this; },
      once: function() { return this; },
      emit: function() { return false; },
      readable: true,
      readableEncoding: null,
      readableEnded: true,
      readableFlowing: null,
      readableHighWaterMark: 16384,
      readableLength: 0,
      readableObjectMode: false,
      destroyed: false
    });
    
    // Create response object
    let statusCode = 200;
    const responseHeaders = {};
    let responseBody = null;
    let responseEnded = false;
    
    const res = {
      statusCode: 200,
      headers: {},
      headerSent: false,
      
      setHeader: function(name, value) {
        responseHeaders[name.toLowerCase()] = value;
        this.headers[name.toLowerCase()] = value;
        return this;
      },
      
      getHeader: function(name) {
        return responseHeaders[name.toLowerCase()];
      },
      
      removeHeader: function(name) {
        delete responseHeaders[name.toLowerCase()];
        delete this.headers[name.toLowerCase()];
      },
      
      writeHead: function(code, responseHeadersObj) {
        this.statusCode = code;
        statusCode = code;
        if (responseHeadersObj) {
          Object.assign(responseHeaders, responseHeadersObj);
          Object.assign(this.headers, responseHeadersObj);
        }
        return this;
      },
      
      write: function(chunk) {
        if (!responseEnded) {
          if (!responseBody) responseBody = '';
          responseBody += chunk.toString();
        }
        return true;
      },
      
      end: function(chunk) {
        if (responseEnded) return this;
        if (chunk) {
          responseBody = chunk.toString();
        }
        responseEnded = true;
        return this;
      },
      
      status: function(code) {
        this.statusCode = code;
        statusCode = code;
        return this;
      },
      
      json: function(data) {
        this.setHeader('content-type', 'application/json');
        responseBody = JSON.stringify(data);
        responseEnded = true;
        return this;
      },
      
      send: function(data) {
        if (typeof data === 'object' && data !== null) {
          this.setHeader('content-type', 'application/json');
          responseBody = JSON.stringify(data);
        } else if (data !== undefined && data !== null) {
          responseBody = data.toString();
        }
        responseEnded = true;
        return this;
      },
      
      set: function(name, value) {
        if (typeof name === 'object') {
          Object.assign(responseHeaders, name);
          Object.assign(this.headers, name);
        } else {
          this.setHeader(name, value);
        }
        return this;
      }
    };
    
    // Handle Express app
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        console.error('⏱️ Request timeout after 28s');
        reject(new Error('Request timeout after 28s'));
      }, 28000);
      
      const originalEnd = res.end;
      res.end = function(...args) {
        clearTimeout(timeout);
        originalEnd.apply(this, args);
        resolve();
      };
      
      // Call Express app
      try {
        expressApp(req, res, (err) => {
          clearTimeout(timeout);
          if (err) {
            console.error('❌ Express error handler called:', err);
            console.error('Error stack:', err.stack);
            reject(err);
          } else {
            if (!responseEnded) {
              console.log('⚠️ Response not ended, resolving anyway');
              resolve();
            } else {
              console.log('✅ Response ended successfully');
            }
          }
        });
      } catch (syncError) {
        clearTimeout(timeout);
        console.error('❌ Synchronous error calling Express:', syncError);
        console.error('Error stack:', syncError.stack);
        reject(syncError);
      }
    });
    
    console.log('📤 Returning response:', statusCode, 'Body length:', responseBody?.length || 0);
    
    // Return Vercel Response
    return new Response(responseBody || '', {
      status: statusCode || 200,
      headers: responseHeaders
    });
    
  } catch (error) {
    console.error('Handler error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // Always return JSON, never HTML
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error.message,
        type: error.constructor.name
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
