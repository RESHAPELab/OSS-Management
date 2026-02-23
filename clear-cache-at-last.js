const axios = require('axios');

const CLASS_ID = '692735b4668a78a28bcf7c3e';

async function clearCache() {
  console.log(`🗑️ Clearing cache for class: ${CLASS_ID}\n`);
  
  // Try multiple potential OSS-Doorway URLs
  const doorwayUrls = [
    process.env.OSS_DOORWAY_URL,
    process.env.OSS_DOORWAY_CACHE_BASE,
    'https://oss-doorway.onrender.com',
    'http://localhost:4000',
    'http://localhost:3000'
  ].filter(Boolean);

  console.log('Attempting cache invalidation at the following endpoints:');
  doorwayUrls.forEach(url => console.log(`  - ${url}`));
  console.log('');

  let successCount = 0;
  
  for (const baseUrl of doorwayUrls) {
    try {
      console.log(`\n🔄 Trying ${baseUrl}...`);
      
      // Method 1: Delete specific cache entry
      try {
        const deleteUrl = `${baseUrl}/api/cache/delete/${encodeURIComponent(CLASS_ID)}`;
        console.log(`  DELETE ${deleteUrl}`);
        const deleteResponse = await axios.delete(deleteUrl, { timeout: 5000 });
        console.log(`  ✅ Specific cache deletion: ${deleteResponse.status} ${deleteResponse.statusText}`);
        successCount++;
      } catch (deleteError) {
        if (deleteError.code === 'ECONNREFUSED') {
          console.log(`  ⚠️  Connection refused (service may be down)`);
        } else if (deleteError.response) {
          console.log(`  ⚠️  Delete response: ${deleteError.response.status}`);
        } else {
          console.log(`  ⚠️  Delete failed: ${deleteError.message}`);
        }
      }

      // Method 2: Clear all cache
      try {
        const clearUrl = `${baseUrl}/api/cache/clear`;
        console.log(`  POST ${clearUrl}`);
        const clearResponse = await axios.post(clearUrl, {}, { timeout: 5000 });
        console.log(`  ✅ Full cache clear: ${clearResponse.status} ${clearResponse.statusText}`);
        successCount++;
      } catch (clearError) {
        if (clearError.code === 'ECONNREFUSED') {
          console.log(`  ⚠️  Connection refused (service may be down)`);
        } else if (clearError.response) {
          console.log(`  ⚠️  Clear response: ${clearError.response.status}`);
        } else {
          console.log(`  ⚠️  Clear failed: ${clearError.message}`);
        }
      }
      
    } catch (error) {
      console.log(`  ❌ Failed to reach ${baseUrl}: ${error.message}`);
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  if (successCount > 0) {
    console.log(`✅ Cache invalidation successful! (${successCount} operations completed)`);
    console.log(`\nThe OSS-Doorway bot should now fetch the fresh config with 6 tasks.`);
    console.log(`Student misanetc should see the updated quest configuration.`);
  } else {
    console.log(`⚠️  No cache invalidation succeeded.`);
    console.log(`\nPossible reasons:`);
    console.log(`  1. OSS-Doorway service is not running`);
    console.log(`  2. Cache endpoints are not accessible`);
    console.log(`  3. Firewall or network issues`);
    console.log(`\nAlternative: The cache has a 1-hour TTL and will auto-expire.`);
  }
  console.log(`${'='.repeat(60)}\n`);
}

clearCache().catch(console.error);

