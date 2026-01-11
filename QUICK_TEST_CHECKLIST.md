# Quick Test Checklist ✅

## 🚀 Start Servers

```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

---

## ✅ Visual Checks (5 minutes)

### 1. Page Loads
- [ ] Open http://localhost:3000
- [ ] Page loads without errors
- [ ] Header shows "INSIDER DETECTOR"
- [ ] No red errors in browser console (F12)

### 2. Exchange Status
- [ ] Green or red dot appears in header (top right)
- [ ] Status text shows "Exchange Open" or similar
- [ ] Status updates after 30 seconds

### 3. Search Works
- [ ] Type "bitcoin" in search box
- [ ] Click "SEARCH" or press Enter
- [ ] Markets appear in grid
- [ ] Each market shows title, price, category

### 4. Market Details
- [ ] Click on any market
- [ ] Details panel opens on right
- [ ] Shows market title, description, prices
- [ ] Shows volume, open interest, status

### 5. Price History Chart
- [ ] Scroll down in details panel
- [ ] "Price History" section appears
- [ ] Chart loads (may take 1-2 seconds)
- [ ] Green/red candlestick bars visible
- [ ] Chart controls visible (Period, Days dropdowns)

### 6. Chart Controls
- [ ] Change Period from "1 Hour" to "1 Day"
- [ ] Chart reloads with different data
- [ ] Change Days from "7 Days" to "30 Days"
- [ ] Chart shows more historical data

### 7. Trade Filtering
- [ ] Scroll to "Recent Trades" section
- [ ] Dropdown shows: All Time, Last Hour, Last 24 Hours, Last 7 Days
- [ ] Select "Last Hour"
- [ ] Trades reload (loading indicator appears)
- [ ] Only recent trades shown

### 8. AI Chat
- [ ] Click "🤖 AI Assistant" button
- [ ] Chat window opens (bottom right)
- [ ] Type "What is insider trading?"
- [ ] AI responds (may take a few seconds)
- [ ] Response is formatted correctly

---

## 🔍 Browser Console Check

1. Press **F12** to open DevTools
2. Go to **Console** tab
3. Look for:
   - ✅ No red errors
   - ✅ No CORS errors
   - ✅ No 404 errors
   - ⚠️ Warnings are usually OK

---

## 🌐 Network Check

1. Press **F12** → **Network** tab
2. Reload page
3. Check these requests succeed (green status):
   - `/api/health` - 200 OK
   - `/api/exchange/status` - 200 OK
   - `/api/search` or `/api/events` - 200 OK
   - `/api/markets/:ticker` - 200 OK (when market selected)
   - `/api/markets/:ticker/candlesticks` - 200 OK (if market has series)

---

## 🐛 Common Issues Quick Fix

| Issue | Quick Fix |
|-------|-----------|
| Chart doesn't show | Market may not have `series_ticker` - try different market |
| Exchange status stuck | Check backend is running, refresh page |
| Trades don't filter | Check browser console, refresh page |
| AI doesn't respond | Check `GEMINI_API_KEY` in `backend/.env` |
| CORS errors | Verify backend on port 3001, frontend on 3000 |

---

## ✅ Success Criteria

If you can:
- ✅ See exchange status
- ✅ Search and find markets
- ✅ View market details
- ✅ See price history chart (for markets that have it)
- ✅ Filter trades by time
- ✅ Chat with AI assistant

**Then everything is working! 🎉**

---

## 📞 Still Having Issues?

1. **Run the test script:**
   ```powershell
   .\test-integration.ps1
   ```

2. **Check backend logs** (terminal where backend is running)

3. **Check browser console** (F12 → Console)

4. **Verify environment:**
   - Backend running on port 3001
   - Frontend running on port 3000
   - No port conflicts

5. **Read full guide:** `TESTING_GUIDE_COMPLETE.md`
