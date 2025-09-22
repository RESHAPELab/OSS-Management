import { MongoClient } from 'mongodb';

const MANAGEMENT_URI = "mongodb+srv://jadyn:290794@gamification.nwes9ze.mongodb.net/management?retryWrites=true&w=majority&appName=gamification";

async function inspectClassConfigs() {
  console.log('🔍 Inspecting CS386 class quest configs in detail...');
  
  const managementClient = new MongoClient(MANAGEMENT_URI);
  
  try {
    await managementClient.connect();
    const managementDb = managementClient.db('management');
    const questConfigsCollection = managementDb.collection('questconfigs');
    
    // Get the most recent config
    const latestConfig = await questConfigsCollection.findOne({
      classId: '68a770b8140b9c0174c13ce7-test-1758128873341'
    });
    
    if (latestConfig) {
      console.log('📝 Latest config details:');
      console.log(`   - ID: ${latestConfig._id}`);
      console.log(`   - ClassId: ${latestConfig.classId}`);
      console.log(`   - ConfigId: ${latestConfig.configId}`);
      console.log(`   - GroupId: ${latestConfig.groupId}`);
      console.log(`   - Created: ${latestConfig.createdAt}`);
      
      // Check both config and configData fields
      if (latestConfig.config) {
        console.log('\n🔧 Config field content:');
        console.log(`   Type: ${typeof latestConfig.config}`);
        if (typeof latestConfig.config === 'object') {
          const keys = Object.keys(latestConfig.config);
          console.log(`   Keys: ${keys.join(', ')}`);
          
          const quests = keys.filter(k => k.startsWith('Q'));
          if (quests.length > 0) {
            console.log(`   Quests: ${quests.join(', ')}`);
            for (const quest of quests) {
              if (latestConfig.config[quest] && typeof latestConfig.config[quest] === 'object') {
                const tasks = Object.keys(latestConfig.config[quest]).filter(k => k.startsWith('T'));
                console.log(`   - ${quest}: ${tasks.length} tasks`);
              }
            }
          } else {
            console.log('   No quest keys found');
          }
        }
      }
      
      if (latestConfig.configData) {
        console.log('\n🔧 ConfigData field content:');
        console.log(`   Type: ${typeof latestConfig.configData}`);
        if (typeof latestConfig.configData === 'object') {
          const keys = Object.keys(latestConfig.configData);
          console.log(`   Keys: ${keys.join(', ')}`);
          
          const quests = keys.filter(k => k.startsWith('Q'));
          if (quests.length > 0) {
            console.log(`   Quests: ${quests.join(', ')}`);
            for (const quest of quests) {
              if (latestConfig.configData[quest] && typeof latestConfig.configData[quest] === 'object') {
                const tasks = Object.keys(latestConfig.configData[quest]).filter(k => k.startsWith('T'));
                console.log(`   - ${quest}: ${tasks.length} tasks`);
              }
            }
          } else {
            console.log('   No quest keys found');
          }
        }
      }
      
      // Show the full document structure
      console.log('\n📄 Full document structure:');
      console.log(JSON.stringify(latestConfig, null, 2));
    }
    
    // Also check if there's a non-test config
    console.log('\n🔍 Looking for non-test configs...');
    const nonTestConfigs = await questConfigsCollection.find({
      classId: { $regex: '68a770b8140b9c0174c13ce7', $options: 'i' },
      classId: { $not: { $regex: 'test', $options: 'i' } }
    }).toArray();
    
    if (nonTestConfigs.length > 0) {
      console.log(`✅ Found ${nonTestConfigs.length} non-test configs:`);
      for (const config of nonTestConfigs) {
        console.log(`   - ${config.classId}`);
      }
    } else {
      console.log('❌ No non-test configs found');
    }
    
    // Check for any config with purple in the name
    console.log('\n🟣 Looking for purple configs...');
    const purpleConfigs = await questConfigsCollection.find({
      $or: [
        { classId: { $regex: 'purple', $options: 'i' } },
        { configId: { $regex: 'purple', $options: 'i' } },
        { groupId: { $regex: 'purple', $options: 'i' } }
      ]
    }).toArray();
    
    if (purpleConfigs.length > 0) {
      console.log(`✅ Found ${purpleConfigs.length} purple configs:`);
      for (const config of purpleConfigs) {
        console.log(`   - ${config.classId || config.configId || config.groupId}`);
        console.log(`     Created: ${config.createdAt}`);
      }
    } else {
      console.log('❌ No purple configs found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await managementClient.close();
  }
}

inspectClassConfigs();


