const axios = require('axios');

// Debug script to test repository creation
async function debugRepoCreation() {
    const baseURL = 'https://oss-michael-production.up.railway.app';
    
    try {
        console.log('🔍 DEBUGGING REPOSITORY CREATION');
        console.log('==================================');
        
        // 1. Check organization name
        console.log('\n1. Checking organization name...');
        const orgResponse = await axios.get(`${baseURL}/api/repo/prodStatus`);
        const organizationGh = orgResponse.data.organizationGh;
        console.log(`✅ Organization: ${organizationGh}`);
        
        // 2. Test repository creation with a single user
        console.log('\n2. Testing repository creation...');
        const testData = {
            organizationGh: organizationGh,
            students: ['debuguser1'],
            className: 'TEST 101',
            groupId: '507f1f77bcf86cd799439011' // Sample MongoDB ObjectId
        };
        
        console.log('📤 Sending repository creation request...');
        console.log('Request data:', JSON.stringify(testData, null, 2));
        
        const createResponse = await axios.post(`${baseURL}/api/repo/createRepos`, testData);
        
        console.log('📥 Repository creation response:');
        console.log('Status:', createResponse.status);
        console.log('Data:', JSON.stringify(createResponse.data, null, 2));
        
        // 3. Wait a moment and check if repository was created
        console.log('\n3. Waiting 3 seconds and checking for new repository...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const reposResponse = await axios.get(`${baseURL}/api/repo/listRepos`, {
            params: { organizationGh }
        });
        
        const allRepos = reposResponse.data.repos || [];
        console.log(`✅ Total repositories after creation: ${allRepos.length}`);
        
        if (allRepos.length > 0) {
            console.log('\n📋 All repositories:');
            allRepos.forEach((repo, index) => {
                console.log(`   ${index + 1}. ${repo.name} (${repo.private ? 'private' : 'public'})`);
            });
        }
        
        // 4. Check for the specific repository we tried to create
        const expectedRepoName = 'test-101-debuguser1';
        const createdRepo = allRepos.find(repo => repo.name === expectedRepoName);
        
        if (createdRepo) {
            console.log(`\n✅ Repository "${expectedRepoName}" was created successfully!`);
        } else {
            console.log(`\n❌ Repository "${expectedRepoName}" was NOT created`);
        }
        
        console.log('\n✅ Repository creation debugging complete!');
        
    } catch (error) {
        console.error('❌ Error during repository creation debugging:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

// Run the debug script
debugRepoCreation(); 