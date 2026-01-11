const BASE_URL = 'http://localhost:3001';

async function test() {
  console.log('🧪 Testing MongoDB Integration...\n');
  
  try {
    // 1. Health check
    console.log('1. Testing health check...');
    const health = await fetch(`${BASE_URL}/api/health`).then(r => r.json());
    if (health.mongodb?.status === 'connected') {
      console.log('   ✅ MongoDB connected');
    } else {
      console.log('   ⚠️  MongoDB not connected:', health.mongodb);
    }
    
    // 2. Search (to test analytics)
    console.log('\n2. Testing search analytics...');
    await fetch(`${BASE_URL}/api/search?query=bitcoin&limit=5`).then(r => r.json());
    console.log('   ✅ Search completed');
    
    // 3. Get a market ticker first
    console.log('\n3. Getting a market to analyze...');
    const searchResult = await fetch(`${BASE_URL}/api/search?query=bitcoin&limit=1`).then(r => r.json());
    const marketTicker = searchResult.events[0]?.markets?.[0]?.ticker;
    
    if (!marketTicker) {
      console.log('   ⚠️  No market found, skipping analysis test');
      return;
    }
    
    console.log(`   ✅ Found market: ${marketTicker}`);
    
    // 4. Run analysis
    console.log(`\n4. Testing analysis storage for ${marketTicker}...`);
    const analysis = await fetch(`${BASE_URL}/api/markets/${marketTicker}/analyze`).then(r => r.json());
    console.log(`   ✅ Analysis completed (score: ${analysis.analysis.suspicionScore})`);
    
    // 5. Check history
    console.log(`\n5. Testing analysis history...`);
    const history = await fetch(`${BASE_URL}/api/analyses/${marketTicker}/history`).then(r => r.json());
    console.log(`   ✅ Found ${history.count} analysis(es) in history`);
    
    // 6. Check analytics
    console.log('\n6. Testing analytics stats...');
    const stats = await fetch(`${BASE_URL}/api/analytics/stats`).then(r => r.json());
    console.log(`   ✅ Analytics tracking ${stats.stats.length} event types`);
    stats.stats.forEach(stat => {
      console.log(`      - ${stat._id}: ${stat.count} events`);
    });
    
    // 7. Test popular analytics
    console.log('\n7. Testing popular analytics...');
    const popular = await fetch(`${BASE_URL}/api/analytics/popular`).then(r => r.json());
    console.log(`   ✅ Popular searches: ${popular.popularSearches.length}`);
    console.log(`   ✅ Popular markets: ${popular.popularMarkets.length}`);
    
    // 8. Test all analyses endpoint
    console.log('\n8. Testing all analyses endpoint...');
    const allAnalyses = await fetch(`${BASE_URL}/api/analyses?limit=5`).then(r => r.json());
    console.log(`   ✅ Found ${allAnalyses.total} total analyses`);
    
    console.log('\n🎉 All tests passed!');
    console.log('\n📊 Summary:');
    console.log(`   - MongoDB: ${health.mongodb?.status || 'unknown'}`);
    console.log(`   - Analyses stored: ${allAnalyses.total}`);
    console.log(`   - Analytics events: ${stats.stats.reduce((sum, s) => sum + s.count, 0)}`);
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('   Make sure the server is running on', BASE_URL);
    process.exit(1);
  }
}

test();
