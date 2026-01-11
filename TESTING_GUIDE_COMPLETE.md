# Complete Testing Guide - Kalshi Data Extraction

## 🚀 Quick Start Testing

### Step 1: Start the Backend

```bash
cd backend
npm install  # If you haven't already
npm start
```

**Expected Output:**
```
🚀 Server running on http://localhost:3001
📊 Using Kalshi TypeScript SDK
🔐 Authentication: Not needed for public data

📥 Fetching all events from Kalshi...
  Page 1: 200 events (total: 200)
  ...
✅ Cached 1234 events
```

**✅ Check:**
- Server starts without errors
- Events are being fetched and cached
- No authentication errors (if no API keys)

---

### Step 2: Start the Frontend

```bash
cd frontend
npm install  # If you haven't already
npm run dev
```

**Expected Output:**
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

**✅ Check:**
- Frontend starts on port 3000
- No build errors
- Browser opens automatically (or navigate to http://localhost:3000)

---

## 🧪 Feature-by-Feature Testing

### Test 1: Exchange Status Indicator

**Location:** Header (top right)

**What to Check:**
1. ✅ Green dot appears = Exchange is open
2. ✅ Red dot appears = Exchange is closed
3. ✅ Status text shows "Exchange Open" or "Exchange [status]"
4. ✅ Status updates automatically (check after 30 seconds)

**Manual Test:**
```bash
# Test the endpoint directly
curl http://localhost:3001/api/exchange/status
```

**Expected Response:**
```json
{
  "status": "open",
  "message": "..."
}
```

**❌ If it fails:**
- Check browser console for errors
- Verify backend is running
- Check network tab for failed requests

---

### Test 2: Market Search & Display

**Steps:**
1. Type a search term (e.g., "bitcoin", "trump", "election")
2. Click "SEARCH" or press Enter
3. Wait for results to load

**✅ Check:**
- Markets appear in the grid
- Each market shows:
  - Title
  - Category badge
  - Price percentage
  - Yes/No buttons
- Loading spinner appears while searching
- No error messages

**Test Different Searches:**
- "bitcoin" - Should show crypto markets
- "trump" - Should show political markets
- "sports" - Should show sports markets
- Empty search - Should show all markets

---

### Test 3: Market Details Panel

**Steps:**
1. Click on any market from the search results
2. Details panel should appear on the right side

**✅ Check:**
- Panel opens smoothly
- Shows market title and description
- Displays YES/NO prices
- Shows volume, open interest, status
- Close time is displayed correctly

**Test Data Display:**
- Prices should be in cents (e.g., "65¢" not "0.65")
- Volume should be formatted with commas
- Status should be capitalized (e.g., "Open", "Closed")

---

### Test 4: Price History Chart (Candlesticks)

**Steps:**
1. Select a market (one with a series_ticker)
2. Scroll down in the details panel
3. Look for "Price History" section

**✅ Check:**
- Chart loads (may take 1-2 seconds)
- Shows candlestick bars (green = up, red = down)
- Chart has controls:
  - Period dropdown (1 Minute, 1 Hour, 1 Day)
  - Days dropdown (1 Day, 7 Days, 30 Days)
- Price labels on Y-axis
- Time labels on X-axis

**Test Chart Controls:**
1. Change period from "1 Hour" to "1 Day"
   - Chart should reload with different granularity
2. Change days from "7 Days" to "30 Days"
   - Chart should show more historical data

**❌ If chart doesn't appear:**
- Check browser console for errors
- Verify market has a `series_ticker` (some markets might not)
- Check network tab for `/api/markets/:ticker/candlesticks` request
- Verify backend endpoint is working

**Manual Test:**
```bash
# Get a market ticker first
curl http://localhost:3001/api/markets?limit=1

# Then test candlesticks (replace TICKER with actual ticker)
curl "http://localhost:3001/api/markets/TICKER/candlesticks?seriesTicker=SERIES&startTs=1704067200&endTs=1704153600&periodInterval=60"
```

---

### Test 5: Time-Filtered Trades

**Steps:**
1. Select a market
2. Scroll to "Recent Trades" section
3. Find the dropdown at the top right of trades section

**✅ Check:**
- Dropdown shows: "All Time", "Last Hour", "Last 24 Hours", "Last 7 Days"
- Default is "All Time"
- Trades list displays below

**Test Each Filter:**
1. Select "Last Hour"
   - Trades should reload
   - Only shows trades from last hour
   - Loading indicator appears briefly
2. Select "Last 24 Hours"
   - More trades should appear
3. Select "Last 7 Days"
   - Even more trades
4. Select "All Time"
   - All available trades

**✅ Check Trade Display:**
- Each trade shows:
  - Side (YES/NO) with color coding
  - Count (number of contracts)
  - Price in cents
  - Time (formatted correctly)
- Trades are sorted by time (newest first)

**Manual Test:**
```bash
# Test with time filter (replace TICKER)
curl "http://localhost:3001/api/markets/TICKER/trades?limit=20&minTs=1704067200"
```

---

### Test 6: Category Filtering

**Steps:**
1. Click on category tabs at the top (Politics, Crypto, Sports, etc.)
2. Markets should filter by category

**✅ Check:**
- Clicking a category shows only that category's markets
- "All" category shows all markets
- Category tab highlights when active
- Stats bar shows correct count

---

### Test 7: AI Chat Assistant

**Steps:**
1. Click "🤖 AI Assistant" button in header
2. Chat window should open (bottom right)
3. Type a question about markets

**✅ Check:**
- Chat window opens smoothly
- Initial greeting message appears
- Can type and send messages
- AI responds (may take a few seconds)
- Typing indicator appears while waiting
- Responses are formatted correctly

**Test Questions:**
1. "What is insider trading?"
2. "Show me markets about bitcoin"
3. "What patterns should I look for?"
4. "Analyze the market [TICKER]" (use a real ticker)

**❌ If AI doesn't respond:**
- Check if `GEMINI_API_KEY` is set in `backend/.env`
- Check backend console for errors
- Verify `/api/chat` endpoint is working

**Manual Test:**
```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, what can you help me with?"}'
```

---

## 🔍 Backend API Testing

### Test All New Endpoints

#### 1. Exchange Status
```bash
curl http://localhost:3001/api/exchange/status
```
**Expected:** JSON with status field

#### 2. Exchange Schedule
```bash
curl http://localhost:3001/api/exchange/schedule
```
**Expected:** JSON with schedule information

#### 3. Exchange Announcements
```bash
curl http://localhost:3001/api/exchange/announcements
```
**Expected:** JSON array of announcements

#### 4. Market Candlesticks
```bash
# First, get a market with series_ticker
curl http://localhost:3001/api/markets?limit=1 | jq '.markets[0] | {ticker, series_ticker}'

# Then test candlesticks (replace values)
curl "http://localhost:3001/api/markets/MARKET-TICKER/candlesticks?seriesTicker=SERIES-TICKER&startTs=1704067200&endTs=1704153600&periodInterval=60"
```
**Expected:** JSON with candlesticks array

#### 5. Batch Candlesticks
```bash
curl "http://localhost:3001/api/markets/candlesticks/batch?tickers=TICKER1,TICKER2&startTs=1704067200&endTs=1704153600&periodInterval=60"
```
**Expected:** JSON with candlesticks object keyed by market ID

#### 6. Individual Series
```bash
# Get a series ticker from markets
curl http://localhost:3001/api/series/SERIES-TICKER
```
**Expected:** JSON with series details

#### 7. Enhanced Market Filtering
```bash
# Test timestamp filters
curl "http://localhost:3001/api/markets?minCreatedTs=1704067200&status=open"

# Test multivariate filter
curl "http://localhost:3001/api/markets?mveFilter=exclude"
```

#### 8. Enhanced Trade Filtering
```bash
curl "http://localhost:3001/api/markets/MARKET-TICKER/trades?minTs=1704067200&maxTs=1704153600"
```

---

## 🐛 Common Issues & Solutions

### Issue 1: Chart Not Loading

**Symptoms:**
- "No price history available" message
- Chart area is empty
- Console shows errors

**Solutions:**
1. Check if market has `series_ticker`:
   ```bash
   curl http://localhost:3001/api/markets/MARKET-TICKER | jq '.market.series_ticker'
   ```
2. If null, this market doesn't have historical data (normal for some markets)
3. Try a different market
4. Check backend logs for API errors

---

### Issue 2: Exchange Status Not Updating

**Symptoms:**
- Status shows "Checking..." forever
- Status doesn't change

**Solutions:**
1. Check backend endpoint:
   ```bash
   curl http://localhost:3001/api/exchange/status
   ```
2. Check browser console for CORS errors
3. Verify backend is running
4. Check network tab for failed requests

---

### Issue 3: Trades Not Filtering

**Symptoms:**
- Time filter dropdown doesn't work
- Same trades show regardless of filter

**Solutions:**
1. Check browser console for errors
2. Verify backend endpoint accepts time parameters
3. Check network tab - should see `minTs` parameter in URL
4. Try refreshing the page

---

### Issue 4: AI Chat Not Responding

**Symptoms:**
- Chat window opens but no response
- Error message appears

**Solutions:**
1. Check `backend/.env` file has `GEMINI_API_KEY`
2. Verify API key is valid
3. Check backend console for errors
4. Test endpoint directly:
   ```bash
   curl -X POST http://localhost:3001/api/chat \
     -H "Content-Type: application/json" \
     -d '{"message": "test"}'
   ```

---

### Issue 5: CORS Errors

**Symptoms:**
- Browser console shows CORS errors
- Requests fail

**Solutions:**
1. Verify backend has CORS enabled (should be in `server.js`)
2. Check backend is running on port 3001
3. Verify frontend is making requests to correct port
4. Check `vite.config.js` has proxy configured (if needed)

---

## ✅ Comprehensive Checklist

### Backend Tests
- [ ] Server starts without errors
- [ ] Events cache loads successfully
- [ ] `/api/health` returns correct status
- [ ] `/api/exchange/status` works
- [ ] `/api/markets` returns markets
- [ ] `/api/markets/:ticker` returns single market
- [ ] `/api/markets/:ticker/candlesticks` works (with valid series)
- [ ] `/api/markets/:ticker/trades` works
- [ ] `/api/markets/:ticker/trades?minTs=...` filters correctly
- [ ] `/api/chat` responds (if API key configured)

### Frontend Tests
- [ ] Page loads without errors
- [ ] Exchange status appears in header
- [ ] Search functionality works
- [ ] Markets display correctly
- [ ] Market details panel opens
- [ ] Price history chart loads (for markets with series_ticker)
- [ ] Chart controls work (period, days)
- [ ] Trade time filter works
- [ ] Category tabs work
- [ ] AI chat opens and responds
- [ ] No console errors
- [ ] No network errors

### Integration Tests
- [ ] Frontend can communicate with backend
- [ ] Data flows correctly (markets → details → chart)
- [ ] Time filters update trades correctly
- [ ] Chart updates when controls change
- [ ] AI context includes candlestick data

---

## 🎯 Quick Smoke Test

Run this 5-minute test to verify everything works:

1. **Start servers** (backend + frontend)
2. **Check header** - Exchange status should show
3. **Search** - Type "bitcoin" and search
4. **Select market** - Click first market result
5. **Check details** - Verify all sections appear
6. **Check chart** - Price history should load
7. **Test filter** - Change trade time filter
8. **Test chat** - Open AI assistant, ask a question

If all 8 steps work, your integration is successful! 🎉

---

## 📊 Performance Testing

### Check Response Times

```bash
# Time the API calls
time curl http://localhost:3001/api/markets?limit=100
time curl http://localhost:3001/api/exchange/status
time curl "http://localhost:3001/api/markets/TICKER/candlesticks?..."
```

**Expected:**
- Markets: < 1 second
- Exchange status: < 500ms
- Candlesticks: < 2 seconds (depends on data range)

### Check Frontend Performance

1. Open browser DevTools → Network tab
2. Reload page
3. Check load times:
   - Initial page load: < 2 seconds
   - Market search: < 1 second
   - Chart load: < 2 seconds

---

## 🔐 Environment Variables Check

Verify your `backend/.env` file:

```bash
# Required for AI chat
GEMINI_API_KEY=your_key_here

# Optional (for authenticated endpoints)
KALSHI_API_KEY_ID=your_key_id
KALSHI_PRIVATE_KEY_PATH=./kalshi-private-key.pem
# OR
KALSHI_PRIVATE_KEY_PEM=your_private_key_content
```

**Note:** Public endpoints work without Kalshi API keys!

---

## 📝 Testing Script

Save this as `test-all.sh` (or `test-all.ps1` for Windows):

```bash
#!/bin/bash

echo "🧪 Testing Kalshi Integration..."

# Test backend health
echo "1. Testing backend health..."
curl -s http://localhost:3001/api/health | jq '.' || echo "❌ Backend not running"

# Test exchange status
echo "2. Testing exchange status..."
curl -s http://localhost:3001/api/exchange/status | jq '.status' || echo "❌ Exchange status failed"

# Test markets
echo "3. Testing markets endpoint..."
curl -s http://localhost:3001/api/markets?limit=5 | jq '.markets | length' || echo "❌ Markets failed"

# Test search
echo "4. Testing search..."
curl -s "http://localhost:3001/api/search?query=bitcoin&limit=5" | jq '.events | length' || echo "❌ Search failed"

echo "✅ Basic tests complete!"
```

---

## 🎓 Next Steps After Testing

Once everything works:

1. **Explore different markets** - Try various categories
2. **Test edge cases** - Markets without series_ticker, closed markets, etc.
3. **Check mobile responsiveness** - Resize browser window
4. **Test with different browsers** - Chrome, Firefox, Safari
5. **Monitor performance** - Check for slow API calls
6. **Read logs** - Check backend console for any warnings

---

## 📞 Getting Help

If something doesn't work:

1. **Check browser console** (F12 → Console tab)
2. **Check network tab** (F12 → Network tab)
3. **Check backend logs** (terminal where backend is running)
4. **Verify endpoints** using curl commands above
5. **Check environment variables** are set correctly

---

## ✅ Success Criteria

Your integration is working correctly if:

✅ All endpoints respond without errors  
✅ Frontend displays all data correctly  
✅ Charts render with price history  
✅ Time filters work for trades  
✅ Exchange status updates automatically  
✅ AI chat responds to questions  
✅ No console errors in browser  
✅ No errors in backend logs  

**Congratulations!** 🎉 You've successfully integrated all Kalshi data extraction features!
