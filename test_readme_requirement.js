const axios = require('axios');
require('dotenv').config();

// Configuration
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

async function testReadmeRequirement() {
    console.log('🧪 Testing README requirement enforcement...\n');
    
    const testCases = [
        {
            name: 'Test 1: Create single repo without README',
            endpoint: '/api/repo/repository',
            data: {
                organizationGh: 'OSS-Doorway',
                studentId: 'test-student-id',
                studentGithubUsername: 'testuser',
                groupId: 'non-existent-group-id',
                groupName: 'Test Class'
            },
            expectedStatus: 400,
            expectedMessage: 'A README must be configured for this class before creating student repositories'
        },
        {
            name: 'Test 2: Create multiple repos without README',
            endpoint: '/api/repo/createRepos',
            data: {
                organizationGh: 'OSS-Doorway',
                students: ['testuser1', 'testuser2'],
                className: 'Test Class',
                groupId: 'non-existent-group-id'
            },
            expectedStatus: 400,
            expectedMessage: 'A README must be configured for this class before creating student repositories'
        }
    ];

    for (const testCase of testCases) {
        try {
            console.log(`📋 ${testCase.name}`);
            
            const response = await axios.post(`${BACKEND_URL}${testCase.endpoint}`, testCase.data);
            
            if (response.status === testCase.expectedStatus) {
                console.log('✅ PASS: Correctly blocked repository creation');
                if (response.data.message && response.data.message.includes(testCase.expectedMessage)) {
                    console.log('✅ PASS: Correct error message returned');
                } else {
                    console.log('⚠️  WARNING: Error message format may be different');
                }
            } else {
                console.log(`❌ FAIL: Expected status ${testCase.expectedStatus}, got ${response.status}`);
            }
            
        } catch (error) {
            if (error.response && error.response.status === testCase.expectedStatus) {
                console.log('✅ PASS: Correctly blocked repository creation');
                if (error.response.data.message && error.response.data.message.includes(testCase.expectedMessage)) {
                    console.log('✅ PASS: Correct error message returned');
                    console.log(`📝 Message: "${error.response.data.message}"`);
                } else {
                    console.log('⚠️  WARNING: Error message format may be different');
                    console.log(`📝 Actual message: "${error.response.data.message}"`);
                }
            } else {
                console.log(`❌ FAIL: Expected status ${testCase.expectedStatus}, got ${error.response?.status || 'network error'}`);
                console.log(`📝 Error: ${error.message}`);
            }
        }
        console.log(''); // Empty line for readability
    }
    
    console.log('🎯 Test Summary:');
    console.log('- Backend should now enforce README requirement');
    console.log('- Users will see clear error message if no README is configured');
    console.log('- Repository creation will be blocked until README is added');
}

// Run the test
testReadmeRequirement()
    .then(() => {
        console.log('\n✅ README requirement enforcement test completed!');
    })
    .catch(error => {
        console.error('\n💥 Test failed:', error.message);
        process.exit(1);
    }); 