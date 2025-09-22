const { MongoClient } = require('mongodb');

// Configuration
const OSS_DOORWAY_URI = process.env.OSS_DOORWAY_DB_URI || 'mongodb+srv://cna93:gamification@gamification.nwes9ze.mongodb.net/?retryWrites=true&w=majority&appName=gamification';
const OSS_DOORWAY_DB_NAME = process.env.OSS_DOORWAY_DB_NAME || 'test';

// Class ID we're checking
const CLASS_ID = '68a770b8140b9c0174c13ce7';

async function checkGroupModelQuestConfig() {
    console.log(`🔍 Checking Group model quest configuration for class: ${CLASS_ID}`);
    
    const client = new MongoClient(OSS_DOORWAY_URI);
    
    try {
        await client.connect();
        console.log(`✅ Connected to OSS-Doorway database`);
        
        const db = client.db(OSS_DOORWAY_DB_NAME);
        
        // Check groups collection (this is what the frontend loads from)
        console.log(`\n📋 GROUPS COLLECTION (Frontend Source):`);
        console.log(`=====================================`);
        
        const group = await db.collection('groups').findOne({
            _id: CLASS_ID
        });
        
        if (group) {
            console.log(`✅ Found group in groups collection`);
            console.log(`   Group ID: ${group._id}`);
            console.log(`   Group Name: ${group.groupName}`);
            console.log(`   Class Code: ${group.classCode}`);
            console.log(`   Created: ${group.createdAt}`);
            console.log(`   Updated: ${group.updatedAt}`);
            
            // Check quest JSON config
            console.log(`\n📊 QUEST JSON CONFIGURATION:`);
            console.log(`=====================================`);
            
            if (group.questJsonConfig) {
                console.log(`✅ Quest JSON Config exists`);
                console.log(`   Last Updated: ${group.questJsonLastUpdated}`);
                console.log(`   Quest Sequence Length: ${group.questJsonConfig.questSequence?.length || 0}`);
                
                if (group.questJsonConfig.questSequence && group.questJsonConfig.questSequence.length > 0) {
                    console.log(`   Available Quests:`);
                    group.questJsonConfig.questSequence.forEach((quest, index) => {
                        console.log(`     ${index + 1}. ${quest.questId || quest.id}: ${quest.title || quest.metadata?.title || 'No title'}`);
                    });
                } else {
                    console.log(`   ❌ Quest sequence is empty!`);
                }
            } else {
                console.log(`❌ No quest JSON config found in group`);
            }
            
            // Check draft quest config
            console.log(`\n📊 DRAFT QUEST CONFIGURATION:`);
            console.log(`=====================================`);
            
            if (group.draftQuestConfig) {
                console.log(`✅ Draft Quest Config exists`);
                console.log(`   Last Updated: ${group.draftQuestLastUpdated}`);
                console.log(`   Quest Sequence Length: ${group.draftQuestConfig.questSequence?.length || 0}`);
            } else {
                console.log(`❌ No draft quest config found in group`);
            }
            
        } else {
            console.log(`❌ Group not found in groups collection`);
        }
        
        // Compare with questconfigs collection
        console.log(`\n🔄 COMPARISON WITH QUESTCONFIGS:`);
        console.log(`=====================================`);
        
        const purpleConfig = await db.collection('questconfigs').findOne({
            classId: `${CLASS_ID}_purple_1757534011062`
        });
        
        if (purpleConfig) {
            console.log(`✅ Found purple config in questconfigs`);
            console.log(`   Purple Config Quests: Q1, Q2, Q3, Q4`);
            console.log(`   Group Config Quests: ${group?.questJsonConfig?.questSequence?.length || 0} quests`);
            
            if (group?.questJsonConfig?.questSequence?.length !== 4) {
                console.log(`\n🚨 MISMATCH DETECTED!`);
                console.log(`   Purple deploy created Q1-Q4 in questconfigs collection`);
                console.log(`   But frontend loads from groups collection which has different quest count`);
                console.log(`   This is why the quest sequence page doesn't show the current config!`);
            }
        }
        
    } catch (error) {
        console.error(`❌ Error:`, error);
    } finally {
        await client.close();
        console.log(`\n🔌 Database connection closed`);
    }
}

console.log(`🚀 Checking Group model quest configuration for class: ${CLASS_ID}`);
checkGroupModelQuestConfig();
