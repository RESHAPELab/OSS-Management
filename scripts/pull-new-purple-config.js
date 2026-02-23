import { MongoClient } from 'mongodb';

const TEST_URI = "mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/test?retryWrites=true&w=majority&appName=gamification";

async function pullNewPurpleConfig() {
  console.log('🔍 Pulling new purple config: 68a770b8140b9c0174c13ce7_purple_1758142017627');
  
  const testClient = new MongoClient(TEST_URI);
  
  try {
    await testClient.connect();
    const testDb = testClient.db('test');
    const questConfigsCollection = testDb.collection('questconfigs');
    
    // Find the specific config
    const config = await questConfigsCollection.findOne({
      $or: [
        { classId: '68a770b8140b9c0174c13ce7_purple_1758142017627' },
        { configId: '68a770b8140b9c0174c13ce7_purple_1758142017627' },
        { groupId: '68a770b8140b9c0174c13ce7_purple_1758142017627' },
        { _id: '68a770b8140b9c0174c13ce7_purple_1758142017627' }
      ]
    });
    
    if (config) {
      console.log('✅ Found the new purple config!');
      console.log(`   - Database ID: ${config._id}`);
      console.log(`   - ClassId: ${config.classId}`);
      console.log(`   - ConfigId: ${config.configId}`);
      console.log(`   - GroupId: ${config.groupId}`);
      console.log(`   - Created: ${config.createdAt}`);
      console.log(`   - Updated: ${config.updatedAt}`);
      console.log(`   - Is Purple Deployment: ${config.isPurpleDeployment}`);
      console.log(`   - Base Config ID: ${config.baseConfigId}`);
      console.log(`   - Deployed Quest ID: ${config.deployedQuestId}`);
      console.log(`   - Deployed At: ${config.deployedAt}`);
      
      // Show quest content
      if (config.config) {
        const questConfig = config.config;
        if (typeof questConfig === 'object') {
          const quests = Object.keys(questConfig).filter(k => k.startsWith('Q'));
          console.log(`\n🔧 Quest content:`);
          console.log(`   - Total Quests: ${quests.length}`);
          console.log(`   - Quests: ${quests.join(', ')}`);
          
          for (const quest of quests) {
            if (questConfig[quest] && typeof questConfig[quest] === 'object') {
              const tasks = Object.keys(questConfig[quest]).filter(k => k.startsWith('T'));
              console.log(`   - ${quest}: ${tasks.length} tasks`);
              
              // Show metadata for each quest
              if (questConfig[quest].metadata) {
                const meta = questConfig[quest].metadata;
                console.log(`     Title: ${meta.title || 'N/A'}`);
                console.log(`     Description: ${meta.description || 'N/A'}`);
                console.log(`     Prerequisite: ${meta.prerequisite || 'N/A'}`);
                console.log(`     Type: ${meta.type || 'N/A'}`);
              }
              
              // Show Q6 details specifically
              if (quest === 'Q6') {
                console.log(`\n📝 Q6 Details:`);
                console.log(`   - Title: ${questConfig[quest].metadata?.title || 'N/A'}`);
                console.log(`   - Tasks: ${tasks.join(', ')}`);
                
                // Show first few tasks
                for (let i = 1; i <= Math.min(3, tasks.length); i++) {
                  const taskKey = `T${i}`;
                  if (questConfig[quest][taskKey]) {
                    const task = questConfig[quest][taskKey];
                    console.log(`   - ${taskKey}: ${task.title || task.desc || 'N/A'}`);
                    console.log(`     Points: ${task.points || 'N/A'}, Type: ${task.type || 'N/A'}`);
                  }
                }
              }
            }
          }
        }
      }
      
      // Save to file for inspection
      const fs = await import('fs');
      const filename = `quest_config_68a770b8140b9c0174c13ce7_purple_1758142017627.json`;
      fs.writeFileSync(filename, JSON.stringify(config, null, 2));
      console.log(`\n💾 Config saved to: ${filename}`);
      
    } else {
      console.log('❌ Config not found');
      
      // Search for any config with this timestamp
      const timestampConfigs = await questConfigsCollection.find({
        $or: [
          { classId: { $regex: '1758142017627', $options: 'i' } },
          { configId: { $regex: '1758142017627', $options: 'i' } },
          { groupId: { $regex: '1758142017627', $options: 'i' } }
        ]
      }).toArray();
      
      if (timestampConfigs.length > 0) {
        console.log(`\n🔍 Found ${timestampConfigs.length} configs with timestamp 1758142017627:`);
        for (const config of timestampConfigs) {
          console.log(`   - ${config.classId || config.configId || config.groupId}`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await testClient.close();
  }
}

pullNewPurpleConfig();