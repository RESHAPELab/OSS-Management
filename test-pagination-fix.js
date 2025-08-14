const axios = require('axios');

// Test script to verify pagination fix
async function testPaginationFix() {
    const baseURL = 'http://localhost:8080';
    
    try {
        console.log('🧪 TESTING PAGINATION FIX');
        console.log('==========================');
        
        // 1. Check organization name
        console.log('\n1. Getting organization name...');
        const orgResponse = await axios.get(`${baseURL}/api/repo/prodStatus`);
        const organizationGh = orgResponse.data.organizationGh;
        console.log(`✅ Organization: ${organizationGh}`);
        
        // 2. Test repository listing
        console.log('\n2. Testing repository listing with pagination...');
        const startTime = Date.now();
        
        const reposResponse = await axios.get(`${baseURL}/api/repo/listRepos`, {
            params: { organizationGh }
        });
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        console.log('✅ Repository listing successful');
        console.log(`⏱️  Request duration: ${duration}ms`);
        console.log('📊 Response structure:', {
            hasMessage: !!reposResponse.data.message,
            hasRepos: !!reposResponse.data.repos,
            reposType: typeof reposResponse.data.repos,
            reposLength: Array.isArray(reposResponse.data.repos) ? reposResponse.data.repos.length : 'not an array'
        });
        
        if (Array.isArray(reposResponse.data.repos)) {
            console.log(`📈 Total repositories: ${reposResponse.data.repos.length}`);
            
            if (reposResponse.data.repos.length > 30) {
                console.log('✅ SUCCESS: More than 30 repositories fetched - pagination is working!');
            } else if (reposResponse.data.repos.length === 30) {
                console.log('⚠️  WARNING: Exactly 30 repositories - might still be hitting pagination limit');
            } else {
                console.log('ℹ️  INFO: Less than 30 repositories - this might be normal if organization has fewer repos');
            }
            
            // Show first few repositories
            console.log('\n📋 First 10 repositories:');
            reposResponse.data.repos.slice(0, 10).forEach((repo, index) => {
                console.log(`   ${index + 1}. ${repo.name} (${repo.private ? 'private' : 'public'})`);
            });
            
            if (reposResponse.data.repos.length > 10) {
                console.log(`   ... and ${reposResponse.data.repos.length - 10} more`);
            }
        } else {
            console.log('❌ ERROR: Response does not contain a valid repos array');
        }
        
    } catch (error) {
        console.error('❌ ERROR:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

// Run the test
testPaginationFix(); 