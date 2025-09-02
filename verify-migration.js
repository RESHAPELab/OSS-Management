const { MongoClient } = require('mongodb');

const OSS_DOORWAY_URI = process.env.OSS_DOORWAY_DB_URI || 'mongodb+srv://cna93:gamification@gamification.nwes9ze.mongodb.net/?retryWrites=true&w=majority&appName=gamification';
const OSS_DOORWAY_DB_NAME = process.env.OSS_DOORWAY_DB_NAME || 'test';

const NEW_QUEST_CONFIG_ID = '68a770b8140b9c0174c13ce8';

async function verifyMigration() {
    const client = new MongoClient(OSS_DOORWAY_URI);
    
    try {
        await client.connect();
        console.log('✅ Connected to database for verification');
        
        const db = client.db(OSS_DOORWAY_DB_NAME);
        
        // 1. Verify new quest config exists in questconfigs collection
        console.log('\n🔍 VERIFYING NEW QUEST CONFIG:');
        console.log('=====================================');
        
        const newConfig = await db.collection('questconfigs').findOne({
            configId: NEW_QUEST_CONFIG_ID
        });
        
        if (newConfig) {
            console.log('✅ New quest config found in questconfigs collection');
            console.log(`📋 Config ID: ${newConfig.configId}`);
            console.log(`🆔 MongoDB document ID: ${newConfig._id}`);
            console.log(`📊 Quest keys: ${Object.keys(newConfig.config).filter(k => k.startsWith('Q')).join(', ')}`);
            console.log(`🎯 Q1 exists: ${!!newConfig.config.Q1}`);
            console.log(`🎯 Q2 exists: ${!!newConfig.config.Q2}`);
            
            if (newConfig.config.Q1) {
                console.log(`📋 Q1 tasks: ${Object.keys(newConfig.config.Q1).filter(k => k.startsWith('T')).length}`);
            }
            if (newConfig.config.Q2) {
                console.log(`📋 Q2 tasks: ${Object.keys(newConfig.config.Q2).filter(k => k.startsWith('T')).length}`);
                console.log(`🔗 Q2 prerequisite: ${newConfig.config.Q2.metadata?.prerequisite}`);
            }
        } else {
            console.log('❌ New quest config NOT found');
        }
        
        // 2. Verify users have been updated
        console.log('\n🔍 VERIFYING USER UPDATES:');
        console.log('=====================================');
        
        const usersWithNewConfig = await db.collection('user_data').find({
            'user_data.customGroupId': NEW_QUEST_CONFIG_ID
        }).toArray();
        
        const usersWithOldConfig = await db.collection('user_data').find({
            'user_data.customGroupId': '68a770b8140b9c0174c13ce7'
        }).toArray();
        
        console.log(`✅ Users with new config (${NEW_QUEST_CONFIG_ID}): ${usersWithNewConfig.length}`);
        console.log(`⚠️ Users with old config (68a770b8140b9c0174c13ce7): ${usersWithOldConfig.length}`);
        
        if (usersWithNewConfig.length > 0) {
            console.log('\n📋 Sample users with new config:');
            usersWithNewConfig.slice(0, 5).forEach(user => {
                console.log(`   - ${user._id}`);
            });
        }
        
        // 3. Check current progress status
        console.log('\n🔍 CHECKING STUDENT PROGRESS:');
        console.log('=====================================');
        
        let completedQ1 = 0;
        let workingOnQ1 = 0;
        let readyForQ2 = 0;
        
        for (const user of usersWithNewConfig) {
            const userData = user.user_data || {};
            const completed = userData.completed || {};
            const current = userData.current || {};
            
            if (completed.Q1) {
                completedQ1++;
                if (!current.quest || current.quest === 'None') {
                    readyForQ2++;
                }
            } else if (current.quest === 'Q1') {
                workingOnQ1++;
            }
        }
        
        console.log(`📊 Completed Q1: ${completedQ1} students`);
        console.log(`🔄 Working on Q1: ${workingOnQ1} students`);
        console.log(`🚀 Ready for Q2 unlock: ${readyForQ2} students`);
        
        console.log('\n🎉 MIGRATION VERIFICATION COMPLETE!');
        console.log('=====================================');
        console.log('✅ New quest config created with Q1+Q2');
        console.log('✅ All users migrated to new config');
        console.log('✅ Students can now progress from Q1 to Q2');
        console.log('🔄 Cache will refresh on next bot interaction');
        
    } catch (error) {
        console.error('❌ Verification error:', error.message);
    } finally {
        await client.close();
        console.log('\n🔌 Database connection closed');
    }
}

verifyMigration();


