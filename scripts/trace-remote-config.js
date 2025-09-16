import { MongoClient } from 'mongodb';

// Use the actual remote MongoDB URIs from the .env file
const MANAGEMENT_URI = "mongodb+srv://jadyn:290794@gamification.nwes9ze.mongodb.net/management?retryWrites=true&w=majority&appName=gamification";
const DOORWAY_URI = "mongodb+srv://cna93:gamification@gamification.nwes9ze.mongodb.net/?retryWrites=true&w=majority&appName=gamification";

async function traceRemoteConfig() {
  console.log('🔍 Tracing config for class 68a770b8140b9c0174c13ce7 and user CocoCrispy95...');
  
  // Check Management database
  console.log('\n📋 Checking OSS-Management database...');
  const managementClient = new MongoClient(MANAGEMENT_URI);
  
  try {
    await managementClient.connect();
    const managementDb = managementClient.db('management');
    
    // List collections
    const collections = await managementDb.listCollections().toArray();
    console.log(`Collections: ${collections.map(c => c.name).join(', ')}`);
    
    // Find the class in groups
    if (collections.some(c => c.name === 'groups')) {
      const groupsCollection = managementDb.collection('groups');
      const classGroup = await groupsCollection.findOne({
        _id: '68a770b8140b9c0174c13ce7'
      });
      
      if (classGroup) {
        console.log('✅ Found class in Management DB:');
        console.log(`   - ID: ${classGroup._id}`);
        console.log(`   - Name: ${classGroup.name || 'N/A'}`);
        console.log(`   - questJsonConfig: ${classGroup.questJsonConfig || 'NOT SET'}`);
        console.log(`   - All fields:`, Object.keys(classGroup));
      } else {
        console.log('❌ Class not found in Management groups');
      }
    }
    
  } catch (error) {
    console.error('❌ Error with Management DB:', error.message);
  } finally {
    await managementClient.close();
  }
  
  // Check Doorway database
  console.log('\n🚪 Checking OSS-Doorway database...');
  const doorwayClient = new MongoClient(DOORWAY_URI);
  
  try {
    await doorwayClient.connect();
    const doorwayDb = doorwayClient.db('gamification'); // Default database from connection string
    
    // List collections
    const collections = await doorwayDb.listCollections().toArray();
    console.log(`Collections: ${collections.map(c => c.name).join(', ')}`);
    
    // Find user CocoCrispy95
    if (collections.some(c => c.name === 'quests')) {
      const questsCollection = doorwayDb.collection('quests');
      const user = await questsCollection.findOne({
        github: 'CocoCrispy95'
      });
      
      if (user) {
        console.log('✅ Found user CocoCrispy95:');
        console.log(`   - GitHub: ${user.github}`);
        console.log(`   - customGroupId: ${user.user_data?.customGroupId || 'NOT SET'}`);
        console.log(`   - Current quest: ${user.user_data?.current?.quest || 'N/A'}`);
        console.log(`   - Current task: ${user.user_data?.current?.task || 'N/A'}`);
        
        if (user.user_data?.customGroupId) {
          console.log(`\n🔍 User's customGroupId: ${user.user_data.customGroupId}`);
        }
      } else {
        console.log('❌ User CocoCrispy95 not found');
      }
    }
    
    // Find quest configs
    if (collections.some(c => c.name === 'questconfigs')) {
      const questConfigsCollection = doorwayDb.collection('questconfigs');
      
      // Search for configs related to this class
      const searchPatterns = [
        '68a770b8140b9c0174c13ce7',
        '68a770b8140b9c0174c13ce8'
      ];
      
      console.log('\n🔧 Searching for quest configs...');
      
      for (const pattern of searchPatterns) {
        const configs = await questConfigsCollection.find({
          classId: { $regex: pattern, $options: 'i' }
        }).toArray();
        
        if (configs.length > 0) {
          console.log(`\n✅ Found ${configs.length} configs matching "${pattern}":`);
          for (const config of configs) {
            console.log(`   📝 Config: ${config.classId}`);
            console.log(`      - ID: ${config._id}`);
            console.log(`      - Created: ${config.createdAt}`);
            
            if (config.config) {
              const quests = Object.keys(config.config).filter(k => k.startsWith('Q'));
              console.log(`      - Quests: ${quests.join(', ')}`);
              
              // Show task counts
              for (const quest of quests) {
                if (config.config[quest] && typeof config.config[quest] === 'object') {
                  const tasks = Object.keys(config.config[quest]).filter(k => k.startsWith('T'));
                  console.log(`      - ${quest}: ${tasks.length} tasks`);
                }
              }
            }
            
            // Mark special configs
            if (config.classId.includes('purple')) {
              console.log(`      ⭐ PURPLE CONFIG`);
            }
            if (config.classId.includes('with-q3')) {
              console.log(`      ⭐ WITH-Q3 CONFIG (your preferred content)`);
            }
          }
        } else {
          console.log(`❌ No configs found for pattern: ${pattern}`);
        }
      }
      
      // Get total count of configs
      const totalConfigs = await questConfigsCollection.countDocuments();
      console.log(`\n📊 Total quest configs in database: ${totalConfigs}`);
      
      if (totalConfigs > 0) {
        // Show a few sample configs to understand the structure
        const sampleConfigs = await questConfigsCollection.find({}).limit(3).toArray();
        console.log('\n📝 Sample configs (first 3):');
        for (const config of sampleConfigs) {
          console.log(`   - ${config.classId} (${config.createdAt})`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error with Doorway DB:', error.message);
  } finally {
    await doorwayClient.close();
  }
}

traceRemoteConfig();


