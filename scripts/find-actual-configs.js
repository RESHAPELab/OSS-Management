import { MongoClient } from 'mongodb';

// Use the actual remote MongoDB URIs
const MANAGEMENT_URI = "mongodb+srv://jadyn:290794@gamification.nwes9ze.mongodb.net/management?retryWrites=true&w=majority&appName=gamification";
const DOORWAY_URI = "mongodb+srv://cna93:gamification@gamification.nwes9ze.mongodb.net/?retryWrites=true&w=majority&appName=gamification";

async function findActualConfigs() {
  console.log('🔍 Finding actual quest configs for CS386 class...');
  
  // Check Management database for quest configs
  const managementClient = new MongoClient(MANAGEMENT_URI);
  
  try {
    await managementClient.connect();
    const managementDb = managementClient.db('management');
    
    console.log('\n📋 Searching OSS-Management questconfigs...');
    const questConfigsCollection = managementDb.collection('questconfigs');
    
    // Get total count
    const totalConfigs = await questConfigsCollection.countDocuments();
    console.log(`Total quest configs: ${totalConfigs}`);
    
    // Search for configs related to our class
    const cs386Configs = await questConfigsCollection.find({
      classId: { $regex: '68a770b8140b9c0174c13ce', $options: 'i' }
    }).toArray();
    
    if (cs386Configs.length > 0) {
      console.log(`\n✅ Found ${cs386Configs.length} CS386 configs:`);
      
      for (const config of cs386Configs) {
        console.log(`\n📝 Config: ${config.classId}`);
        console.log(`   - ID: ${config._id}`);
        console.log(`   - Created: ${config.createdAt}`);
        
        if (config.config) {
          const quests = Object.keys(config.config).filter(k => k.startsWith('Q'));
          console.log(`   - Quests: ${quests.join(', ')}`);
          
          // Show task counts and sample task info
          for (const quest of quests) {
            if (config.config[quest] && typeof config.config[quest] === 'object') {
              const tasks = Object.keys(config.config[quest]).filter(k => k.startsWith('T'));
              console.log(`   - ${quest}: ${tasks.length} tasks (${tasks.join(', ')})`);
              
              // Show first task as sample
              if (tasks.length > 0) {
                const firstTask = config.config[quest][tasks[0]];
                if (firstTask && firstTask.desc) {
                  console.log(`     ${tasks[0]} sample: "${firstTask.desc.substring(0, 50)}..."`);
                }
              }
            }
          }
        }
        
        // Mark special configs
        if (config.classId.includes('purple')) {
          console.log(`   ⭐ PURPLE CONFIG - Used by new repos`);
        }
        if (config.classId.includes('with-q3')) {
          console.log(`   ⭐ WITH-Q3 CONFIG - Your preferred content`);
        }
        if (config.classId === '68a770b8140b9c0174c13ce7') {
          console.log(`   ⭐ BASE CONFIG - Original class config`);
        }
        if (config.classId === '68a770b8140b9c0174c13ce8-with-q3') {
          console.log(`   ⭐ SOURCE CONFIG - Contains content you want to use`);
        }
        if (config.classId === '68a770b8140b9c0174c13ce7_purple_1756928031626') {
          console.log(`   ⭐ TARGET CONFIG - Purple config to replace`);
        }
      }
    } else {
      console.log('❌ No CS386 configs found');
    }
    
    // Also find the class in groups collection
    console.log('\n👥 Checking groups collection...');
    const groupsCollection = managementDb.collection('groups');
    const classGroup = await groupsCollection.findOne({
      _id: '68a770b8140b9c0174c13ce7'
    });
    
    if (classGroup) {
      console.log('✅ Found class group:');
      console.log(`   - ID: ${classGroup._id}`);
      console.log(`   - Name: ${classGroup.name || 'N/A'}`);
      console.log(`   - questJsonConfig: ${classGroup.questJsonConfig || 'NOT SET'}`);
    }
    
  } catch (error) {
    console.error('❌ Error with Management DB:', error.message);
  } finally {
    await managementClient.close();
  }
  
  // Check Doorway database for user
  const doorwayClient = new MongoClient(DOORWAY_URI);
  
  try {
    await doorwayClient.connect();
    const doorwayDb = doorwayClient.db('gamification');
    
    console.log('\n👤 Checking OSS-Doorway for user CocoCrispy95...');
    
    // Try different collection names that might contain user data
    const possibleCollections = ['Quest', 'user_data', 'userstoreddata'];
    
    for (const collectionName of possibleCollections) {
      try {
        const collection = doorwayDb.collection(collectionName);
        const user = await collection.findOne({
          $or: [
            { github: 'CocoCrispy95' },
            { 'user_data.github': 'CocoCrispy95' },
            { username: 'CocoCrispy95' }
          ]
        });
        
        if (user) {
          console.log(`✅ Found user in ${collectionName} collection:`);
          console.log(`   - GitHub: ${user.github || user.user_data?.github || user.username}`);
          console.log(`   - customGroupId: ${user.user_data?.customGroupId || user.customGroupId || 'NOT SET'}`);
          console.log(`   - Current quest: ${user.user_data?.current?.quest || user.current?.quest || 'N/A'}`);
          console.log(`   - Current task: ${user.user_data?.current?.task || user.current?.task || 'N/A'}`);
          break;
        }
      } catch (err) {
        // Collection might not exist, continue
      }
    }
    
  } catch (error) {
    console.error('❌ Error with Doorway DB:', error.message);
  } finally {
    await doorwayClient.close();
  }
}

findActualConfigs();


