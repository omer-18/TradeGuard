# MongoDB Atlas Usage in Kalshi Insider Trading Detector

## Overview

We use **MongoDB Atlas** as our persistent database to store all analysis results, market data, and user analytics. This enables historical pattern detection, trend analysis, and provides a foundation for advanced features that wouldn't be possible with in-memory storage alone.

---

## What We're Storing

### 1. **Insider Trading Analysis Results** (Most Important)
**Collection:** `analyses`

**What:** Every time we analyze a market for suspicious trading patterns, we save the complete analysis result.

**Stored Data:**
- Market ticker and metadata
- Suspicion score (0-100)
- Risk level (LOW, MEDIUM, HIGH, CRITICAL)
- All 14 detection signals (VPIN, price leadership, volume anomalies, etc.)
- Complete signal analysis with explanations
- Timestamp of analysis
- Number of trades analyzed

**Why This Matters:**
- **Historical Tracking**: See how a market's suspicion score changes over time
- **Pattern Detection**: Compare current patterns with past suspicious markets
- **Trend Analysis**: Identify which markets are becoming more or less suspicious
- **Evidence Building**: Maintain a permanent record of all analyses

**Example Use Case:**
"If we analyzed BTC-2024 last week with a score of 25, and today it's 65, that's a significant change we can track and investigate."

---

### 2. **Market Data** (Last 7 Days)
**Collection:** `markets`

**What:** Individual market information for markets we've analyzed or viewed.

**Stored Data:**
- Market ticker, title, description
- Current prices (normalized)
- Volume and open interest
- Market status and metadata
- Last updated timestamp

**Why This Matters:**
- **Fast Lookups**: Don't need to query Kalshi API every time
- **Historical Context**: Compare current market state with past states
- **Performance**: Serve market data faster from database

**Storage Strategy:**
- Only stores markets from last 7 days (auto-cleanup)
- Keeps database size manageable (under 512 MB free tier)

---

### 3. **Event Data** (Last 7 Days)
**Collection:** `events`

**What:** Kalshi events (groups of related markets) that we've fetched.

**Stored Data:**
- Event ticker, title, category
- All nested markets within the event
- Category information
- Last updated timestamp

**Why This Matters:**
- **Faster Searches**: Search through events without hitting API every time
- **Caching**: Reduce API calls to Kalshi
- **Category Analysis**: Analyze trends by category (Politics, Crypto, etc.)

**Storage Strategy:**
- Stores events from last 7 days
- Auto-cleanup removes older events

---

### 4. **Trade History** (For Analyzed Markets Only)
**Collection:** `trades`

**What:** Historical trade data for markets we've analyzed.

**Stored Data:**
- Trade timestamp
- Trade price (yes/no prices)
- Trade volume (count)
- Market ticker
- Trade direction (taker side)

**Why This Matters:**
- **Analysis Context**: Keep the exact trades that triggered suspicion signals
- **Reproducibility**: Can re-analyze with same trade data
- **Deep Dive**: Investigate specific trades that caused high suspicion scores

**Storage Strategy:**
- Only stores trades for markets we've analyzed (not all trades)
- Keeps storage minimal while preserving analysis context

---

### 5. **User Analytics** (All Time)
**Collection:** `analytics`

**What:** Track how users interact with the application.

**Stored Data:**
- Event type (search, market_view, analysis_run, chat_message)
- Event metadata (query terms, market tickers, etc.)
- Timestamp
- Session information

**Why This Matters:**
- **Popular Markets**: See which markets are most analyzed
- **Search Patterns**: Understand what users are looking for
- **Usage Insights**: Track which features are most used
- **Demo Value**: Show judges what markets are "hot" right now

**Example Insights:**
- "Bitcoin" is the most searched term
- BTC-2024 is the most analyzed market
- Users run 50 analyses per day on average

---

## How We Use MongoDB

### 1. **Hybrid Caching Strategy**

**Problem:** Kalshi API has rate limits, and fetching data is slow.

**Solution:** 
- Check MongoDB first (fast, no API call)
- If data is fresh (< 5 minutes old), use it
- If stale or missing, fetch from Kalshi API
- Store new data in MongoDB for next time

**Result:** Faster responses, fewer API calls, better user experience.

---

### 2. **Analysis History & Comparison**

**Problem:** Can't track how markets change over time without storage.

**Solution:**
- Every analysis is saved to MongoDB
- Can query: "Show me all analyses for BTC-2024"
- Compare scores over time
- Detect trends (market getting more/less suspicious)

**Result:** Historical tracking enables pattern detection.

---

### 3. **High-Risk Market Discovery**

**Problem:** Hard to find the most suspicious markets without querying all analyses.

**Solution:**
- Query MongoDB for all analyses with score >= 35
- Sort by suspicion score
- Return top suspicious markets instantly

**Result:** Quick identification of markets needing investigation.

---

### 4. **Analytics Dashboard**

**Problem:** Don't know what users are interested in.

**Solution:**
- Track every search, view, and analysis
- Aggregate data to find popular searches/markets
- Show trends over time

**Result:** Insights into user behavior and market interest.

---

## Technical Implementation

### Database Structure

```
DeltaHacks12 (Database)
├── analyses (Collection)
│   ├── Index: ticker + timestamp (for history queries)
│   ├── Index: suspicionScore (for high-risk queries)
│   └── Index: riskLevel (for filtering)
│
├── markets (Collection)
│   ├── Index: ticker (unique, for fast lookups)
│   ├── Index: lastUpdated (for cleanup)
│   └── Index: category (for filtering)
│
├── events (Collection)
│   ├── Index: event_ticker (unique)
│   ├── Index: category (for filtering)
│   └── Index: lastUpdated (for cleanup)
│
├── trades (Collection)
│   ├── Index: ticker + created_time (for market queries)
│   └── Index: created_time (for recent trades)
│
└── analytics (Collection)
    ├── Index: timestamp (for time-based queries)
    └── Index: type + timestamp (for event type queries)
```

### Storage Optimization

**Free Tier Limit:** 512 MB

**Our Strategy:**
- **Analyses**: Keep ALL (most valuable data) - ~10 MB
- **Events**: Keep last 7 days only - ~25 MB
- **Markets**: Keep last 7 days only - ~20 MB
- **Trades**: Only for analyzed markets - ~5 MB
- **Analytics**: Keep all (small) - ~5 MB
- **Indexes**: ~15 MB
- **Total**: ~80 MB (well under 512 MB limit)

**Auto-Cleanup:**
- Runs on server startup
- Removes events/markets older than 7 days
- Never deletes analyses (too valuable)
- Can be triggered manually via `/api/cleanup` endpoint

---

## Key Features Enabled by MongoDB

### 1. **Historical Analysis Tracking**
```
GET /api/analyses/BTC-2024/history
```
Shows all analyses for a market over time, allowing you to see how suspicion scores change.

### 2. **High-Risk Market Discovery**
```
GET /api/analyses/high-risk
```
Instantly find all markets with suspicion score >= 35, sorted by risk.

### 3. **Analytics Dashboard**
```
GET /api/analytics/popular
GET /api/analytics/stats
```
See what users are searching for and which markets are most analyzed.

### 4. **Data Persistence**
All data survives server restarts. No data loss when the server goes down.

### 5. **Fast Queries**
MongoDB indexes make queries fast even with thousands of analyses.

---

## Why MongoDB Atlas (Not Just In-Memory)

### Without MongoDB:
- ❌ Data lost on server restart
- ❌ Can't track history
- ❌ Can't compare analyses over time
- ❌ No analytics
- ❌ Limited to current session

### With MongoDB:
- ✅ Data persists forever
- ✅ Full analysis history
- ✅ Trend detection
- ✅ User analytics
- ✅ Historical pattern matching
- ✅ Fast queries with indexes
- ✅ Scalable to thousands of analyses

---

## Demo Talking Points

### For Judges:

1. **"We use MongoDB Atlas to persist all insider trading analyses, enabling historical pattern detection."**
   - Every analysis is saved
   - Can track how markets change over time
   - Compare current patterns with historical data

2. **"Our system stores analysis results in MongoDB, allowing users to track how suspicion scores evolve."**
   - Show analysis history endpoint
   - Demonstrate trend detection

3. **"MongoDB Atlas powers our analytics dashboard, tracking which markets are most analyzed and what users search for."**
   - Show popular searches
   - Show most analyzed markets
   - Demonstrate user behavior insights

4. **"We implement automatic data cleanup to stay within free tier limits while preserving critical analysis data."**
   - Smart storage strategy
   - Keeps valuable data (analyses) forever
   - Removes old event data automatically

5. **"MongoDB enables us to quickly identify high-risk markets by querying all stored analyses."**
   - Show high-risk endpoint
   - Demonstrate fast queries
   - Show pattern detection capabilities

---

## Example Queries We Can Answer

1. **"What markets have the highest suspicion scores?"**
   - Query: `GET /api/analyses/high-risk`
   - Returns: All markets with score >= 35, sorted by score

2. **"How has BTC-2024's suspicion score changed over time?"**
   - Query: `GET /api/analyses/BTC-2024/history`
   - Returns: All analyses for that market, showing trend

3. **"What are users searching for most?"**
   - Query: `GET /api/analytics/popular`
   - Returns: Top searches and most viewed markets

4. **"Show me all analyses from the last week."**
   - Query: `GET /api/analyses?limit=100`
   - Returns: Recent analyses with pagination

5. **"Which markets have similar suspicious patterns?"**
   - Query: `GET /api/analyses?minScore=50`
   - Returns: Markets with similar high scores

---

## Summary

**MongoDB Atlas is the backbone of our data persistence layer:**

- **Stores** all analysis results permanently
- **Tracks** user behavior and analytics
- **Enables** historical pattern detection
- **Provides** fast queries with indexes
- **Maintains** data across server restarts
- **Optimizes** storage to stay within free tier

**Without MongoDB**, we'd just be a real-time analyzer. **With MongoDB**, we're a comprehensive insider trading detection system with historical tracking, trend analysis, and user insights.
