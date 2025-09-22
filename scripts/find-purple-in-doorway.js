import { MongoClient } from 'mongodb';

const DOORWAY_URI = "mongodb+srv://jadyn:290794@gamification.nwes9ze.mongodb.net/oss-doorway?retryWrites=true&w=majority&appName=gamification";

async function findPurpleConfigInDoorway() {
  console.log('🔍 Searching for purple config in OSS-Doorway database...');
  
  const doorwayClient = new MongoClient(DOORWAY_URI);
  
  try {
    await doorwayClient.connect();
    const doorwayDb = doorwayClient.db('oss-doorway');
    const questConfigsCollection = doorwayDb.collection('questconfigs');
    
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
      console.log('✅ Found the purple config in OSS-Doorway database:');
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
              
              // Show Q5.T17 specifically since that's what the logs show
              if (quest === 'Q5' && questConfig[quest]['T17']) {
                const t17 = questConfig[quest]['T17'];
                console.log(`\n📝 Q5.T17 details:`);
                console.log(`   - Title: ${t17.title || 'N/A'}`);
                console.log(`   - Type: ${t17.type || 'N/A'}`);
                console.log(`   - Points: ${t17.points || 'N/A'}`);
                console.log(`   - Accept: ${t17.accept ? t17.accept.substring(0, 100) + '...' : 'N/A'}`);
              }
            }
          }
        }
      }
    } else {
      console.log('❌ Specific purple config not found in OSS-Doorway database');
      
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
    
    // Also search for any purple configs
    console.log('\n🟣 Searching for all purple configs in OSS-Doorway...');
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
    await doorwayClient.close();
  }
}

findPurpleConfigInDoorway();


