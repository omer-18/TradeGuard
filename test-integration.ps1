# Kalshi Integration Test Script
# Run this to verify everything is working

Write-Host "🧪 Testing Kalshi Integration..." -ForegroundColor Cyan
Write-Host ""

# Test 1: Backend Health
Write-Host "1. Testing backend health..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/health" -Method Get
    Write-Host "   ✅ Backend is running" -ForegroundColor Green
    Write-Host "   Status: $($response.status)" -ForegroundColor Gray
    Write-Host "   Cached Events: $($response.cachedEvents)" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Backend not running or not accessible" -ForegroundColor Red
    Write-Host "   Make sure backend is running: cd backend; npm start" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Test 2: Exchange Status
Write-Host "2. Testing exchange status..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/exchange/status" -Method Get
    Write-Host "   ✅ Exchange status endpoint works" -ForegroundColor Green
    Write-Host "   Exchange Status: $($response.status)" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Exchange status endpoint failed" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 3: Markets Endpoint
Write-Host "3. Testing markets endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/markets?limit=5" -Method Get
    Write-Host "   ✅ Markets endpoint works" -ForegroundColor Green
    Write-Host "   Markets returned: $($response.markets.Count)" -ForegroundColor Gray
    if ($response.markets.Count -gt 0) {
        $firstMarket = $response.markets[0]
        Write-Host "   Sample market: $($firstMarket.ticker) - $($firstMarket.title)" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ❌ Markets endpoint failed" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 4: Search Endpoint
Write-Host "4. Testing search endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/search?query=bitcoin&limit=5" -Method Get
    Write-Host "   ✅ Search endpoint works" -ForegroundColor Green
    Write-Host "   Events found: $($response.total)" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Search endpoint failed" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 5: Categories Endpoint
Write-Host "5. Testing categories endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/categories" -Method Get
    Write-Host "   ✅ Categories endpoint works" -ForegroundColor Green
    Write-Host "   Categories available: $($response.categories.Count)" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Categories endpoint failed" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 6: Check if we can get a market with series_ticker for candlestick testing
Write-Host "6. Finding market with series_ticker for candlestick test..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/markets?limit=50" -Method Get
    $marketWithSeries = $response.markets | Where-Object { $_.series_ticker -ne $null } | Select-Object -First 1
    
    if ($marketWithSeries) {
        Write-Host "   ✅ Found market with series: $($marketWithSeries.ticker)" -ForegroundColor Green
        Write-Host "   Series: $($marketWithSeries.series_ticker)" -ForegroundColor Gray
        
        # Test candlesticks endpoint
        $endTs = [Math]::Floor((Get-Date).ToUniversalTime().Subtract((Get-Date "1970-01-01")).TotalSeconds)
        $startTs = $endTs - (7 * 24 * 60 * 60) # 7 days ago
        
        Write-Host "   Testing candlesticks endpoint..." -ForegroundColor Yellow
        try {
            $candlestickUrl = "http://localhost:3001/api/markets/$($marketWithSeries.ticker)/candlesticks?seriesTicker=$($marketWithSeries.series_ticker)&startTs=$startTs&endTs=$endTs&periodInterval=60"
            $candlestickResponse = Invoke-RestMethod -Uri $candlestickUrl -Method Get
            Write-Host "   ✅ Candlesticks endpoint works" -ForegroundColor Green
            Write-Host "   Candlesticks returned: $($candlestickResponse.candlesticks.Count)" -ForegroundColor Gray
        } catch {
            Write-Host "   ⚠️  Candlesticks endpoint failed (may be normal if market has no history)" -ForegroundColor Yellow
            Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Gray
        }
    } else {
        Write-Host "   ⚠️  No markets with series_ticker found (this is normal)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ Could not test candlesticks" -ForegroundColor Red
}

Write-Host ""
Write-Host "Backend API tests complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Make sure frontend is running: cd frontend; npm run dev" -ForegroundColor White
Write-Host "   2. Open http://localhost:3000 in your browser" -ForegroundColor White
Write-Host "   3. Check the browser console (F12) for any errors" -ForegroundColor White
Write-Host "   4. Test the UI features:" -ForegroundColor White
Write-Host "      - Exchange status in header" -ForegroundColor Gray
Write-Host "      - Search for markets" -ForegroundColor Gray
Write-Host "      - Select a market to see details" -ForegroundColor Gray
Write-Host "      - Check price history chart" -ForegroundColor Gray
Write-Host "      - Test trade time filters" -ForegroundColor Gray
Write-Host "      - Try the AI chat assistant" -ForegroundColor Gray
Write-Host ""
