// find-all-configs.js
// Find all configs related to CS386 class and show their locations

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
    const groupsCol = db.collection('groups');
    const userDataCol = db.collection('user_data');

    console.log('🔍 FINDING ALL CONFIGS FOR CS386 CLASS');
    console.log('=' .repeat(60));

    // 1. Find the -with-q3 config
    console.log('\n📋 1. FINDING THE "-with-q3" CONFIG:');
    const withQ3Config = await questConfigsCol.findOne({ 
      classId: { $regex: /68a770b8140b9c0174c13ce8-with-q3/ } 
    });
    
    if (withQ3Config) {
      const questKeys = withQ3Config?.config ? Object.keys(withQ3Config.config).filter(k => k.startsWith('Q')) : [];
      console.log('✅ Found -with-q3 config:');
      console.log('  - Config ID:', withQ3Config.classId);
      console.log('  - Created:', withQ3Config.createdAt);
      console.log('  - Quest keys:', questKeys);
      console.log('  - Database location: questconfigs collection');
    } else {
      console.log('❌ -with-q3 config not found');
    }

    // 2. Find the purple config for the class
    console.log('\n🟣 2. FINDING THE PURPLE CONFIG FOR CLASS:');
    const purpleConfig = await questConfigsCol.findOne({ 
      classId: { $regex: new RegExp(`^${classId}_purple_`) } 
    });
    
    if (purpleConfig) {
      const questKeys = purpleConfig?.config ? Object.keys(purpleConfig.config).filter(k => k.startsWith('Q')) : [];
      console.log('✅ Found purple config:');
      console.log('  - Config ID:', purpleConfig.classId);
      console.log('  - Created:', purpleConfig.createdAt);
      console.log('  - Quest keys:', questKeys);
      console.log('  - Database location: questconfigs collection');
    } else {
      console.log('❌ Purple config not found');
    }

    // 3. Find the base config for the class
    console.log('\n📚 3. FINDING THE BASE CONFIG FOR CLASS:');
    const baseConfig = await questConfigsCol.findOne({ classId: classId });
    
    if (baseConfig) {
      const questKeys = baseConfig?.config ? Object.keys(baseConfig.config).filter(k => k.startsWith('Q')) : [];
      console.log('✅ Found base config:');
      console.log('  - Config ID:', baseConfig.classId);
      console.log('  - Created:', baseConfig.createdAt);
      console.log('  - Quest keys:', questKeys);
      console.log('  - Database location: questconfigs collection');
    } else {
      console.log('❌ Base config not found');
    }

    // 4. Check what's saved in the Group document
    console.log('\n🏫 4. WHAT IS SAVED IN THE GROUP DOCUMENT:');
    const group = await groupsCol.findOne({ _id: classId });
    
    if (group) {
      console.log('✅ Group document found:');
      console.log('  - Group ID:', group._id);
      console.log('  - Group Name:', group.groupName);
      console.log('  - questJsonConfig:', group.questJsonConfig?.classId || 'not set');
      console.log('  - questJsonLastUpdated:', group.questJsonLastUpdated);
      console.log('  - Database location: groups collection');
    } else {
      console.log('❌ Group document not found');
    }

    // 5. Check CocoCrispy95's config
    console.log('\n👤 5. COCOCRISPY95\'S CONFIG:');
    const cocoCrispy = await userDataCol.findOne({ 
      _id: 'CocoCrispy95-cs386-software-engineering' 
    });
    
    if (cocoCrispy) {
      console.log('✅ CocoCrispy95 user found:');
      console.log('  - User ID:', cocoCrispy._id);
      console.log('  - customGroupId:', cocoCrispy.user_data?.customGroupId);
      console.log('  - customSequenceFile:', cocoCrispy.user_data?.customSequenceFile);
      console.log('  - Database location: user_data collection');
      
      // Find the actual config this user is using
      if (cocoCrispy.user_data?.customGroupId) {
        const userConfig = await questConfigsCol.findOne({ 
          classId: cocoCrispy.user_data.customGroupId 
        });
        
        if (userConfig) {
          const questKeys = userConfig?.config ? Object.keys(userConfig.config).filter(k => k.startsWith('Q')) : [];
          console.log('  - Using config:', userConfig.classId);
          console.log('  - Config quests:', questKeys);
        }
      }
    } else {
      console.log('❌ CocoCrispy95 user not found');
    }

    // 6. Show all configs for this class
    console.log('\n📋 6. ALL CONFIGS FOR THIS CLASS:');
    const allConfigs = await questConfigsCol.find({ 
      $or: [
        { classId: classId },
        { classId: { $regex: new RegExp(`^${classId}_purple_`) } },
        { classId: { $regex: new RegExp(`^${classId}-`) } },
        { classId: { $regex: /68a770b8140b9c0174c13ce8-with-q3/ } }
      ]
    }).sort({ createdAt: -1 }).toArray();

    console.log(`Found ${allConfigs.length} configs:`);
    for (const config of allConfigs) {
      const legacyKeys = config?.config ? Object.keys(config.config) : [];
      const questIds = legacyKeys.filter(k => k.startsWith('Q'));
      const seqIds = Array.isArray(config.questSequence)
        ? config.questSequence.map(q => q.questId || q.metadata?.questId || q.metadata?.title).filter(Boolean)
        : [];

      console.log(`  - ${config.classId}`);
      console.log(`    Created: ${config.createdAt}`);
      console.log(`    Legacy quests: [${questIds.join(', ')}]`);
      console.log(`    Sequence quests: [${seqIds.join(', ')}]`);
      console.log(`    Is purple: ${config.classId.includes('_purple_')}`);
      console.log(`    Is custom: ${config.classId.includes('-with-q3')}`);
      console.log('');
    }

  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    if (client) await client.close();
  }
}

main();