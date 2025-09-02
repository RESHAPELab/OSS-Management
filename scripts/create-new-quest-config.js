const { MongoClient } = require('mongodb');

// Configuration
const OSS_DOORWAY_URI = process.env.OSS_DOORWAY_DB_URI || 'mongodb+srv://cna93:gamification@gamification.nwes9ze.mongodb.net/?retryWrites=true&w=majority&appName=gamification';
const OSS_DOORWAY_DB_NAME = process.env.OSS_DOORWAY_DB_NAME || 'test';

// Generate a new quest config ID
const NEW_QUEST_CONFIG_ID = '68a770b8140b9c0174c13ce8'; // New ID for the combined Q1+Q2 config
const OLD_CLASS_ID = '68a770b8140b9c0174c13ce7';

async function createNewQuestConfig() {
    console.log(`🚀 Creating new quest config with Q1+Q2`);
    
    const client = new MongoClient(OSS_DOORWAY_URI);
    
    try {
        await client.connect();
        console.log(`✅ Connected to OSS-Doorway database`);
        
        const db = client.db(OSS_DOORWAY_DB_NAME);
        
        // Get the Q1+Q2 config from quest_configs collection
        console.log(`📋 Fetching Q1+Q2 config from quest_configs collection...`);
        const sourceConfig = await db.collection('quest_configs').findOne({
            $or: [
                { groupId: OLD_CLASS_ID },
                { configId: OLD_CLASS_ID },
                { classId: OLD_CLASS_ID }
            ]
        });
        
        if (!sourceConfig) {
            console.error(`❌ No source config found in quest_configs`);
            return;
        }
        
        console.log(`✅ Found source config with Q1+Q2`);
        console.log(`📊 Source config has: ${Object.keys(sourceConfig.questConfig).filter(k => k.startsWith('Q')).join(', ')}`);
        
        // Create new config document for questconfigs collection
        const newConfig = {
            groupId: NEW_QUEST_CONFIG_ID,
            configId: NEW_QUEST_CONFIG_ID,
            classId: NEW_QUEST_CONFIG_ID,
            config: sourceConfig.questConfig, // Note: using 'config' field instead of 'questConfig'
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: 'migration-script',
            source: 'quest_configs-migration'
        };
        
        // Insert into questconfigs collection (without underscore)
        console.log(`📝 Creating new config in questconfigs collection...`);
        const insertResult = await db.collection('questconfigs').insertOne(newConfig);
        
        if (insertResult.insertedId) {
            console.log(`✅ Successfully created new quest config`);
            console.log(`📋 New config ID: ${NEW_QUEST_CONFIG_ID}`);
            console.log(`🆔 MongoDB document ID: ${insertResult.insertedId}`);
            
            // Verify the new config
            const verifyConfig = await db.collection('questconfigs').findOne({
                configId: NEW_QUEST_CONFIG_ID
            });
            
            if (verifyConfig && verifyConfig.config) {
                console.log(`✅ Verification successful`);
                console.log(`📊 New config contains: ${Object.keys(verifyConfig.config).filter(k => k.startsWith('Q')).join(', ')}`);
                console.log(`🎯 Q1 tasks: ${Object.keys(verifyConfig.config.Q1 || {}).filter(k => k.startsWith('T')).length}`);
                console.log(`🎯 Q2 tasks: ${Object.keys(verifyConfig.config.Q2 || {}).filter(k => k.startsWith('T')).length}`);
            } else {
                console.error(`❌ Verification failed - new config not found or invalid`);
            }
        } else {
            console.error(`❌ Failed to create new quest config`);
        }
        
    } catch (error) {
        console.error(`❌ Error:`, error);
    } finally {
        await client.close();
        console.log(`🔌 Database connection closed`);
    }
}

async function updateUserConfigs() {
    console.log(`\n🔄 Updating all users to use new quest config: ${NEW_QUEST_CONFIG_ID}`);
    
    const client = new MongoClient(OSS_DOORWAY_URI);
    
    try {
        await client.connect();
        console.log(`✅ Connected to database for user updates`);
        
        const db = client.db(OSS_DOORWAY_DB_NAME);
        
        // Find all users with the old customGroupId
        const usersToUpdate = await db.collection('user_data').find({
            'user_data.customGroupId': OLD_CLASS_ID
        }).toArray();
        
        console.log(`✅ Found ${usersToUpdate.length} users to update`);
        
        if (usersToUpdate.length === 0) {
            console.log(`ℹ️ No users found with customGroupId: ${OLD_CLASS_ID}`);
            return;
        }
        
        // Update each user's customGroupId
        let updateCount = 0;
        for (const user of usersToUpdate) {
            const result = await db.collection('user_data').updateOne(
                { _id: user._id },
                {
                    $set: {
                        'user_data.customGroupId': NEW_QUEST_CONFIG_ID
                    }
                }
            );
            
            if (result.modifiedCount === 1) {
                updateCount++;
                console.log(`✅ Updated user: ${user._id}`);
            } else {
                console.log(`⚠️ Failed to update user: ${user._id}`);
            }
        }
        
        console.log(`\n📊 UPDATE SUMMARY:`);
        console.log(`=====================================`);
        console.log(`Total users found: ${usersToUpdate.length}`);
        console.log(`Successfully updated: ${updateCount}`);
        console.log(`Failed updates: ${usersToUpdate.length - updateCount}`);
        console.log(`Old config ID: ${OLD_CLASS_ID}`);
        console.log(`New config ID: ${NEW_QUEST_CONFIG_ID}`);
        
    } catch (error) {
        console.error(`❌ Error updating users:`, error);
    } finally {
        await client.close();
        console.log(`🔌 Database connection closed`);
    }
}

async function main() {
    console.log(`🚀 QUEST CONFIG MIGRATION SCRIPT`);
    console.log(`=====================================`);
    console.log(`Old class ID: ${OLD_CLASS_ID}`);
    console.log(`New config ID: ${NEW_QUEST_CONFIG_ID}`);
    console.log(`Target collection: questconfigs (without underscore)`);
    
    // Step 1: Create new quest config with Q1+Q2
    await createNewQuestConfig();
    
    // Step 2: Update all users to use new config
    await updateUserConfigs();
    
    console.log(`\n🎉 MIGRATION COMPLETE!`);
    console.log(`=====================================`);
    console.log(`✅ New quest config created with Q1+Q2`);
    console.log(`✅ All users updated to use new config`);
    console.log(`🔄 Cache will be refreshed on next bot interaction`);
}

main();


