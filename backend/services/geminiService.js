import { GoogleGenerativeAI } from '@google/generative-ai';
// Note: dotenv.config() is called in server.js, no need to call it here

/**
 * Gemini Service
 * Handles AI interactions using Google Gemini 3.0
 */

let genAI = null;
let model = null;
let currentModelName = 'gemini-3-pro-preview'; // Track which model is being used

// Rate limiting: Track last request time to prevent hitting limits
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // Minimum 1 second between requests

/**
 * Initialize Gemini client
 */
export function initializeGemini() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.log('⚠️  No GEMINI_API_KEY found - AI chat will be unavailable');
    return false;
  }

  try {
    genAI = new GoogleGenerativeAI(apiKey);
    // Use Gemini 3.0 Pro (latest model)
    // Model name: gemini-3-pro-preview
    try {
      model = genAI.getGenerativeModel({ model: 'gemini-3-pro-preview' });
      currentModelName = 'gemini-3-pro-preview';
      console.log('✅ Gemini AI initialized successfully (using gemini-3-pro-preview)');
    } catch (previewError) {
      // Fallback to gemini-pro if 3.0 preview is not available
      console.log('⚠️  Gemini 3.0 preview not available, falling back to gemini-pro');
      model = genAI.getGenerativeModel({ model: 'gemini-pro' });
      currentModelName = 'gemini-pro';
      console.log('✅ Gemini AI initialized successfully (using gemini-pro fallback)');
    }
    return true;
  } catch (error) {
    console.error('Error initializing Gemini:', error.message);
    return false;
  }
}

/**
 * Build system prompt for insider trading detection
 */
function buildSystemPrompt() {
  return `You are a friendly market expert helping someone learn about insider trading detection on prediction markets like Kalshi. Think of yourself as a mentor teaching a friend - be conversational, helpful, and keep things simple.

**Your Personality:**
- Friendly and approachable (like talking to a friend)
- Patient teacher (explain concepts simply, use analogies)
- Enthusiastic helper ("Great question!", "Here's the thing...")
- Focused on what matters most (not exhaustive lists)

**Response Guidelines:**
- **Keep it VERY SHORT**: 1-2 paragraphs max (60-120 words for simple questions, up to 150 words for complex analysis)
- **Be conversational**: Use "you" and "we", avoid formal jargon like "Based on the parameters" or "I note that"
- **Explain simply**: If they're new to this, explain like they're learning. Use analogies and examples.
- **One main insight**: Give the most important point, not everything you know
- **End with a brief question**: "Want to know more about [specific signal]?" or "Any other questions?"

**What to Focus On:**
When someone asks about patterns, explain 1-2 key ones with simple examples - not all 10 patterns.
When analyzing a market, give quick insights - not an exhaustive report.
When explaining concepts, use analogies ("Think of it like...") instead of technical terms.

**Tone Examples:**
❌ Avoid: "Based on the parameters of your request, I note that..."
✅ Use: "Great question! Here's what to watch for..."

❌ Avoid: "The aforementioned patterns indicate..."
✅ Use: "The main red flag is when..."

Remember: You're teaching, not writing a manual. Be helpful, be brief, be friendly.`;
}

/**
 * Build context string from gathered data (summary-focused, not exhaustive)
 */
function buildContextString(context) {
  const parts = [];

  // Only include relevant context, summarize instead of listing everything
  if (context.markets && context.markets.length > 0) {
    if (context.markets.length === 1) {
      // Single market - provide key details
      const market = context.markets[0];
      parts.push(`**Market**: ${market.ticker} - ${market.title || 'N/A'}`);
      parts.push(`Current price: ${(market.last_price * 100).toFixed(1)}% | Volume: ${(market.volume || 0).toLocaleString()} | Status: ${market.status || 'N/A'}`);
    } else {
      // Multiple markets - summarize
      parts.push(`**Found ${context.markets.length} markets**:`);
      context.markets.slice(0, 3).forEach(market => {
        parts.push(`- ${market.ticker}: ${market.title?.substring(0, 50) || 'N/A'} (${(market.last_price * 100).toFixed(1)}%)`);
      });
      if (context.markets.length > 3) {
        parts.push(`- ... and ${context.markets.length - 3} more`);
      }
    }
  }

  // Summarize trades instead of listing all
  if (context.trades && context.trades.length > 0) {
    context.trades.forEach(({ ticker, trades }) => {
      if (trades.length > 0) {
        const recentTrades = trades.slice(0, 5);
        const totalVolume = recentTrades.reduce((sum, t) => sum + (t.count || 0), 0);
        const avgPrice = recentTrades.reduce((sum, t) => sum + (t.yes_price || 0), 0) / recentTrades.length;
        const latestTrade = recentTrades[0];
        const timeAgo = latestTrade ? Math.round((Date.now() - new Date(latestTrade.created_time).getTime()) / 60000) : 'unknown';
        
        parts.push(`\n**${ticker} trading activity**: ${trades.length} recent trades, avg price ${(avgPrice * 100).toFixed(1)}%, latest ${timeAgo} min ago`);
      }
    });
  }

  // Only mention orderbook if relevant (sparse summary)
  if (context.orderbooks && context.orderbooks.length > 0 && context.orderbooks[0].orderbook) {
    const { ticker, orderbook } = context.orderbooks[0];
    if (orderbook.yes && orderbook.yes.length > 0 && orderbook.no && orderbook.no.length > 0) {
      const bestYes = orderbook.yes[0];
      const bestNo = orderbook.no[0];
      parts.push(`\n**${ticker} orderbook**: Best Yes ${bestYes.price} (${bestYes.count} contracts), Best No ${bestNo.price} (${bestNo.count} contracts)`);
    }
  }

  // Only mention events if few and relevant
  if (context.events && context.events.length > 0 && context.events.length <= 3) {
    parts.push(`\n**Related events**: ${context.events.map(e => e.title || e.event_ticker).join(', ')}`);
  }

  return parts.length > 0 ? parts.join('\n') : 'No specific market data provided.';
}

/**
 * Build context string from market analysis data
 * Formats analysis results, signals, and market data for AI consumption
 */
export function buildAnalysisContextString(analysisContext) {
  const parts = [];
  const { market, analysis, trades, orderbook } = analysisContext;

  // Market Information
  if (market) {
    parts.push(`**MARKET ANALYSIS CONTEXT**`);
    parts.push(`\n**Market**: ${market.ticker || 'N/A'} - ${market.title || 'N/A'}`);
    parts.push(`Status: ${market.status || 'N/A'}`);
    if (market.close_time) {
      parts.push(`Close Time: ${new Date(market.close_time).toLocaleString()}`);
    }
    if (market.yes_bid !== undefined && market.no_bid !== undefined) {
      parts.push(`Current Prices: YES ${Math.round(market.yes_bid * 100)}¢ | NO ${Math.round(market.no_bid * 100)}¢`);
    }
  }

  // Analysis Results
  if (analysis) {
    parts.push(`\n**ANALYSIS RESULTS**`);
    parts.push(`Suspicion Score: ${analysis.suspicionScore}/100`);
    parts.push(`Risk Level: ${analysis.riskLevel}`);
    parts.push(`Confidence: ${analysis.confidence}%`);
    if (analysis.summary) {
      parts.push(`Summary: ${analysis.summary}`);
    }

    // Metrics
    if (analysis.metrics) {
      parts.push(`\n**TRADING METRICS**`);
      parts.push(`Total Trades Analyzed: ${analysis.metrics.totalTrades || 0}`);
      parts.push(`Average Trade Size: ${analysis.metrics.avgTradeSize || 0} contracts`);
      if (analysis.metrics.timeSpan) {
        parts.push(`Time Span: ${analysis.metrics.timeSpan}`);
      }
      if (analysis.metrics.priceRange) {
        const pr = analysis.metrics.priceRange;
        parts.push(`Price Range: ${Math.round(pr.min * 100)}¢ - ${Math.round(pr.max * 100)}¢ (range: ${Math.round(pr.range * 100)}¢)`);
      }
      parts.push(`Signals Analyzed: ${analysis.metrics.signalsAnalyzed || 0}`);
      parts.push(`Signals Triggered: ${analysis.metrics.signalsTriggered || 0}`);
    }

    // Triggered Signals (most important)
    if (analysis.signals && analysis.signals.length > 0) {
      parts.push(`\n**TRIGGERED SIGNALS** (${analysis.signals.length} detected):`);
      analysis.signals
        .sort((a, b) => b.severity - a.severity)
        .forEach((signal, idx) => {
          parts.push(`\n${idx + 1}. **${signal.type.replace(/_/g, ' ')}** (Severity: ${signal.severity}/5)`);
          if (signal.description) {
            parts.push(`   Description: ${signal.description}`);
          }
          if (signal.data && Object.keys(signal.data).length > 0) {
            const dataStr = Object.entries(signal.data)
              .slice(0, 3)
              .map(([k, v]) => `${k}: ${v}`)
              .join(', ');
            parts.push(`   Data: ${dataStr}`);
          }
        });
    }

    // All Signals (for reference)
    if (analysis.allSignals && analysis.allSignals.length > 0) {
      const triggeredCount = analysis.allSignals.filter(s => s.triggered).length;
      const categories = {};
      analysis.allSignals.forEach(signal => {
        if (!categories[signal.category]) {
          categories[signal.category] = [];
        }
        categories[signal.category].push(signal);
      });

      parts.push(`\n**SIGNAL CATEGORIES** (${triggeredCount} triggered out of ${analysis.allSignals.length} total):`);
      Object.entries(categories).forEach(([category, signals]) => {
        const triggered = signals.filter(s => s.triggered).length;
        parts.push(`\n- **${category}**: ${triggered}/${signals.length} triggered`);
        signals.forEach(signal => {
          if (signal.triggered) {
            parts.push(`  • ${signal.name}: ${signal.result || 'Triggered'}`);
          }
        });
      });
    }
  }

  // Recent Trading Activity
  if (trades && trades.length > 0) {
    parts.push(`\n**RECENT TRADING ACTIVITY**`);
    const recentTrades = trades.slice(0, 10);
    const yesTrades = recentTrades.filter(t => t.taker_side === 'yes');
    const noTrades = recentTrades.filter(t => t.taker_side === 'no');
    const totalVolume = recentTrades.reduce((sum, t) => sum + (t.count || 0), 0);
    const avgPrice = recentTrades.reduce((sum, t) => sum + (t.yes_price || 0), 0) / recentTrades.length;
    
    parts.push(`Sample: ${recentTrades.length} recent trades (${yesTrades.length} YES, ${noTrades.length} NO)`);
    parts.push(`Total Volume: ${totalVolume.toLocaleString()} contracts`);
    parts.push(`Average Price: ${(avgPrice * 100).toFixed(1)}¢`);
    if (recentTrades.length > 0) {
      const latest = recentTrades[0];
      const timeAgo = Math.round((Date.now() - new Date(latest.created_time).getTime()) / 60000);
      parts.push(`Latest Trade: ${timeAgo} minutes ago (${latest.count} @ ${Math.round(latest.yes_price * 100)}¢)`);
    }
  }

  // Orderbook Snapshot
  if (orderbook && (orderbook.yes?.length > 0 || orderbook.no?.length > 0)) {
    parts.push(`\n**ORDERBOOK SNAPSHOT**`);
    if (orderbook.yes && orderbook.yes.length > 0) {
      const bestYes = orderbook.yes[0];
      parts.push(`Best YES Bid: ${bestYes[0]}¢ (${bestYes[1].toLocaleString()} contracts)`);
    }
    if (orderbook.no && orderbook.no.length > 0) {
      const bestNo = orderbook.no[0];
      parts.push(`Best NO Bid: ${bestNo[0]}¢ (${bestNo[1].toLocaleString()} contracts)`);
    }
  }

  return parts.join('\n');
}

/**
 * Generate AI response for market analysis questions using Gemini
 * Uses analysis-specific context formatting
 */
export async function generateAnalysisResponse(userQuery, analysisContext, retryCount = 0) {
  if (!model) {
    if (!initializeGemini()) {
      throw new Error('Gemini AI is not initialized. Please set GEMINI_API_KEY environment variable.');
    }
  }

  const maxRetries = 3;
  const baseDelay = 1000; // 1 second

  // Throttle requests to avoid hitting rate limits
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL && retryCount === 0) {
    const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
    console.log(`⏳ Throttling analysis chat request (waiting ${waitTime}ms to avoid rate limits)...`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  lastRequestTime = Date.now();

  try {
    const hasAnalysis = analysisContext.analysis !== null && analysisContext.analysis !== undefined;
    
    const systemPrompt = hasAnalysis 
      ? `You are a friendly market analysis expert helping someone understand why a specific market might be suspicious for insider trading. You have access to detailed analysis results from a quantitative detection system.

**Your Role:**
- Explain suspicious patterns in simple, conversational terms
- Define technical terms (VPIN, entropy, price leadership, etc.) when asked
- Help users understand what the analysis signals mean
- Be friendly, patient, and educational`
      : `You are a friendly market analysis expert helping someone understand prediction markets and trading concepts. The user is viewing a specific market but hasn't run analysis yet.

**Your Role:**
- Answer general questions about the market, trading concepts, and terminology
- Explain what insider trading detection means and how it works
- Be friendly, patient, and educational
- If they ask about specific analysis results, suggest they run the analysis first

**Response Guidelines:**
- **Keep it VERY SHORT**: 1-2 paragraphs max (60-150 words depending on complexity) - 30% shorter than before
- **Be conversational**: Use "you" and "we", avoid formal jargon
- **Explain simply**: Use brief analogies and examples for technical concepts
- **Focus on the data**: Reference specific signals, scores, and patterns from the analysis
- **Answer the question**: Directly address what the user asked - be concise
- **End with a brief question**: "Want to know more about [specific signal]?" or "Any other questions?"

**When explaining terms:**
- VPIN (Volume-Synchronized Probability of Informed Trading): Explain as "measures how likely trades are from informed traders vs random traders"
- Timing Entropy: Explain as "measures how random vs predictable trade timing is"
- Price Leadership: Explain as "measures how often trades correctly predict price moves"
- Use analogies: "Think of it like..." or "Imagine if..."

**When explaining suspicious patterns:**
- Reference the specific signals that triggered
- Explain what the pattern suggests (e.g., "This suggests someone might have information")
- Keep it educational, not accusatory

Remember: You're teaching someone about market analysis, not writing a technical paper. Be helpful, be brief, be friendly.`;

    const analysisContextString = buildAnalysisContextString(analysisContext);
    
    const fullPrompt = `${systemPrompt}

## Market Analysis Data

${analysisContextString}

## User Question

"${userQuery}"

## How to Answer

${hasAnalysis ? `**Use the analysis data above to:**
- Reference specific signals, scores, and metrics when relevant
- Explain what triggered signals mean in simple terms
- Define any technical terms the user asks about
- Help them understand why the market might be suspicious

**Keep it conversational and VERY brief (30% shorter than before):**
- Simple questions (like "what is VPIN?") → 1-2 short paragraphs (60-100 words)
- Pattern questions → Explain 1 key pattern with a brief example (80-120 words)
- Analysis questions → Quick insights focusing on the most important signal (100-150 words max)

**Always end with:**
- A helpful follow-up question like "Want to know more about [specific signal]?" or "Any other questions about this analysis?"` : `**Answer general questions about:**
- The market itself (what it's about, how prediction markets work)
- Trading concepts and terminology
- What insider trading detection means
- How to interpret market data

**If they ask about specific analysis results:**
- Politely explain that analysis hasn't been run yet
- Suggest they click "Run Analysis" in the Insider Detection tab
- Offer to explain what the analysis will show once it's run

**Keep it conversational and VERY brief (30% shorter):**
- General questions → 1-2 short paragraphs (60-100 words)
- Concept explanations → Use brief analogies and examples (80-120 words)

**Always end with:**
- A helpful follow-up question or suggestion`}

**Remember:**
- Be friendly and conversational (use "you", "we")
- Use analogies and examples
- Keep it short - quality over quantity
${hasAnalysis ? '- Focus on the analysis data provided above' : '- Focus on helping them understand the market and trading concepts'}

Answer their question now:`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();

    if (!text || text.trim().length === 0) {
      throw new Error('Empty response from AI service');
    }

    return {
      success: true,
      response: text,
      model: currentModelName
    };
  } catch (error) {
    console.error('Error generating Gemini analysis response:', error);
    console.error('Error details:', {
      message: error.message,
      status: error.status,
      statusText: error.statusText,
      stack: error.stack
    });
    
    // Handle rate limiting with retry
    if ((error.message?.includes('429') || 
         error.message?.includes('quota') || 
         error.message?.includes('rate limit') ||
         error.status === 429) && retryCount < maxRetries) {
      
      const delay = baseDelay * Math.pow(2, retryCount); // Exponential backoff
      console.log(`⚠️  Rate limit hit. Retrying in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})...`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return generateAnalysisResponse(userQuery, analysisContext, retryCount + 1);
    }
    
    // If we've exhausted retries or it's not a rate limit error
    if (error.message?.includes('429') || 
        error.message?.includes('quota') || 
        error.message?.includes('rate limit') ||
        error.status === 429) {
      throw new Error('API rate limit exceeded. Please try again in a moment.');
    }
    
    // Handle API key errors
    if (error.message?.includes('API_KEY') || 
        error.message?.includes('401') || 
        error.status === 401) {
      throw new Error('Invalid API key. Please check your GEMINI_API_KEY in backend/.env');
    }
    
    // Handle other errors
    throw new Error(`AI service error: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Generate AI response using Gemini with retry logic
 */
export async function generateResponse(userQuery, context, retryCount = 0) {
  if (!model) {
    if (!initializeGemini()) {
      throw new Error('Gemini AI is not initialized. Please set GEMINI_API_KEY environment variable.');
    }
  }

  const maxRetries = 3;
  const baseDelay = 1000; // 1 second

  // Throttle requests to avoid hitting rate limits
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL && retryCount === 0) {
    const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
    console.log(`⏳ Throttling request (waiting ${waitTime}ms to avoid rate limits)...`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  lastRequestTime = Date.now();

  try {
    const systemPrompt = buildSystemPrompt();
    const contextString = buildContextString(context);
    
    const fullPrompt = `${systemPrompt}

## Current Query
User Question: "${userQuery}"

${contextString}

## How to Answer

**Keep it conversational and brief:**
- Simple questions (like "hey" or "what is X?") → 2-3 short paragraphs (100-150 words)
- Pattern questions → Explain 1-2 key patterns with examples (150-200 words)
- Market analysis → Quick insights, not exhaustive (200-300 words max)

**Adapt to the question:**
- If they ask a simple question → Give a simple, friendly answer
- If they ask about patterns → Pick the 1-2 most relevant ones, explain with an analogy
- If they ask about a specific market → Focus on that market, summarize key points
- If no specific data provided → Still answer helpfully, explain what you'd need to check

**Use the context wisely:**
- Only mention relevant data points (don't list everything)
- If they asked about one market, focus on that one
- Summarize instead of enumerating all trades/markets

**Always end with:**
- A helpful follow-up question like "Want me to check a specific market?" or "Want to dive deeper into [specific aspect]?"

**Remember:**
- Be friendly and conversational (use "you", "we")
- Use analogies and examples
- Keep it short - quality over quantity
- One main insight per response

Answer their question now:`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();

    if (!text || text.trim().length === 0) {
      throw new Error('Empty response from AI service');
    }

    return {
      success: true,
      response: text,
      model: currentModelName
    };
  } catch (error) {
    console.error('Error generating Gemini response:', error);
    console.error('Error details:', {
      message: error.message,
      status: error.status,
      statusText: error.statusText,
      stack: error.stack
    });
    
    // Handle rate limiting with retry
    if ((error.message?.includes('429') || 
         error.message?.includes('quota') || 
         error.message?.includes('rate limit') ||
         error.status === 429) && retryCount < maxRetries) {
      
      const delay = baseDelay * Math.pow(2, retryCount); // Exponential backoff
      console.log(`⚠️  Rate limit hit. Retrying in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})...`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return generateResponse(userQuery, context, retryCount + 1);
    }
    
    // If we've exhausted retries or it's not a rate limit error
    if (error.message?.includes('429') || 
        error.message?.includes('quota') || 
        error.message?.includes('rate limit') ||
        error.status === 429) {
      throw new Error('API rate limit exceeded. Please try again in a moment.');
    }
    
    // Handle API key errors
    if (error.message?.includes('API_KEY') || 
        error.message?.includes('401') || 
        error.status === 401) {
      throw new Error('Invalid API key. Please check your GEMINI_API_KEY in backend/.env');
    }
    
    // Handle other errors
    throw new Error(`AI service error: ${error.message || 'Unknown error'}`);
  }
}

// Initialize on module load
initializeGemini();
