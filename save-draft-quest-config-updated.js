require('dotenv').config({ path: require('path').join(__dirname, 'backend', '.env') });
const fs = require('fs');
const axios = require('axios');

const CLASS_ID = '696ebe63b1aef30efd02e0f8';
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';

async function saveDraftQuestConfig() {
    try {
        // Read the draft quest config file
        const configPath = require('path').join(__dirname, 'shared-quest-configs', `quest_config_${CLASS_ID}.json`);
        const draftQuestConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

        console.log(`📖 Reading draft quest config from: ${configPath}`);
        console.log(`📊 Quest count: ${draftQuestConfig.questSequence?.length || 0}`);

        // Save to backend
        const response = await axios.post(
            `${API_BASE_URL}/api/group/${CLASS_ID}/draft-quest-config`,
            { draftQuestConfig },
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log(`✅ Successfully saved draft quest config to backend`);
        console.log(`📋 Response:`, JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('❌ Error saving draft quest config:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
        process.exit(1);
    }
}

saveDraftQuestConfig();
