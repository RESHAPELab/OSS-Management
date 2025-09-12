// migrate-content-to-purple.js
// Copy content from -with-q3 config to purple config and migrate all users

const { MongoClient } = require('mongodb');

async function main() {
  const classId = '68a770b8140b9c0174c13ce7';
  const sourceConfigId = '68a770b8140b9c0174c13ce8-with-q3';
  const targetPurpleConfigId = '68a770b8140b9c0174c13ce7_purple_1756928031626';
  
  const ossDoorwayUri = process.env.OSS_DOORWAY_DB_URI || 'mongodb+srv://cna93:gamification@gamification.nwes9ze.mongodb.net/?retryWrites=true&w=majority&appName=gamification';
  const ossDoorwayDbName = process.env.OSS_DOORWAY_DB_NAME || 'test';

  let client;
  try {
    client = new MongoClient(ossDoorwayUri);
    await client.connect();
    const db = client.db(ossDoorwayDbName);

    const questConfigsCol = db.collection('questconfigs');
    const userDataCol = db.collection('user_data');

    console.log('🔄 MIGRATING CONTENT TO PURPLE CONFIG');
    console.log('=' .repeat(60));

    // Step 1: Get the source config content
    console.log('\n📋 Step 1: Getting source config content...');
    const sourceConfig = await questConfigsCol.findOne({ classId: sourceConfigId });
    
    if (!sourceConfig) {
      console.error('❌ Source config not found:', sourceConfigId);
      return;
    }

    const sourceQuestKeys = sourceConfig?.config ? Object.keys(sourceConfig.config).filter(k => k.startsWith('Q')) : [];
    console.log('✅ Source config found:');
    console.log('  - Config ID:', sourceConfig.classId);
    console.log('  - Quest keys:', sourceQuestKeys);
    console.log('  - Created:', sourceConfig.createdAt);

    // Step 2: Get the target purple config
    console.log('\n🟣 Step 2: Getting target purple config...');
    const targetConfig = await questConfigsCol.findOne({ classId: targetPurpleConfigId });
    
    if (!targetConfig) {
      console.error('❌ Target purple config not found:', targetPurpleConfigId);
      return;
    }

    const targetQuestKeys = targetConfig?.config ? Object.keys(targetConfig.config).filter(k => k.startsWith('Q')) : [];
    console.log('✅ Target purple config found:');
    console.log('  - Config ID:', targetConfig.classId);
    console.log('  - Current quest keys:', targetQuestKeys);
    console.log('  - Created:', targetConfig.createdAt);

    // Step 3: Update the purple config with source content
    console.log('\n🔄 Step 3: Updating purple config with source content...');
    
    const updateResult = await questConfigsCol.updateOne(
      { classId: targetPurpleConfigId },
      {
        $set: {
          config: sourceConfig.config,
          updatedAt: new Date(),
          migratedFrom: sourceConfigId
        }
      }
    );

    if (updateResult.modifiedCount > 0) {
      console.log('✅ Purple config updated successfully');
    } else {
      console.log('⚠️ Purple config was not modified (might already be the same)');
    }

    // Step 4: Find all users to migrate
    console.log('\n👥 Step 4: Finding users to migrate...');
    
    // Find users using the source config
    const sourceUsers = await userDataCol.find({ 
      'user_data.customGroupId': sourceConfigId 
    }).toArray();
    
    // Find users using the base config
    const baseUsers = await userDataCol.find({ 
      'user_data.customGroupId': classId 
    }).toArray();
    
    // Find users using other configs for this class
    const otherUsers = await userDataCol.find({ 
      $and: [
        { 'user_data.customGroupId': { $regex: new RegExp(`^${classId}`) } },
        { 'user_data.customGroupId': { $ne: targetPurpleConfigId } }
      ]
    }).toArray();

    const allUsersToMigrate = [...sourceUsers, ...baseUsers, ...otherUsers];
    console.log(`✅ Found ${allUsersToMigrate.length} users to migrate:`);
    console.log(`  - Using source config (${sourceConfigId}): ${sourceUsers.length}`);
    console.log(`  - Using base config (${classId}): ${baseUsers.length}`);
    console.log(`  - Using other configs: ${otherUsers.length}`);

    // Step 5: Migrate users to purple config
    console.log('\n🚀 Step 5: Migrating users to purple config...');
    
    let migrationSuccesses = 0;
    let migrationFailures = 0;
    const migrationFailuresDetails = [];

    for (const user of allUsersToMigrate) {
      try {
        const updateResult = await userDataCol.updateOne(
          { _id: user._id },
          {
            $set: {
              'user_data.customGroupId': targetPurpleConfigId,
              'user_data.customSequenceFile': `${targetPurpleConfigId}.json`
            }
          }
        );

        if (updateResult.modifiedCount > 0) {
          migrationSuccesses++;
          console.log(`✅ Migrated: ${user._id}`);
        } else {
          console.log(`⚠️ Already migrated: ${user._id}`);
        }
      } catch (error) {
        migrationFailures++;
        migrationFailuresDetails.push({ user: user._id, error: error.message });
        console.log(`❌ Failed to migrate: ${user._id} - ${error.message}`);
      }
    }

    // Step 6: Verification
    console.log('\n🔍 Step 6: Verification...');
    
    // Check how many users are now using the purple config
    const purpleUsers = await userDataCol.find({ 
      'user_data.customGroupId': targetPurpleConfigId 
    }).toArray();
    
    console.log(`✅ Verification complete:`);
    console.log(`  - Users now using purple config: ${purpleUsers.length}`);
    console.log(`  - Migration successes: ${migrationSuccesses}`);
    console.log(`  - Migration failures: ${migrationFailures}`);

    if (migrationFailures > 0) {
      console.log('\n❌ Migration failures:');
      migrationFailuresDetails.forEach(failure => {
        console.log(`  - ${failure.user}: ${failure.error}`);
      });
    }

    // Step 7: Show final state
    console.log('\n📊 Step 7: Final state...');
    
    const finalConfig = await questConfigsCol.findOne({ classId: targetPurpleConfigId });
    const finalQuestKeys = finalConfig?.config ? Object.keys(finalConfig.config).filter(k => k.startsWith('Q')) : [];
    
    console.log('✅ Final purple config:');
    console.log('  - Config ID:', finalConfig.classId);
    console.log('  - Quest keys:', finalQuestKeys);
    console.log('  - Users using this config:', purpleUsers.length);
    console.log('  - Migrated from:', finalConfig.migratedFrom);

    console.log('\n🎉 Migration complete!');
    console.log(`All users in class ${classId} should now be using the purple config with content from ${sourceConfigId}`);

  } catch (error) {
    console.error('❌ Error during migration:', error.message);
  } finally {
    if (client) await client.close();
  }
}

main();
