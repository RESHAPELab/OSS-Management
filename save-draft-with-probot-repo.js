/**
 * Script to save the updated draft quest config with probot repo to backend
 */

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CLASS_ID = '696ebe63b1aef30efd02e0f8';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

async function saveDraftConfig() {
    try {
        console.log('📖 Reading draft quest config from file...');
        const configPath = path.join(__dirname, 'shared-quest-configs', `quest_config_${CLASS_ID}.json`);
        const draftQuestConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        
        console.log(`✅ Read draft quest config: ${draftQuestConfig.questSequence?.length || 0} quests`);
        
        // Verify probot-test-org/test-repo references
        let probotReferencesFound = 0;
        draftQuestConfig.questSequence.forEach((quest, questIdx) => {
            if (quest.tasks) {
                for (const taskId in quest.tasks) {
                    const task = quest.tasks[taskId];
                    if (task.ossRepository === "probot-test-org/test-repo") {
                        probotReferencesFound++;
                        console.log(`  ✅ Quest ${questIdx + 1} (${quest.questId}), Task ${taskId}: has probot repo`);
                    }
                }
            }
        });
        console.log(`\n📊 Found ${probotReferencesFound} tasks with probot-test-org/test-repo references`);
        
        // Save to backend
        console.log(`\n💾 Saving draft config to backend...`);
        const response = await axios.post(
            `${BACKEND_URL}/api/group/${CLASS_ID}/draft-quest-config`,
            { draftQuestConfig },
            {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            }
        );
        
        if (response.data && response.data.success) {
            console.log('✅ Draft quest config saved successfully to backend!');
            console.log(`   Quest count: ${response.data.questCount || 'N/A'}`);
            console.log(`   Last updated: ${response.data.lastUpdated || 'N/A'}`);
        } else {
            console.log('⚠️  Backend response:', response.data);
        }
        
    } catch (error) {
        console.error('❌ Error saving draft config:', error.message);
        if (error.response) {
            console.error('   Response status:', error.response.status);
            console.error('   Response data:', error.response.data);
        }
        process.exit(1);
    }
}

saveDraftConfig();
