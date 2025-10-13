const mongoose = require('mongoose');
const { MongoClient } = require('mongodb');

// MongoDB connections
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/oss-management';
const OSS_DOORWAY_DB_URI = process.env.OSS_DOORWAY_DB_URI || 'mongodb+srv://cna93:gamification@gamification.nwes9ze.mongodb.net/?retryWrites=true&w=majority&appName=gamification';
const OSS_DOORWAY_DB_NAME = process.env.OSS_DOORWAY_DB_NAME || 'test';

const CLASS_ID = '68c1377d73acd40854c5671a';

async function findAndModifyQ5Prereq() {
    let ossDoorwayClient;
    
    try {
        console.log('🔍 Finding and modifying Q5 prerequisite for class:', CLASS_ID);
        
        // Connect to OSS-Doorway database where quest configs are stored
        console.log('📡 Connecting to OSS-Doorway database...');
        ossDoorwayClient = new MongoClient(OSS_DOORWAY_DB_URI);
        await ossDoorwayClient.connect();
        const ossDoorwayDb = ossDoorwayClient.db(OSS_DOORWAY_DB_NAME);
        
        console.log('✅ Connected to OSS-Doorway database');
        
        // Find the latest purple config for this class
        const questConfigsCollection = ossDoorwayDb.collection('quest_configs');
        
        console.log('🔍 Searching for purple configs...');
        const purpleConfigs = await questConfigsCollection.find({
            classId: { $regex: new RegExp(`^${CLASS_ID}_purple_`) }
        }).sort({ createdAt: -1 }).toArray();
        
        if (purpleConfigs.length === 0) {
            console.log('❌ No purple configs found. Looking for original config...');
            
            // Look for original config
            const originalConfig = await questConfigsCollection.findOne({
                classId: CLASS_ID
            });
            
            if (!originalConfig) {
                console.log('❌ No original config found either');
                return;
            }
            
            console.log('✅ Found original config:', originalConfig.classId);
            await modifyQuestPrerequisites(originalConfig, questConfigsCollection);
        } else {
            console.log(`✅ Found ${purpleConfigs.length} purple configs`);
            const latestPurpleConfig = purpleConfigs[0];
            console.log('📋 Latest purple config:', latestPurpleConfig.classId);
            await modifyQuestPrerequisites(latestPurpleConfig, questConfigsCollection);
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        if (ossDoorwayClient) {
            await ossDoorwayClient.close();
            console.log('🔌 Disconnected from OSS-Doorway database');
        }
    }
}

async function modifyQuestPrerequisites(config, collection) {
    try {
        console.log(`\n🔧 Modifying quest prerequisites in config: ${config.classId}`);
        
        // Check if this config has questSequence (new format) or individual quest objects (old format)
        let questSequence = null;
        
        if (config.questSequence && Array.isArray(config.questSequence)) {
            console.log('📋 Using questSequence format');
            questSequence = config.questSequence;
        } else {
            console.log('📋 Using legacy format - extracting quests from config object');
            const configData = config.config || config;
            const questKeys = Object.keys(configData).filter(key => key.startsWith('Q') && key !== 'map_repo_link');
            questSequence = questKeys.map(key => ({
                questId: key,
                title: configData[key].metadata?.title || key,
                metadata: configData[key].metadata || {},
                tasks: configData[key].tasks || {}
            }));
        }
        
        console.log(`📊 Found ${questSequence.length} quests:`, questSequence.map(q => q.questId).join(', '));
        
        // Find Q5 and modify its prerequisite
        const q5Index = questSequence.findIndex(quest => quest.questId === 'Q5');
        if (q5Index === -1) {
            console.log('❌ Q5 not found in quest sequence');
            return;
        }
        
        const q5 = questSequence[q5Index];
        console.log(`\n🎯 Found Q5 at index ${q5Index}:`, {
            questId: q5.questId,
            title: q5.title,
            currentPrereq: q5.metadata?.prerequisite || 'none'
        });
        
        // Update Q5's prerequisite to Q3
        if (q5.metadata) {
            q5.metadata.prerequisite = 'Q3';
        } else {
            q5.metadata = { prerequisite: 'Q3' };
        }
        
        console.log('✅ Updated Q5 prerequisite to Q3');
        
        // If this was a legacy format, we need to update the config object
        if (!config.questSequence) {
            const questId = q5.questId;
            if (config.config && config.config[questId]) {
                config.config[questId].metadata.prerequisite = 'Q3';
            } else if (config[questId]) {
                config[questId].metadata.prerequisite = 'Q3';
            }
        }
        
        // Create a new purple config with the updated prerequisites
        const timestamp = Date.now();
        const newConfigId = `${CLASS_ID}_purple_${timestamp}`;
        
        const newConfig = {
            ...config,
            _id: new mongoose.Types.ObjectId(),
            classId: newConfigId,
            groupId: newConfigId,
            configId: newConfigId,
            createdAt: new Date(),
            updatedAt: new Date(),
            isPurpleDeployment: true,
            isPrerequisiteEdit: true,
            baseConfigId: config._id,
            editedQuest: { questId: 'Q5', prerequisite: 'Q3' },
            editedAt: new Date()
        };
        
        // Insert the new config
        console.log(`💾 Creating new purple config: ${newConfigId}`);
        await collection.insertOne(newConfig);
        console.log('✅ New purple config created successfully');
        
        // Display the final quest sequence with prerequisites
        console.log('\n📋 Final quest sequence with prerequisites:');
        questSequence.forEach((quest, index) => {
            const prereq = quest.metadata?.prerequisite || 'none';
            console.log(`  ${index}: ${quest.questId} - ${quest.title} (prereq: ${prereq})`);
        });
        
    } catch (error) {
        console.error('❌ Error modifying quest prerequisites:', error);
    }
}

// Run the script
findAndModifyQ5Prereq();
