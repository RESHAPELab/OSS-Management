import { MongoClient } from 'mongodb';

const MANAGEMENT_URI = "mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/management?retryWrites=true&w=majority&appName=gamification";

async function findActualPurpleConfig() {
  console.log('🔍 Searching for the ACTUAL purple config used by jmk658...');
  
  const managementClient = new MongoClient(MANAGEMENT_URI);
  
  try {
    await managementClient.connect();
    const managementDb = managementClient.db('management');
    const questConfigsCollection = managementDb.collection('questconfigs');
    
    // Search for the specific config from the logs
    const specificConfig = await questConfigsCollection.findOne({
      $or: [
        { classId: '68a770b8140b9c0174c13ce7_purple_1757967107200' },
        { configId: '68a770b8140b9c0174c13ce7_purple_1757967107200' },
        { groupId: '68a770b8140b9c0174c13ce7_purple_1757967107200' },
        { _id: '68a770b8140b9c0174c13ce7_purple_1757967107200' }
      ]
    });
    
    if (specificConfig) {
      console.log('✅ Found the ACTUAL purple config used by jmk658:');
      console.log(`   - ID: ${specificConfig._id}`);
      console.log(`   - ClassId: ${specificConfig.classId}`);
      console.log(`   - ConfigId: ${specificConfig.configId}`);
      console.log(`   - GroupId: ${specificConfig.groupId}`);
      console.log(`   - Created: ${specificConfig.createdAt}`);
      console.log(`   - All fields:`, Object.keys(specificConfig));
      
      // Show quest content
      if (specificConfig.config || specificConfig.configData) {
        const questConfig = specificConfig.config || specificConfig.configData;
        if (typeof questConfig === 'object') {
          const quests = Object.keys(questConfig).filter(k => k.startsWith('Q'));
          console.log(`\n🔧 Quest content:`);
          console.log(`   - Quests: ${quests.join(', ')}`);
          
          for (const quest of quests) {
            if (questConfig[quest] && typeof questConfig[quest] === 'object') {
              const tasks = Object.keys(questConfig[quest]).filter(k => k.startsWith('T'));
              console.log(`   - ${quest}: ${tasks.length} tasks`);
              
              // Show Q5.T15 specifically since that's what the logs show
              if (quest === 'Q5' && questConfig[quest]['T15']) {
                const t15 = questConfig[quest]['T15'];
                console.log(`\n📝 Q5.T15 details:`);
                console.log(`   - Title: ${t15.title || 'N/A'}`);
                console.log(`   - Type: ${t15.type || 'N/A'}`);
                console.log(`   - Points: ${t15.points || 'N/A'}`);
                console.log(`   - Accept: ${t15.accept ? t15.accept.substring(0, 100) + '...' : 'N/A'}`);
              }
            }
          }
        }
      }
    } else {
      console.log('❌ Specific purple config not found in database');
      
      // Search for any config with this timestamp
      const timestampConfigs = await questConfigsCollection.find({
        $or: [
          { classId: { $regex: '1757967107200', $options: 'i' } },
          { configId: { $regex: '1757967107200', $options: 'i' } },
          { groupId: { $regex: '1757967107200', $options: 'i' } }
        ]
      }).toArray();
      
      if (timestampConfigs.length > 0) {
        console.log(`\n🔍 Found ${timestampConfigs.length} configs with timestamp 1757967107200:`);
        for (const config of timestampConfigs) {
          console.log(`   - ${config.classId || config.configId || config.groupId}`);
        }
      } else {
        console.log('❌ No configs found with timestamp 1757967107200');
      }
    }
    
    // Also search for any purple configs with similar timestamps
    console.log('\n🟣 Searching for purple configs with similar timestamps...');
    const purpleConfigs = await questConfigsCollection.find({
      $or: [
        { classId: { $regex: 'purple.*1757967', $options: 'i' } },
        { configId: { $regex: 'purple.*1757967', $options: 'i' } },
        { groupId: { $regex: 'purple.*1757967', $options: 'i' } }
      ]
    }).toArray();
    
    if (purpleConfigs.length > 0) {
      console.log(`✅ Found ${purpleConfigs.length} purple configs with similar timestamps:`);
      for (const config of purpleConfigs) {
        console.log(`   - ${config.classId || config.configId || config.groupId}`);
        console.log(`     Created: ${config.createdAt}`);
      }
    } else {
      console.log('❌ No purple configs found with similar timestamps');
    }
    
    // Check if this might be a processed/cached config
    console.log('\n💾 This might be a processed/cached config...');
    console.log('The logs show: "processed-quest-config-68a770b8140b9c0174c13ce7_purple_1757967107200"');
    console.log('This suggests it\'s a processed version of a base config, possibly cached in memory.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await managementClient.close();
  }
}

findActualPurpleConfig();



