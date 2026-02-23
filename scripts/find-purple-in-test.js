import { MongoClient } from 'mongodb';

const TEST_URI = "mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/test?retryWrites=true&w=majority&appName=gamification";

async function findPurpleConfigInTest() {
  console.log('🔍 Searching for purple config in TEST database...');
  
  const testClient = new MongoClient(TEST_URI);
  
  try {
    await testClient.connect();
    const testDb = testClient.db('test');
    
    // List all collections
    const collections = await testDb.listCollections().toArray();
    console.log(`\n📁 Found ${collections.length} collections:`);
    for (const collection of collections) {
      console.log(`   - ${collection.name}`);
    }
    
    // Check questconfigs collection
    const questConfigsCollection = testDb.collection('questconfigs');
    const count = await questConfigsCollection.countDocuments();
    console.log(`\n🔍 Collection: questconfigs (${count} documents)`);
    
    if (count > 0) {
      // Search for the specific purple config
      const specificConfig = await questConfigsCollection.findOne({
        $or: [
          { groupId: '68a770b8140b9c0174c13ce7_purple_1757967107200' },
          { configId: '68a770b8140b9c0174c13ce7_purple_1757967107200' },
          { classId: '68a770b8140b9c0174c13ce7_purple_1757967107200' },
          { _id: '68a770b8140b9c0174c13ce7_purple_1757967107200' }
        ]
      });
      
      if (specificConfig) {
        console.log('✅ Found the purple config in TEST database:');
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
        console.log('❌ Specific purple config not found');
        
        // Search for any config with this timestamp
        const timestampConfigs = await questConfigsCollection.find({
          $or: [
            { groupId: { $regex: '1757967107200', $options: 'i' } },
            { configId: { $regex: '1757967107200', $options: 'i' } },
            { classId: { $regex: '1757967107200', $options: 'i' } }
          ]
        }).toArray();
        
        if (timestampConfigs.length > 0) {
          console.log(`\n🔍 Found ${timestampConfigs.length} configs with timestamp 1757967107200:`);
          for (const config of timestampConfigs) {
            console.log(`   - ${config.groupId || config.configId || config.classId}`);
          }
        }
      }
      
      // Also search for all purple configs
      console.log('\n🟣 Searching for all purple configs in TEST database...');
      const purpleConfigs = await questConfigsCollection.find({
        $or: [
          { groupId: { $regex: 'purple', $options: 'i' } },
          { configId: { $regex: 'purple', $options: 'i' } },
          { classId: { $regex: 'purple', $options: 'i' } }
        ]
      }).toArray();
      
      if (purpleConfigs.length > 0) {
        console.log(`✅ Found ${purpleConfigs.length} purple configs:`);
        for (const config of purpleConfigs) {
          console.log(`   - ${config.groupId || config.configId || config.classId}`);
          console.log(`     Created: ${config.createdAt}`);
        }
      } else {
        console.log('❌ No purple configs found');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await testClient.close();
  }
}

findPurpleConfigInTest();



