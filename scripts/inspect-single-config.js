import { MongoClient } from 'mongodb';

const MANAGEMENT_URI = "mongodb+srv://jadyn:290794@gamification.nwes9ze.mongodb.net/management?retryWrites=true&w=majority&appName=gamification";

async function inspectSingleConfig() {
  console.log('🔍 Inspecting the single quest config found...');
  
  const managementClient = new MongoClient(MANAGEMENT_URI);
  
  try {
    await managementClient.connect();
    const managementDb = managementClient.db('management');
    
    // Get the single quest config
    const questConfigsCollection = managementDb.collection('questconfigs');
    const singleConfig = await questConfigsCollection.findOne({});
    
    if (singleConfig) {
      console.log('📝 The single quest config:');
      console.log(`   - ClassId: ${singleConfig.classId}`);
      console.log(`   - ID: ${singleConfig._id}`);
      console.log(`   - Created: ${singleConfig.createdAt}`);
      console.log(`   - All fields:`, Object.keys(singleConfig));
      
      if (singleConfig.config) {
        const quests = Object.keys(singleConfig.config).filter(k => k.startsWith('Q'));
        console.log(`   - Quests: ${quests.join(', ')}`);
        
        for (const quest of quests) {
          if (singleConfig.config[quest] && typeof singleConfig.config[quest] === 'object') {
            const tasks = Object.keys(singleConfig.config[quest]).filter(k => k.startsWith('T'));
            console.log(`   - ${quest}: ${tasks.length} tasks (${tasks.join(', ')})`);
          }
        }
      }
    }
    
    // Search all groups to see what's available
    console.log('\n👥 Checking all groups...');
    const groupsCollection = managementDb.collection('groups');
    const allGroups = await groupsCollection.find({}).limit(10).toArray();
    
    console.log(`Found ${allGroups.length} groups (showing first 10):`);
    for (const group of allGroups) {
      console.log(`   - ${group._id}: ${group.name || 'No name'}`);
      if (group.questJsonConfig) {
        console.log(`     questJsonConfig: ${group.questJsonConfig}`);
      }
    }
    
    // Search for the specific class ID
    const cs386Group = await groupsCollection.findOne({
      _id: '68a770b8140b9c0174c13ce7'
    });
    
    if (cs386Group) {
      console.log('\n✅ Found CS386 group:');
      console.log(JSON.stringify(cs386Group, null, 2));
    } else {
      console.log('\n❌ CS386 group not found');
      
      // Try searching by name or partial ID
      const partialMatches = await groupsCollection.find({
        $or: [
          { _id: { $regex: '68a770b8140b9c0174c13ce', $options: 'i' } },
          { name: { $regex: 'cs386', $options: 'i' } },
          { name: { $regex: 'software', $options: 'i' } }
        ]
      }).toArray();
      
      if (partialMatches.length > 0) {
        console.log(`\n🔍 Found ${partialMatches.length} partial matches:`);
        for (const match of partialMatches) {
          console.log(`   - ${match._id}: ${match.name || 'No name'}`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await managementClient.close();
  }
}

inspectSingleConfig();
