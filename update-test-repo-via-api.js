require('dotenv').config({ path: require('path').join(__dirname, 'backend', '.env') });
const axios = require('axios');
const fs = require('fs');

const CLASS_ID = '696ebe63b1aef30efd02e0f8';
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';

async function updateTestRepoViaAPI() {
    try {
        // 1. Read the latest draft quest config (same format as frontend sends)
        const configPath = require('path').join(__dirname, 'shared-quest-configs', `quest_config_${CLASS_ID}.json`);
        const draftQuestConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

        console.log(`📖 Reading draft quest config from: ${configPath}`);
        console.log(`📊 Quest count: ${draftQuestConfig.questSequence?.length || 0}`);

        // 2. Call the backend API endpoint (same as frontend does)
        console.log(`\n🔄 Calling backend API to save draft quest config...`);
        console.log(`   Endpoint: ${API_BASE_URL}/api/group/${CLASS_ID}/draft-quest-config`);

        const response = await axios.post(
            `${API_BASE_URL}/api/group/${CLASS_ID}/draft-quest-config`,
            { draftQuestConfig },
            {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 30000 // 30 second timeout
            }
        );

        if (response.data.success) {
            console.log(`\n✅ Successfully saved draft quest config via API!`);
            console.log(`📋 Response:`, JSON.stringify(response.data, null, 2));
            console.log(`\n💡 Note: The backend will also save this to the OSS-Doorway DB (questconfigs collection)`);
            console.log(`   for test repos. However, it creates a NEW testGroupId each time.`);
            console.log(`   To update EXISTING test repo configs, you may need to manually update them in MongoDB.`);
        } else {
            console.error(`\n❌ Backend reported failure:`, response.data);
            process.exit(1);
        }

    } catch (error) {
        console.error('\n❌ Error calling API:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
        if (error.code === 'ECONNREFUSED') {
            console.error('\n💡 Make sure the backend server is running on', API_BASE_URL);
        }
        process.exit(1);
    }
}

updateTestRepoViaAPI();
