const axios = require('axios');

const CLASS_ID = '68c1377d73acd40854c5671a';
const BASE_URL = 'http://localhost:3000';

async function testClassAPI() {
    try {
        console.log(`🔍 Testing API for class ID: ${CLASS_ID}`);
        
        // Test the class endpoint
        console.log(`\n📡 Testing: GET ${BASE_URL}/api/group/class/${CLASS_ID}`);
        try {
            const classResponse = await axios.get(`${BASE_URL}/api/group/class/${CLASS_ID}`);
            console.log('✅ Class API Response:', {
                status: classResponse.status,
                groupName: classResponse.data.groupName,
                groupID: classResponse.data.groupID,
                classCode: classResponse.data.classCode
            });
        } catch (error) {
            console.log('❌ Class API Error:', {
                status: error.response?.status,
                message: error.response?.data?.error || error.message
            });
        }
        
        // Test the quest JSON config endpoint
        console.log(`\n📡 Testing: GET ${BASE_URL}/api/group/${CLASS_ID}/quest-json-config`);
        try {
            const configResponse = await axios.get(`${BASE_URL}/api/group/${CLASS_ID}/quest-json-config`);
            console.log('✅ Quest Config API Response:', {
                status: configResponse.status,
                success: configResponse.data.success,
                hasConfig: configResponse.data.data?.hasConfig,
                questSequence: configResponse.data.data?.questJsonConfig?.questSequence?.length || 0
            });
            
            if (configResponse.data.data?.questJsonConfig?.questSequence) {
                console.log('📋 Quest Sequence:');
                configResponse.data.data.questJsonConfig.questSequence.forEach((quest, index) => {
                    console.log(`  ${index}: ${quest.questId} - ${quest.title} (prereq: ${quest.metadata?.prerequisite || 'none'})`);
                });
            }
        } catch (error) {
            console.log('❌ Quest Config API Error:', {
                status: error.response?.status,
                message: error.response?.data?.error || error.message
            });
        }
        
    } catch (error) {
        console.error('❌ General Error:', error.message);
    }
}

// Run the script
testClassAPI();
