const { MongoClient } = require('mongodb');

// Configuration
const OSS_DOORWAY_URI = process.env.OSS_DOORWAY_DB_URI || 'mongodb+srv://cna93:gamification@gamification.nwes9ze.mongodb.net/?retryWrites=true&w=majority&appName=gamification';
const OSS_DOORWAY_DB_NAME = process.env.OSS_DOORWAY_DB_NAME || 'test';

// Target class ID
const TARGET_CLASS_ID = '68a770b8140b9c0174c13ce7';

async function getQuestConfig() {
    console.log(`🔍 Getting quest config for class ID: ${TARGET_CLASS_ID}`);
    
    const client = new MongoClient(OSS_DOORWAY_URI);
    
    try {
        await client.connect();
        console.log(`✅ Connected to OSS-Doorway database`);
        
        const db = client.db(OSS_DOORWAY_DB_NAME);
        
        // Try to find quest config in different possible collections
        const collections = ['quest_configs', 'questconfigs', 'configs', 'quest_config'];
        let questConfig = null;
        let foundInCollection = null;
        
        for (const collectionName of collections) {
            console.log(`🔍 Searching in collection: ${collectionName}`);
            
            try {
                const result = await db.collection(collectionName).findOne({
                    $or: [
                        { groupId: TARGET_CLASS_ID },
                        { configId: TARGET_CLASS_ID },
                        { classId: TARGET_CLASS_ID },
                        { _id: TARGET_CLASS_ID }
                    ]
                });
                
                if (result) {
                    questConfig = result;
                    foundInCollection = collectionName;
                    console.log(`✅ Found quest config in collection: ${collectionName}`);
                    break;
                }
            } catch (error) {
                console.log(`⚠️ Error searching in ${collectionName}: ${error.message}`);
            }
        }
        
        if (!questConfig) {
            console.log(`❌ No quest config found for class ${TARGET_CLASS_ID}`);
            console.log(`\n🔍 Available collections in database:`);
            
            try {
                const allCollections = await db.listCollections().toArray();
                allCollections.forEach(col => {
                    console.log(`   - ${col.name}`);
                });
            } catch (error) {
                console.log(`⚠️ Could not list collections: ${error.message}`);
            }
            
            return;
        }
        
        console.log(`\n📋 QUEST CONFIGURATION:`);
        console.log(`=====================================`);
        console.log(`Collection: ${foundInCollection}`);
        console.log(`Config ID: ${questConfig._id}`);
        
        // Show all top-level fields
        console.log(`\n📊 CONFIG FIELDS:`);
        Object.keys(questConfig).forEach(key => {
            const value = questConfig[key];
            if (typeof value === 'object' && value !== null) {
                console.log(`   ${key}: [Object] (${Array.isArray(value) ? 'Array' : 'Object'})`);
            } else {
                console.log(`   ${key}: ${value}`);
            }
        });
        
        // Try to parse and show quest sequence if available
        if (questConfig.configData) {
            console.log(`\n🔍 PARSING CONFIG DATA:`);
            try {
                let configData;
                if (typeof questConfig.configData === 'string') {
                    configData = JSON.parse(questConfig.configData);
                } else {
                    configData = questConfig.configData;
                }
                
                if (configData.questSequence) {
                    console.log(`✅ Quest Sequence Found:`);
                    configData.questSequence.forEach((quest, index) => {
                        console.log(`   ${index + 1}. ${quest.questId || quest.id || 'Unknown'}: ${quest.title || quest.name || 'No title'}`);
                        if (quest.tasks) {
                            quest.tasks.forEach((task, taskIndex) => {
                                console.log(`      Task ${taskIndex + 1}: ${task.taskId || task.id || 'Unknown'}: ${task.title || task.name || 'No title'}`);
                            });
                        }
                    });
                } else {
                    console.log(`⚠️ No quest sequence found in configData`);
                }
                
                // Show other important config data
                if (configData.className) {
                    console.log(`\n📚 Class Name: ${configData.className}`);
                }
                if (configData.description) {
                    console.log(`📝 Description: ${configData.description}`);
                }
                
            } catch (error) {
                console.log(`❌ Error parsing configData: ${error.message}`);
            }
        }
        
        // Save config to file for inspection
        const fs = require('fs');
        const filename = `quest_config_${TARGET_CLASS_ID}.json`;
        fs.writeFileSync(filename, JSON.stringify(questConfig, null, 2));
        console.log(`\n💾 Quest config saved to: ${filename}`);
        
    } catch (error) {
        console.error(`❌ Error:`, error);
    } finally {
        await client.close();
    }
}

console.log(`🚀 Getting quest config for class ID: ${TARGET_CLASS_ID}`);
getQuestConfig();
