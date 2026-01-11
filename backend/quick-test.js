const BASE_URL = 'http://localhost:3001';

async function testEndpoint(name, url) {
  try {
    const response = await fetch(url);
    const data = await response.json();
    console.log(`\n✅ ${name}:`);
    console.log(JSON.stringify(data, null, 2).substring(0, 300) + '...');
    return true;
  } catch (error) {
    console.log(`\n❌ ${name}: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('🧪 Quick MongoDB Integration Tests\n');
  
  await testEndpoint('Health Check', `${BASE_URL}/api/health`);
  await testEndpoint('High-Risk Analyses', `${BASE_URL}/api/analyses/high-risk`);
  await testEndpoint('All Analyses (limit 3)', `${BASE_URL}/api/analyses?limit=3`);
  await testEndpoint('Analytics Stats', `${BASE_URL}/api/analytics/stats`);
  await testEndpoint('Popular Analytics', `${BASE_URL}/api/analytics/popular`);
  
  console.log('\n✅ All endpoint tests completed!');
}

runTests().catch(console.error);
