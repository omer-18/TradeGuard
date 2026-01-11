# Kalshi Data Extraction Analysis & Improvement Suggestions

## Current Data Extraction Status

### ✅ Currently Extracting

1. **Markets**
   - Basic market data (ticker, title, prices, volume, status)
   - Market search functionality
   - Single market details
   - Market filtering by status, event ticker, series ticker

2. **Events**
   - All events with nested markets (cached for 5 minutes)
   - Event search and filtering
   - Category-based filtering
   - Event details by ticker

3. **Trades**
   - Trade history for specific markets
   - Basic trade data (price, quantity, timestamp)

4. **Orderbooks**
   - Current orderbook depth for markets
   - Yes/No bid levels

5. **Series**
   - Series list with category/tag filtering
   - Series metadata

6. **Tags**
   - Tags for series categories

7. **Search**
   - Cross-event and market search
   - Category filtering

---

## ❌ Missing Critical Data

### 1. **Market Candlesticks (OHLC Data)** - HIGH PRIORITY ⚠️
**Why it's important:** Historical price data is essential for:
- Price trend analysis
- Volatility calculations
- Pattern detection
- Technical analysis
- Insider trading detection (unusual price movements)

**Available endpoints:**
- `getMarketCandlesticks(seriesTicker, ticker, startTs, endTs, periodInterval)` - Single market
- `batchGetMarketCandlesticks(marketTickers, startTs, endTs, periodInterval)` - Up to 100 markets at once

**Period intervals:** 1 minute, 60 minutes (1 hour), 1440 minutes (1 day)

**Recommendation:** Add endpoints:
```javascript
GET /api/markets/:ticker/candlesticks?startTs=&endTs=&periodInterval=
GET /api/markets/candlesticks/batch?tickers=&startTs=&endTs=&periodInterval=
```

---

### 2. **Exchange Information** - MEDIUM PRIORITY
**Why it's important:** 
- Know when exchange is operational
- Understand trading hours
- Get important announcements
- Track fee changes

**Available endpoints:**
- `getExchangeStatus()` - Current exchange status
- `getExchangeSchedule()` - Trading schedule
- `getExchangeAnnouncements()` - Exchange-wide announcements
- `getSeriesFeeChanges(seriesTicker, showHistorical)` - Fee information

**Recommendation:** Add endpoint:
```javascript
GET /api/exchange/status
GET /api/exchange/schedule
GET /api/exchange/announcements
GET /api/exchange/fee-changes?seriesTicker=&showHistorical=
```

---

### 3. **Individual Series Details** - MEDIUM PRIORITY
**Why it's important:**
- Get detailed series information
- Understand series structure and rules
- Better context for markets

**Available endpoint:**
- `getSeries(seriesTicker)` - Get specific series details

**Recommendation:** Add endpoint:
```javascript
GET /api/series/:seriesTicker
```

---

### 4. **Advanced Market Filtering** - MEDIUM PRIORITY
**Why it's important:**
- Filter by creation/settlement timestamps
- Filter multivariate events
- More precise market discovery

**Currently missing filters:**
- `minCreatedTs`, `maxCreatedTs` - Filter by creation time
- `minSettledTs`, `maxSettledTs` - Filter by settlement time
- `mveFilter` - Filter multivariate events (only/exclude)
- `tickers` - Get specific markets by ticker list

**Recommendation:** Enhance existing `/api/markets` endpoint to support all filters

---

### 5. **Advanced Trade Filtering** - LOW PRIORITY
**Why it's important:**
- Historical trade analysis
- Time-based trade patterns

**Currently missing:**
- `minTs`, `maxTs` - Time range filtering for trades

**Recommendation:** Add time filters to `/api/markets/:ticker/trades`

---

### 6. **Portfolio Data** (Requires Authentication) - OPTIONAL
**Why it's important:**
- User-specific trading data
- Position tracking
- Fill history
- Settlement history

**Available endpoints (require auth):**
- `getBalance()` - Account balance and portfolio value
- `getPositions(cursor, limit, countFilter, ticker, eventTicker)` - User positions
- `getFills(ticker, orderId, minTs, maxTs, limit, cursor)` - User's trade fills
- `getSettlements(limit, cursor, ticker, eventTicker, minTs, maxTs)` - Settlement history

**Recommendation:** Add endpoints (only if authenticated):
```javascript
GET /api/portfolio/balance
GET /api/portfolio/positions
GET /api/portfolio/fills
GET /api/portfolio/settlements
```

---

## 🔧 Implementation Recommendations

### Priority 1: Market Candlesticks (Critical for Analysis)

Add to `backend/server.js`:

```javascript
// Get market candlesticks (historical price data)
app.get('/api/markets/:ticker/candlesticks', async (req, res) => {
  try {
    const { ticker } = req.params;
    const { startTs, endTs, periodInterval = 60 } = req.query;
    
    // Need series ticker - could extract from market or require as param
    const market = await marketApi.getMarket(ticker);
    const seriesTicker = market.data.market.series_ticker;
    
    if (!startTs || !endTs) {
      return res.status(400).json({ 
        error: 'startTs and endTs are required (Unix timestamps)' 
      });
    }
    
    const response = await marketApi.getMarketCandlesticks(
      seriesTicker,
      ticker,
      parseInt(startTs),
      parseInt(endTs),
      parseInt(periodInterval) // 1, 60, or 1440
    );
    
    res.json({
      candlesticks: response.data.candlesticks || [],
      market: ticker,
      periodInterval: parseInt(periodInterval)
    });
  } catch (error) {
    console.error('Error fetching candlesticks:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Batch get candlesticks for multiple markets
app.get('/api/markets/candlesticks/batch', async (req, res) => {
  try {
    const { tickers, startTs, endTs, periodInterval = 60 } = req.query;
    
    if (!tickers || !startTs || !endTs) {
      return res.status(400).json({ 
        error: 'tickers (comma-separated), startTs, and endTs are required' 
      });
    }
    
    // Max 100 tickers
    const tickerList = tickers.split(',').slice(0, 100).join(',');
    
    const response = await marketApi.batchGetMarketCandlesticks(
      tickerList,
      parseInt(startTs),
      parseInt(endTs),
      parseInt(periodInterval)
    );
    
    res.json({
      candlesticks: response.data.candlesticks || {},
      periodInterval: parseInt(periodInterval)
    });
  } catch (error) {
    console.error('Error fetching batch candlesticks:', error.message);
    res.status(500).json({ error: error.message });
  }
});
```

### Priority 2: Exchange Information

Add to `backend/server.js`:

```javascript
// Initialize ExchangeApi
let exchangeApi;

function initializeKalshiClient() {
  // ... existing code ...
  exchangeApi = new ExchangeApi(config);
}

// Exchange status
app.get('/api/exchange/status', async (req, res) => {
  try {
    const response = await exchangeApi.getExchangeStatus();
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching exchange status:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Exchange schedule
app.get('/api/exchange/schedule', async (req, res) => {
  try {
    const response = await exchangeApi.getExchangeSchedule();
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching exchange schedule:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Exchange announcements
app.get('/api/exchange/announcements', async (req, res) => {
  try {
    const response = await exchangeApi.getExchangeAnnouncements();
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching announcements:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Series fee changes
app.get('/api/exchange/fee-changes', async (req, res) => {
  try {
    const { seriesTicker, showHistorical } = req.query;
    const response = await exchangeApi.getSeriesFeeChanges(
      seriesTicker || undefined,
      showHistorical === 'true'
    );
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching fee changes:', error.message);
    res.status(500).json({ error: error.message });
  }
});
```

### Priority 3: Individual Series Details

Add to `backend/server.js`:

```javascript
// Get single series
app.get('/api/series/:seriesTicker', async (req, res) => {
  try {
    const { seriesTicker } = req.params;
    const response = await marketApi.getSeries(seriesTicker);
    res.json({
      series: response.data.series
    });
  } catch (error) {
    console.error('Error fetching series:', error.message);
    res.status(500).json({ error: error.message });
  }
});
```

### Priority 4: Enhanced Market Filtering

Update existing `/api/markets` endpoint to support all filters:

```javascript
app.get('/api/markets', async (req, res) => {
  try {
    const { 
      limit = 100, 
      cursor, 
      status, 
      eventTicker, 
      seriesTicker,
      minCreatedTs,
      maxCreatedTs,
      minCloseTs,
      maxCloseTs,
      minSettledTs,
      maxSettledTs,
      tickers,
      mveFilter
    } = req.query;

    const response = await marketApi.getMarkets(
      parseInt(limit),
      cursor || undefined,
      eventTicker || undefined,
      seriesTicker || undefined,
      minCreatedTs ? parseInt(minCreatedTs) : undefined,
      maxCreatedTs ? parseInt(maxCreatedTs) : undefined,
      maxCloseTs ? parseInt(maxCloseTs) : undefined,
      minCloseTs ? parseInt(minCloseTs) : undefined,
      minSettledTs ? parseInt(minSettledTs) : undefined,
      maxSettledTs ? parseInt(maxSettledTs) : undefined,
      status || undefined,
      tickers || undefined,
      mveFilter || undefined
    );

    const markets = (response.data.markets || []).map(normalizeMarket);

    res.json({
      markets,
      cursor: response.data.cursor,
      total: markets.length
    });
  } catch (error) {
    console.error('Error fetching markets:', error.message);
    res.status(500).json({ error: error.message });
  }
});
```

### Priority 5: Enhanced Trade Filtering

Update existing `/api/markets/:ticker/trades` endpoint:

```javascript
app.get('/api/markets/:ticker/trades', async (req, res) => {
  try {
    const { ticker } = req.params;
    const { limit = 100, cursor, minTs, maxTs } = req.query;

    const response = await marketApi.getTrades(
      parseInt(limit),
      cursor || undefined,
      ticker,
      minTs ? parseInt(minTs) : undefined,
      maxTs ? parseInt(maxTs) : undefined
    );

    const trades = (response.data.trades || []).map(trade => ({
      ...trade,
      yes_price: (trade.yes_price || 0) / 100,
      no_price: (trade.no_price || 0) / 100,
    }));

    res.json({
      trades,
      cursor: response.data.cursor
    });
  } catch (error) {
    console.error('Error fetching trades:', error.message);
    res.status(500).json({ error: error.message });
  }
});
```

---

## 📊 Data Extraction Completeness Score

| Category | Current | Missing | Completeness |
|----------|---------|---------|---------------|
| Markets (Basic) | ✅ | - | 100% |
| Markets (Advanced) | ⚠️ | Candlesticks, Advanced filters | 60% |
| Events | ✅ | - | 100% |
| Trades | ⚠️ | Time filtering | 80% |
| Orderbooks | ✅ | - | 100% |
| Series | ⚠️ | Individual series details | 70% |
| Exchange Info | ❌ | All endpoints | 0% |
| Portfolio (Auth) | ❌ | All endpoints | 0% |

**Overall Completeness: ~70%**

---

## 🎯 Quick Wins (Easy to Implement)

1. **Add Exchange Status** - Single endpoint, no dependencies
2. **Add Individual Series Endpoint** - Simple wrapper
3. **Add Time Filters to Trades** - Just pass through parameters
4. **Add Advanced Market Filters** - Pass through to existing API

---

## 🚀 High-Value Additions

1. **Market Candlesticks** - Enables price analysis and pattern detection
2. **Batch Candlesticks** - Efficient bulk historical data retrieval
3. **Exchange Schedule** - Important for understanding trading windows

---

## 📝 Next Steps

1. Implement market candlesticks endpoints (Priority 1)
2. Add exchange information endpoints (Priority 2)
3. Enhance existing endpoints with missing filters (Priority 3-5)
4. Consider portfolio endpoints if authentication is available (Optional)

---

## 🔍 Context Gatherer Improvements

Update `backend/services/contextGatherer.js` to:
- Include candlestick data when available
- Use time filters for trades
- Fetch exchange status for context
- Include series details when relevant
