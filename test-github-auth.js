const axios = require('axios');

async function testGitHubAuth() {
    console.log('🔍 Testing GitHub App authentication on Railway backend...\n');
    
    try {
        // Test 1: Check if backend is responding
        console.log('1️⃣ Testing backend connectivity...');
        const backendResponse = await axios.get('https://oss-michael-production.up.railway.app/api/quest/list');
        console.log('✅ Backend is responding');
        console.log('   Status:', backendResponse.status);
        console.log('   Response:', backendResponse.data.message || 'Success');
        
    } catch (error) {
        console.log('❌ Backend error:', error.response?.data?.message || error.message);
    }
    
    try {
        // Test 2: Test the specific endpoint that was failing
        console.log('\n2️⃣ Testing repository listing endpoint...');
        const repoResponse = await axios.get('https://oss-michael-production.up.railway.app/api/repo/listRepos?organizationGh=OSS-Doorway-Dev');
        console.log('✅ Repository endpoint working');
        console.log('   Response:', repoResponse.data);
        
    } catch (error) {
        console.log('❌ Repository endpoint error:', error.response?.data?.message || error.message);
        console.log('   Full error:', error.response?.data);
    }
    
    try {
        // Test 3: Check bot service
        console.log('\n3️⃣ Testing bot service...');
        const botResponse = await axios.get('https://oss-timi.up.railway.app/');
        console.log('✅ Bot service is responding');
        console.log('   Status:', botResponse.status);
        
    } catch (error) {
        console.log('❌ Bot service error:', error.response?.data?.message || error.message);
    }
    
    console.log('\n🔍 Summary:');
    console.log('- Backend URL: https://oss-michael-production.up.railway.app/');
    console.log('- Bot URL: https://oss-timi.up.railway.app/');
    console.log('- Check Railway dashboard for deployment status');
    console.log('- Verify environment variables are set correctly');
}

testGitHubAuth().catch(console.error); 