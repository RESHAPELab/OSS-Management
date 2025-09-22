import { MongoClient } from 'mongodb';

const MANAGEMENT_URI = "mongodb+srv://jadyn:290794@gamification.nwes9ze.mongodb.net/management?retryWrites=true&w=majority&appName=gamification";

async function findClassQuestConfig() {
  console.log('🔍 Finding quest config tied to class 68a770b8140b9c0174c13ce7...');
  
  const managementClient = new MongoClient(MANAGEMENT_URI);
  
  try {
    await managementClient.connect();
    const managementDb = managementClient.db('management');
    
    // Step 1: Find the class/group
    console.log('\n📋 Step 1: Finding class 68a770b8140b9c0174c13ce7...');
    const groupsCollection = managementDb.collection('groups');
    const classGroup = await groupsCollection.findOne({
      _id: '68a770b8140b9c0174c13ce7'
    });
    
    if (classGroup) {
      console.log('✅ Found class group:');
      console.log(`   - ID: ${classGroup._id}`);
      console.log(`   - Name: ${classGroup.name || 'N/A'}`);
      console.log(`   - questJsonConfig: ${classGroup.questJsonConfig || 'NOT SET'}`);
      console.log(`   - All fields:`, Object.keys(classGroup));
      
      // Show the full class document
      console.log('\n📄 Full class document:');
      console.log(JSON.stringify(classGroup, null, 2));
      
      // If questJsonConfig is set, that's the active config
      if (classGroup.questJsonConfig) {
        console.log(`\n🎯 ACTIVE QUEST CONFIG: ${classGroup.questJsonConfig}`);
      } else {
        console.log('\n⚠️ No questJsonConfig set - class uses default config selection logic');
      }
      
    } else {
      console.log('❌ Class group not found');
      
      // Try searching for similar class IDs
      const similarGroups = await groupsCollection.find({
        _id: { $regex: '68a770b8140b9c0174c13ce', $options: 'i' }
      }).toArray();
      
      if (similarGroups.length > 0) {
        console.log(`\n🔍 Found ${similarGroups.length} similar groups:`);
        for (const group of similarGroups) {
          console.log(`   - ${group._id}: ${group.name || 'No name'}`);
          console.log(`     questJsonConfig: ${group.questJsonConfig || 'NOT SET'}`);
        }
      }
    }
    
    // Step 2: Check questconfigs collection for any configs related to this class
    console.log('\n📋 Step 2: Checking questconfigs collection...');
    const questConfigsCollection = managementDb.collection('questconfigs');
    
    // Search for configs related to this class
    const relatedConfigs = await questConfigsCollection.find({
      $or: [
        { classId: '68a770b8140b9c0174c13ce7' },
        { groupId: '68a770b8140b9c0174c13ce7' },
        { configId: '68a770b8140b9c0174c13ce7' },
        { classId: { $regex: '68a770b8140b9c0174c13ce7', $options: 'i' } },
        { groupId: { $regex: '68a770b8140b9c0174c13ce7', $options: 'i' } }
      ]
    }).toArray();
    
    if (relatedConfigs.length > 0) {
      console.log(`✅ Found ${relatedConfigs.length} quest configs for this class:`);
      
      for (const config of relatedConfigs) {
        console.log(`\n📝 Config: ${config.classId || config.configId || config.groupId || config._id}`);
        console.log(`   - ID: ${config._id}`);
        console.log(`   - Created: ${config.createdAt}`);
        console.log(`   - All fields:`, Object.keys(config));
        
        // Check if this is the active config
        if (classGroup && classGroup.questJsonConfig === (config.classId || config.configId || config.groupId)) {
          console.log(`   ⭐ THIS IS THE ACTIVE CONFIG FOR THE CLASS`);
        }
        
        // Show quest content if available
        if (config.config || config.configData) {
          const questConfig = config.config || config.configData;
          if (typeof questConfig === 'object') {
            const quests = Object.keys(questConfig).filter(k => k.startsWith('Q'));
            console.log(`   - Quests: ${quests.join(', ')}`);
            
            for (const quest of quests) {
              if (questConfig[quest] && typeof questConfig[quest] === 'object') {
                const tasks = Object.keys(questConfig[quest]).filter(k => k.startsWith('T'));
                console.log(`   - ${quest}: ${tasks.length} tasks`);
              }
            }
          }
        }
      }
    } else {
      console.log('❌ No quest configs found for this class');
      
      // Show all quest configs to understand the structure
      const allConfigs = await questConfigsCollection.find({}).limit(5).toArray();
      console.log(`\n📋 Sample quest configs (first 5):`);
      for (const config of allConfigs) {
        console.log(`   - ${config.classId || config.configId || config.groupId || config._id}`);
      }
    }
    
    // Step 3: Check if there are any purple configs
    console.log('\n📋 Step 3: Checking for purple configs...');
    const purpleConfigs = await questConfigsCollection.find({
      $or: [
        { classId: { $regex: 'purple', $options: 'i' } },
        { configId: { $regex: 'purple', $options: 'i' } },
        { groupId: { $regex: 'purple', $options: 'i' } }
      ]
    }).toArray();
    
    if (purpleConfigs.length > 0) {
      console.log(`🟣 Found ${purpleConfigs.length} purple configs:`);
      for (const config of purpleConfigs) {
        console.log(`   - ${config.classId || config.configId || config.groupId || config._id}`);
        console.log(`     Created: ${config.createdAt}`);
        
        // Check if this purple config is related to our class
        const configId = config.classId || config.configId || config.groupId || '';
        if (configId.includes('68a770b8140b9c0174c13ce7')) {
          console.log(`     ⭐ RELATED TO CS386 CLASS`);
        }
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

findClassQuestConfig();


