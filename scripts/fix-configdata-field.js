// fix-configdata-field.js
// Remove the old configData field that only has Q1, so bot uses the full config field

const { MongoClient } = require('mongodb');

async function main() {
  const targetPurpleConfigId = '68a770b8140b9c0174c13ce7_purple_1756928031626';
  
  const ossDoorwayUri = process.env.OSS_DOORWAY_DB_URI || 'mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/?retryWrites=true&w=majority&appName=gamification';
  const ossDoorwayDbName = process.env.OSS_DOORWAY_DB_NAME || 'test';

  let client;
  try {
    client = new MongoClient(ossDoorwayUri);
    await client.connect();
    const db = client.db(ossDoorwayDbName);

    const questConfigsCol = db.collection('questconfigs');

    console.log('🔧 FIXING CONFIGDATA FIELD');
    console.log('=' .repeat(40));

    // Remove the configData field that only has Q1
    console.log('\n📋 Removing old configData field...');
    const updateResult = await questConfigsCol.updateOne(
      { classId: targetPurpleConfigId },
      {
        $unset: {
          configData: ""
        }
      }
    );

    if (updateResult.modifiedCount > 0) {
      console.log('✅ Successfully removed configData field');
    } else {
      console.log('⚠️ No changes made (field may not exist)');
    }

    // Verify the fix
    console.log('\n🔍 Verifying fix...');
    const config = await questConfigsCol.findOne({ classId: targetPurpleConfigId });
    
    if (config) {
      console.log('✅ Config after fix:');
      console.log('  - Has config field:', !!config.config);
      console.log('  - Has configData field:', !!config.configData);
      
      if (config.config) {
        const questKeys = Object.keys(config.config).filter(k => k.startsWith('Q'));
        console.log('  - Quest keys in config:', questKeys);
      }
      
      if (config.configData) {
        const questKeys = Object.keys(config.configData).filter(k => k.startsWith('Q'));
        console.log('  - Quest keys in configData:', questKeys);
      }
    }

    console.log('\n🎉 Fix complete!');
    console.log('The bot should now load Q1, Q2, Q3 from the config field instead of just Q1 from configData.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (client) await client.close();
  }
}

main();
