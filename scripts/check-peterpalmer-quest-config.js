const { MongoClient } = require('mongodb');

// Configuration
const OSS_DOORWAY_URI = process.env.OSS_DOORWAY_DB_URI || 'mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/?retryWrites=true&w=majority&appName=gamification';
const OSS_DOORWAY_DB_NAME = process.env.OSS_DOORWAY_DB_NAME || 'test';

// Target student repository
const TARGET_STUDENT_REPO = 'peterpalmer-cs386-software-engineering-test';

async function checkQuestConfig() {
    console.log(`🔍 Checking quest config for: ${TARGET_STUDENT_REPO}`);
    
    const client = new MongoClient(OSS_DOORWAY_URI);
    
    try {
        await client.connect();
        console.log(`✅ Connected to OSS-Doorway database`);
        
        const db = client.db(OSS_DOORWAY_DB_NAME);
        
        // Get user data from database
        console.log(`\n🔍 Fetching user data from database...`);
        const userData = await db.collection('user_data').findOne({
            _id: TARGET_STUDENT_REPO
        });
        
        if (!userData) {
            console.log(`❌ Student ${TARGET_STUDENT_REPO} not found in database`);
            
            // List some available students for reference
            console.log(`\n📋 Available students (first 10):`);
            const students = await db.collection('user_data').find({}).limit(10).toArray();
            students.forEach(student => {
                console.log(`   - ${student._id}`);
            });
            return;
        }
        
        console.log(`✅ Found user in database`);
        console.log(`📊 User data:`);
        console.log(`   Custom Group ID: ${userData.user_data?.customGroupId || 'Not set'}`);
        console.log(`   Current Quest: ${userData.user_data?.current?.quest || 'Not set'}`);
        console.log(`   Current Task: ${userData.user_data?.current?.task || 'Not set'}`);
        console.log(`   Points: ${userData.user_data?.points || 0}`);
        console.log(`   XP: ${userData.user_data?.xp || 0}`);
        
        // Check quest configuration
        if (userData.user_data?.customGroupId) {
            console.log(`\n🔍 QUEST CONFIGURATION:`);
            console.log(`=====================================`);
            console.log(`Custom Group ID: ${userData.user_data.customGroupId}`);
            
            // Try to find the quest configuration
            const questConfig = await db.collection('questconfigs').findOne({
                classId: userData.user_data.customGroupId
            });
            
            if (questConfig) {
                console.log(`✅ Quest configuration found`);
                console.log(`   Config ID: ${questConfig.configId}`);
                console.log(`   Class ID: ${questConfig.classId}`);
                console.log(`   Created: ${questConfig.createdAt ? new Date(questConfig.createdAt).toISOString() : 'Unknown'}`);
                console.log(`   Updated: ${questConfig.updatedAt ? new Date(questConfig.updatedAt).toISOString() : 'Unknown'}`);
                
                // Check quest structure
                console.log(`\n📋 QUEST STRUCTURE:`);
                console.log(`=====================================`);
                const configData = questConfig.config;
                const questKeys = Object.keys(configData).filter(key => key !== 'map_repo_link');
                
                console.log(`Available quests: ${questKeys.join(', ')}`);
                console.log(`Total quests: ${questKeys.length}`);
                
                // Check each quest
                questKeys.forEach(questId => {
                    const questData = configData[questId];
                    console.log(`\n${questId}:`);
                    console.log(`   Type: ${questData.metadata?.type || 'Unknown'}`);
                    console.log(`   Title: ${questData.metadata?.title || 'No title'}`);
                    console.log(`   Prerequisite: ${questData.metadata?.prerequisite || 'None'}`);
                    
                    // Check tasks
                    const taskKeys = Object.keys(questData).filter(key => /^T\d+$/i.test(key));
                    console.log(`   Tasks: ${taskKeys.join(', ')} (${taskKeys.length} total)`);
                    
                    // Check T12 specifically
                    if (questData.T12) {
                        console.log(`   T12 Details:`);
                        console.log(`     Type: ${questData.T12.type}`);
                        console.log(`     Title: ${questData.T12.title}`);
                        console.log(`     Points: ${questData.T12.points}`);
                        console.log(`     XP: ${questData.T12.xp}`);
                        console.log(`     Accept: ${questData.T12.accept ? questData.T12.accept.substring(0, 100) + '...' : 'No accept message'}`);
                    } else {
                        console.log(`   ❌ T12 not found in ${questId}`);
                    }
                });
                
                // Check for temporary quest IDs
                console.log(`\n🔍 TEMPORARY QUEST ID ANALYSIS:`);
                console.log(`=====================================`);
                const tempQuestIds = questKeys.filter(key => key.startsWith('TEMP_'));
                const normalizedQuestIds = questKeys.filter(key => /^Q\d+$/i.test(key));
                
                console.log(`Temporary quest IDs: ${tempQuestIds.join(', ') || 'None'}`);
                console.log(`Normalized quest IDs: ${normalizedQuestIds.join(', ') || 'None'}`);
                
                if (tempQuestIds.length > 0) {
                    console.log(`⚠️ Found temporary quest IDs that should be normalized`);
                    tempQuestIds.forEach(tempId => {
                        console.log(`   ${tempId} should be normalized to Q1, Q2, etc.`);
                    });
                }
                
                // Check if T12 exists in any quest
                console.log(`\n🔍 T12 TASK ANALYSIS:`);
                console.log(`=====================================`);
                let t12Found = false;
                questKeys.forEach(questId => {
                    if (configData[questId].T12) {
                        console.log(`✅ T12 found in ${questId}`);
                        t12Found = true;
                    }
                });
                
                if (!t12Found) {
                    console.log(`❌ T12 not found in any quest`);
                }
                
            } else {
                console.log(`❌ Quest configuration not found for customGroupId: ${userData.user_data.customGroupId}`);
                
                // List available quest configs
                console.log(`\n📋 Available quest configs:`);
                const allConfigs = await db.collection('questconfigs').find({}).limit(10).toArray();
                allConfigs.forEach(config => {
                    console.log(`   - ${config.classId} (${config.configId})`);
                });
            }
        }
        
        // Check user's accepted quests
        console.log(`\n🔍 USER'S ACCEPTED QUESTS:`);
        console.log(`=====================================`);
        const accepted = userData.user_data?.accepted || {};
        const acceptedQuests = Object.keys(accepted);
        
        if (acceptedQuests.length > 0) {
            console.log(`Accepted quests: ${acceptedQuests.join(', ')}`);
            acceptedQuests.forEach(questId => {
                const questData = accepted[questId];
                const taskKeys = Object.keys(questData).filter(key => /^T\d+$/i.test(key));
                console.log(`   ${questId}: ${taskKeys.length} tasks (${taskKeys.join(', ')})`);
                
                // Check if T12 is accepted
                if (questData.T12) {
                    console.log(`     ✅ T12 is accepted`);
                } else {
                    console.log(`     ❌ T12 is not accepted`);
                }
            });
        } else {
            console.log(`No accepted quests found`);
        }
        
    } catch (error) {
        console.error(`❌ Error:`, error);
    } finally {
        await client.close();
        console.log(`\n🔌 Database connection closed`);
    }
}

console.log(`🚀 Checking quest config for peterpalmer...`);
checkQuestConfig().catch(console.error);
