const { MongoClient } = require('mongodb');

// Configuration
const OSS_DOORWAY_URI = process.env.OSS_DOORWAY_DB_URI || 'mongodb+srv://cna93:gamification@gamification.nwes9ze.mongodb.net/?retryWrites=true&w=majority&appName=gamification';
const OSS_DOORWAY_DB_NAME = process.env.OSS_DOORWAY_DB_NAME || 'test';

// Class ID we're checking
const CLASS_ID = '68a770b8140b9c0174c13ce7';

async function findCurrentActiveConfig() {
    console.log(`🔍 Finding current active configuration for class: ${CLASS_ID}`);
    
    const client = new MongoClient(OSS_DOORWAY_URI);
    
    try {
        await client.connect();
        console.log(`✅ Connected to OSS-Doorway database`);
        
        const db = client.db(OSS_DOORWAY_DB_NAME);
        
        // Check questconfigs collection for all configs related to this class
        console.log(`\n📋 QUESTCONFIGS COLLECTION:`);
        console.log(`=====================================`);
        
        const allConfigs = await db.collection('questconfigs').find({
            $or: [
                { classId: CLASS_ID },
                { classId: { $regex: `${CLASS_ID}_purple_` } },
                { groupId: CLASS_ID },
                { groupId: { $regex: `${CLASS_ID}_purple_` } },
                { configId: CLASS_ID },
                { configId: { $regex: `${CLASS_ID}_purple_` } }
            ]
        }).sort({ createdAt: -1 }).toArray();
        
        console.log(`✅ Found ${allConfigs.length} configurations for class ${CLASS_ID}`);
        
        if (allConfigs.length > 0) {
            console.log(`\n📊 CONFIGURATION TIMELINE:`);
            console.log(`=====================================`);
            
            allConfigs.forEach((config, index) => {
                const isPurple = config.isPurpleDeployment || config.classId?.includes('_purple_');
                const configData = config.config || config.configData || config.questConfig || {};
                const questKeys = Object.keys(configData).filter(k => k.startsWith('Q'));
                
                console.log(`\n${index + 1}. ${isPurple ? '🟣 PURPLE DEPLOY' : '📋 ORIGINAL CONFIG'}`);
                console.log(`   Document ID: ${config._id}`);
                console.log(`   Class ID: ${config.classId}`);
                console.log(`   Created: ${config.createdAt}`);
                console.log(`   Updated: ${config.updatedAt}`);
                console.log(`   Is Purple: ${isPurple}`);
                if (isPurple) {
                    console.log(`   Base Config ID: ${config.baseConfigId}`);
                    console.log(`   Deployed Quest: ${config.deployedQuestId}`);
                    console.log(`   Deployed At: ${config.deployedAt}`);
                }
                console.log(`   Available Quests: ${questKeys.join(', ')}`);
                
                // Show quest details
                questKeys.forEach(questId => {
                    const quest = configData[questId];
                    if (quest && quest.metadata) {
                        console.log(`     ${questId}: ${quest.metadata.title || 'No title'} (${quest.metadata.type || 'No type'})`);
                    }
                });
            });
            
            // Determine which config would be used for the next purple deploy
            console.log(`\n🎯 NEXT PURPLE DEPLOY TARGET:`);
            console.log(`=====================================`);
            
            // The most recent config (first in sorted list) would be the base for next purple deploy
            const latestConfig = allConfigs[0];
            const isLatestPurple = latestConfig.isPurpleDeployment || latestConfig.classId?.includes('_purple_');
            
            console.log(`✅ Next purple deploy will append to:`);
            console.log(`   Document ID: ${latestConfig._id}`);
            console.log(`   Class ID: ${latestConfig.classId}`);
            console.log(`   Type: ${isLatestPurple ? 'Purple Deploy Config' : 'Original Config'}`);
            console.log(`   Current Quests: ${Object.keys(latestConfig.config || latestConfig.configData || latestConfig.questConfig || {}).filter(k => k.startsWith('Q')).join(', ')}`);
            
            if (isLatestPurple) {
                console.log(`   Base Config ID: ${latestConfig.baseConfigId}`);
                console.log(`   Last Deployed Quest: ${latestConfig.deployedQuestId}`);
            }
            
            console.log(`\n🔄 PURPLE DEPLOY PROCESS:`);
            console.log(`=====================================`);
            console.log(`1. Load this config: ${latestConfig._id}`);
            console.log(`2. Extract existing quests: ${Object.keys(latestConfig.config || latestConfig.configData || latestConfig.questConfig || {}).filter(k => k.startsWith('Q')).join(', ')}`);
            console.log(`3. Append new Q5 quest`);
            console.log(`4. Create new purple config with timestamp`);
            console.log(`5. Save to questconfigs collection`);
            
        } else {
            console.log(`❌ No configurations found for this class`);
        }
        
        // Also check quest_configs collection
        console.log(`\n📋 QUEST_CONFIGS COLLECTION:`);
        console.log(`=====================================`);
        
        const questConfigs = await db.collection('quest_configs').find({
            $or: [
                { classId: CLASS_ID },
                { groupId: CLASS_ID },
                { configId: CLASS_ID }
            ]
        }).sort({ createdAt: -1 }).toArray();
        
        if (questConfigs.length > 0) {
            console.log(`✅ Found ${questConfigs.length} configurations in quest_configs collection`);
            questConfigs.forEach((config, index) => {
                console.log(`   ${index + 1}. ID: ${config._id}, Class: ${config.classId}, Created: ${config.createdAt}`);
            });
        } else {
            console.log(`❌ No configurations found in quest_configs collection`);
        }
        
    } catch (error) {
        console.error(`❌ Error:`, error);
    } finally {
        await client.close();
        console.log(`\n🔌 Database connection closed`);
    }
}

console.log(`🚀 Finding current active configuration for class: ${CLASS_ID}`);
findCurrentActiveConfig();
