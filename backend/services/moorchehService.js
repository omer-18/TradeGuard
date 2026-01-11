/**
 * Moorcheh Service Wrapper
 * Provides Node.js interface to Python Moorcheh microservice
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const MOORCHEH_SERVICE_URL = process.env.MOORCHEH_SERVICE_URL || 'http://localhost:8000';
const HEALTH_CHECK_TIMEOUT = 2000; // 2 seconds

/**
 * Check if Moorcheh Python service is available
 */
export async function isAvailable() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT);
    
    const response = await fetch(`${MOORCHEH_SERVICE_URL}/health`, {
      method: 'GET',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json();
      return data.status === 'healthy';
    }
    return false;
  } catch (error) {
    // Service unavailable - fail gracefully
    return false;
  }
}

/**
 * Store analysis result in Moorcheh
 * @param {string} ticker - Market ticker
 * @param {Object} analysis - Analysis result object
 * @param {Object} market - Market data object
 * @returns {Promise<Object>} Result with status and memory_id
 */
export async function storeAnalysis(ticker, analysis, market) {
  if (!await isAvailable()) {
    throw new Error('Moorcheh service is not available');
  }

  try {
    const response = await fetch(`${MOORCHEH_SERVICE_URL}/store-analysis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ticker,
        analysis,
        market
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error storing analysis in Moorcheh:', error.message);
    throw error;
  }
}

/**
 * Find similar past analyses using semantic search
 * @param {string} ticker - Current market ticker
 * @param {Object|null} analysis - Current analysis result (optional)
 * @param {number} limit - Maximum number of results (default: 5)
 * @returns {Promise<Array>} Array of similar market analyses
 */
export async function findSimilarMarkets(ticker, analysis = null, limit = 5) {
  if (!await isAvailable()) {
    return []; // Return empty array if service unavailable
  }

  try {
    const response = await fetch(`${MOORCHEH_SERVICE_URL}/find-similar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ticker,
        analysis,
        limit
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Moorcheh search error:', errorData.error || `HTTP ${response.status}`);
      return [];
    }

    const result = await response.json();
    return result.similar_markets || [];
  } catch (error) {
    console.error('Error searching Moorcheh:', error.message);
    return []; // Return empty array on error
  }
}
