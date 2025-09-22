const { MongoClient } = require('mongodb');

// Configuration
const OSS_DOORWAY_URI = process.env.OSS_DOORWAY_DB_URI || 'mongodb+srv://cna93:gamification@gamification.nwes9ze.mongodb.net/?retryWrites=true&w=majority&appName=gamification';
const OSS_DOORWAY_DB_NAME = process.env.OSS_DOORWAY_DB_NAME || 'test';

// Target student repository
const TARGET_STUDENT_REPO = 'akg357-cs386-software-engineering';

async function getStudentQuestConfig() {
    console.log(`🔍 Getting quest config for student: ${TARGET_STUDENT_REPO}`);
    
    const client = new MongoClient(OSS_DOORWAY_URI);
    
    try {
        await client.connect();
        console.log(`✅ Connected to OSS-Doorway database`);
        
        const db = client.db(OSS_DOORWAY_DB_NAME);
        
        // First, find the student in user_data collection
        console.log(`🔍 Searching for student in user_data collection...`);
        const userData = await db.collection('user_data').findOne({
            _id: TARGET_STUDENT_REPO
        });
        
        if (!userData) {
            console.log(`❌ Student ${TARGET_STUDENT_REPO} not found in user_data collection`);
            
            // List some available students for reference
            console.log(`\n📋 Available students (first 10):`);
            const students = await db.collection('user_data').find({}).limit(10).toArray();
            students.forEach(student => {
                console.log(`   - ${student._id}`);
            });
            return;
        }
        
        console.log(`✅ Found student: ${TARGET_STUDENT_REPO}`);
        console.log(`📊 Student data:`);
        console.log(`   Custom Group ID: ${userData.user_data?.customGroupId || 'Not set'}`);
        console.log(`   Current Quest: ${userData.user_data?.current?.quest || 'Not set'}`);
        console.log(`   Current Task: ${userData.user_data?.current?.task || 'Not set'}`);
        console.log(`   Points: ${userData.user_data?.points || 0}`);
        console.log(`   XP: ${userData.user_data?.xp || 0}`);
        console.log(`   Completion: ${userData.user_data?.completion || 0}`);
        
        // Get the quest config ID that this student is using
        const questConfigId = userData.user_data?.customGroupId;
        
        if (!questConfigId) {
            console.log(`❌ No quest config ID found for student ${TARGET_STUDENT_REPO}`);
            return;
        }
        
        console.log(`\n🔍 Looking for quest config with ID: ${questConfigId}`);
        
        // Try to find quest config in different possible collections
        const collections = ['quest_configs', 'questconfigs', 'configs', 'quest_config'];
        let questConfig = null;
        let foundInCollection = null;
        
        for (const collectionName of collections) {
            console.log(`🔍 Searching in collection: ${collectionName}`);
            
            try {
                const result = await db.collection(collectionName).findOne({
                    $or: [
                        { groupId: questConfigId },
                        { configId: questConfigId },
                        { classId: questConfigId },
                        { _id: questConfigId }
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
            console.log(`❌ No quest config found for ID ${questConfigId}`);
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
        
        console.log(`\n📋 QUEST CONFIGURATION FOR ${TARGET_STUDENT_REPO}:`);
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
        
        // Show quest configuration details
        if (questConfig.questConfig) {
            console.log(`\n🎯 QUEST CONFIG DETAILS:`);
            const quests = Object.keys(questConfig.questConfig);
            console.log(`Available Quests: ${quests.join(', ')}`);
            
            quests.forEach(questId => {
                const quest = questConfig.questConfig[questId];
                console.log(`\n📚 ${questId}:`);
                console.log(`   Title: ${quest.title || 'No title'}`);
                console.log(`   Description: ${quest.description || 'No description'}`);
                
                if (quest.tasks) {
                    const tasks = Object.keys(quest.tasks);
                    console.log(`   Tasks: ${tasks.join(', ')}`);
                    
                    tasks.forEach(taskId => {
                        const task = quest.tasks[taskId];
                        console.log(`     📝 ${taskId}: ${task.title || task.taskTitle || 'No title'}`);
                        console.log(`        Type: ${task.type || 'Not specified'}`);
                        console.log(`        Points: ${task.points || 0}`);
                    });
                }
            });
        }
        
        // Show config details (for the new format)
        if (questConfig.config) {
            console.log(`\n🎯 CONFIG DETAILS:`);
            const quests = Object.keys(questConfig.config);
            console.log(`Available Quests: ${quests.join(', ')}`);
            
            quests.forEach(questId => {
                if (questId === 'map_repo_link') {
                    console.log(`\n🗺️ ${questId}: ${questConfig.config[questId]}`);
                    return;
                }
                
                const quest = questConfig.config[questId];
                console.log(`\n📚 ${questId}:`);
                console.log(`   Title: ${quest.metadata?.title || 'No title'}`);
                console.log(`   Description: ${quest.metadata?.description || 'No description'}`);
                console.log(`   Prerequisite: ${quest.metadata?.prerequisite || 'None'}`);
                
                if (quest.tasks) {
                    const tasks = Object.keys(quest.tasks);
                    console.log(`   Tasks: ${tasks.join(', ')}`);
                    
                    tasks.forEach(taskId => {
                        const task = quest.tasks[taskId];
                        console.log(`     📝 ${taskId}: ${task.desc || task.title || 'No title'}`);
                        console.log(`        Type: ${task.type || 'Not specified'}`);
                        console.log(`        Points: ${task.points || 0}`);
                        console.log(`        Hints: ${task.detailedHints?.length || 0} detailed hints`);
                    });
                }
            });
        }
        
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
        const filename = `quest_config_${TARGET_STUDENT_REPO}_${questConfigId}.json`;
        fs.writeFileSync(filename, JSON.stringify(questConfig, null, 2));
        console.log(`\n💾 Quest config saved to: ${filename}`);
        
    } catch (error) {
        console.error(`❌ Error:`, error);
    } finally {
        await client.close();
    }
}

console.log(`🚀 Getting quest config for student: ${TARGET_STUDENT_REPO}`);
getStudentQuestConfig();
