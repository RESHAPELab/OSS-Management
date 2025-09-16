// pull-new-purple-config.js
// Pull the latest purple config from the database

const { MongoClient } = require('mongodb');

async function main() {
  const classId = '68a770b8140b9c0174c13ce7';
  
  const ossDoorwayUri = process.env.OSS_DOORWAY_DB_URI || 'mongodb+srv://cna93:gamification@gamification.nwes9ze.mongodb.net/?retryWrites=true&w=majority&appName=gamification';
  const ossDoorwayDbName = process.env.OSS_DOORWAY_DB_NAME || 'test';

  let client;
  try {
    client = new MongoClient(ossDoorwayUri);
    await client.connect();
    const db = client.db(ossDoorwayDbName);

    const questConfigsCol = db.collection('questconfigs');

    console.log('📋 PULLING NEW PURPLE CONFIG');
    console.log('=' .repeat(50));

    // Find the latest purple config
    console.log('\n🔍 Finding latest purple config...');
    const latestPurpleConfig = await questConfigsCol.findOne(
      { classId: { $regex: new RegExp(`^${classId}_purple_`) } },
      { sort: { createdAt: -1 } }
    );

    if (!latestPurpleConfig) {
      console.error('❌ No purple config found');
      return;
    }

    console.log('✅ Latest purple config found:');
    console.log('  - Config ID:', latestPurpleConfig.classId);
    console.log('  - Created:', latestPurpleConfig.createdAt);
    console.log('  - Updated:', latestPurpleConfig.updatedAt);
    console.log('  - Base Config ID:', latestPurpleConfig.baseConfigId);
    console.log('  - Deployed Quest ID:', latestPurpleConfig.deployedQuestId);

    // Show the config structure
    console.log('\n📋 Config structure:');
    if (latestPurpleConfig.config) {
      const allKeys = Object.keys(latestPurpleConfig.config);
      const questKeys = allKeys.filter(k => k.startsWith('Q'));
      
      console.log('  - All keys:', allKeys);
      console.log('  - Quest keys:', questKeys);

      // Show quest details
      for (const questKey of questKeys) {
        const quest = latestPurpleConfig.config[questKey];
        if (quest && typeof quest === 'object') {
          const taskKeys = Object.keys(quest).filter(k => k !== 'metadata');
          console.log(`  - ${questKey}: ${taskKeys.length} tasks [${taskKeys.join(', ')}]`);
          
          if (quest.metadata) {
            console.log(`    Metadata: ${JSON.stringify(quest.metadata)}`);
          }
        }
      }
    }

    // Save to file
    console.log('\n💾 Saving config to file...');
    const fs = require('fs');
    const filename = `new-purple-config-${latestPurpleConfig.classId}.json`;
    
    // Clean up the config for readability
    const cleanConfig = {
      _id: latestPurpleConfig._id,
      classId: latestPurpleConfig.classId,
      createdAt: latestPurpleConfig.createdAt,
      updatedAt: latestPurpleConfig.updatedAt,
      baseConfigId: latestPurpleConfig.baseConfigId,
      deployedQuestId: latestPurpleConfig.deployedQuestId,
      deployedAt: latestPurpleConfig.deployedAt,
      isPurpleDeployment: latestPurpleConfig.isPurpleDeployment,
      config: latestPurpleConfig.config
    };

    fs.writeFileSync(filename, JSON.stringify(cleanConfig, null, 2));
    console.log(`✅ Config saved to: ${filename}`);

    // Show Q4 specifically
    console.log('\n🔍 Q4 Details:');
    if (latestPurpleConfig.config && latestPurpleConfig.config.Q4) {
      const q4 = latestPurpleConfig.config.Q4;
      console.log('  - Q4 metadata:', JSON.stringify(q4.metadata, null, 2));
      console.log('  - Q4 tasks:', Object.keys(q4).filter(k => k !== 'metadata'));
      
      // Show first few tasks
      const taskKeys = Object.keys(q4).filter(k => k !== 'metadata').slice(0, 3);
      for (const taskKey of taskKeys) {
        const task = q4[taskKey];
        console.log(`  - ${taskKey}:`);
        console.log(`    Type: ${task.type}`);
        console.log(`    Points: ${task.points}`);
        console.log(`    Accept: ${task.accept?.substring(0, 100)}...`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (client) await client.close();
  }
}

main();


