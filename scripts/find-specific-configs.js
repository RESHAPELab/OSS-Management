import { MongoClient } from 'mongodb';

const MANAGEMENT_URI = "mongodb+srv://jadyn:290794@gamification.nwes9ze.mongodb.net/management?retryWrites=true&w=majority&appName=gamification";
const DOORWAY_URI = "mongodb+srv://cna93:gamification@gamification.nwes9ze.mongodb.net/?retryWrites=true&w=majority&appName=gamification";

async function findSpecificConfigs() {
  console.log('🔍 Looking for specific configs mentioned...');
  
  // Check Management database for purple config
  console.log('\n📋 Searching OSS-Management database for purple config...');
  const managementClient = new MongoClient(MANAGEMENT_URI);
  
  try {
    await managementClient.connect();
    const managementDb = managementClient.db('management');
    
    // Look for purple config in questconfigs collection
    const questConfigsCollection = managementDb.collection('questconfigs');
    
    // Search for the specific purple config
    const purpleConfig = await questConfigsCollection.findOne({
      $or: [
        { classId: '68a770b8140b9c0174c13ce7_purple_1756928031626' },
        { configId: '68a770b8140b9c0174c13ce7_purple_1756928031626' },
        { groupId: '68a770b8140b9c0174c13ce7_purple_1756928031626' },
        { _id: '68a770b8140b9c0174c13ce7_purple_1756928031626' }
      ]
    });
    
    if (purpleConfig) {
      console.log('✅ Found purple config in Management DB:');
      console.log(`   - ID: ${purpleConfig._id}`);
      console.log(`   - ClassId: ${purpleConfig.classId || 'N/A'}`);
      console.log(`   - ConfigId: ${purpleConfig.configId || 'N/A'}`);
      console.log(`   - GroupId: ${purpleConfig.groupId || 'N/A'}`);
      console.log(`   - Created: ${purpleConfig.createdAt}`);
      console.log(`   - All fields:`, Object.keys(purpleConfig));
      
      if (purpleConfig.config || purpleConfig.configData) {
        const config = purpleConfig.config || purpleConfig.configData;
        if (typeof config === 'object') {
          const quests = Object.keys(config).filter(k => k.startsWith('Q'));
          console.log(`   - Quests: ${quests.join(', ')}`);
          
          for (const quest of quests) {
            if (config[quest] && typeof config[quest] === 'object') {
              const tasks = Object.keys(config[quest]).filter(k => k.startsWith('T'));
              console.log(`   - ${quest}: ${tasks.length} tasks`);
            }
          }
        }
      }
    } else {
      console.log('❌ Purple config not found in Management DB');
      
      // Search more broadly for purple configs
      const purpleConfigs = await questConfigsCollection.find({
        $or: [
          { classId: { $regex: 'purple', $options: 'i' } },
          { configId: { $regex: 'purple', $options: 'i' } },
          { groupId: { $regex: 'purple', $options: 'i' } }
        ]
      }).toArray();
      
      if (purpleConfigs.length > 0) {
        console.log(`🟣 Found ${purpleConfigs.length} purple-related configs:`);
        for (const config of purpleConfigs) {
          console.log(`   - ${config.classId || config.configId || config.groupId || config._id}`);
        }
      }
    }
    
    // Also search for the with-q3 config
    console.log('\n🎯 Searching for with-q3 config...');
    const withQ3Config = await questConfigsCollection.findOne({
      $or: [
        { classId: '68a770b8140b9c0174c13ce8-with-q3' },
        { configId: '68a770b8140b9c0174c13ce8-with-q3' },
        { groupId: '68a770b8140b9c0174c13ce8-with-q3' }
      ]
    });
    
    if (withQ3Config) {
      console.log('✅ Found with-q3 config in Management DB:');
      console.log(`   - ID: ${withQ3Config._id}`);
      console.log(`   - ClassId: ${withQ3Config.classId || 'N/A'}`);
      console.log(`   - Created: ${withQ3Config.createdAt}`);
    } else {
      console.log('❌ with-q3 config not found in Management DB');
    }
    
  } catch (error) {
    console.error('❌ Error with Management DB:', error.message);
  } finally {
    await managementClient.close();
  }
  
  // Check Doorway database for user data
  console.log('\n👤 Searching OSS-Doorway database for CocoCrispy95...');
  const doorwayClient = new MongoClient(DOORWAY_URI);
  
  try {
    await doorwayClient.connect();
    const doorwayDb = doorwayClient.db('gamification');
    
    // List collections to see what's available
    const collections = await doorwayDb.listCollections().toArray();
    console.log(`Collections: ${collections.map(c => c.name).join(', ')}`);
    
    // Look for CocoCrispy95 in user_data collection
    if (collections.some(c => c.name === 'user_data')) {
      const userDataCollection = doorwayDb.collection('user_data');
      
      const cocoUser = await userDataCollection.findOne({
        $or: [
          { _id: 'CocoCrispy95-cs386-software-engineering' },
          { github: 'CocoCrispy95' },
          { username: 'CocoCrispy95' },
          { 'user_data.github': 'CocoCrispy95' }
        ]
      });
      
      if (cocoUser) {
        console.log('✅ Found CocoCrispy95 in user_data collection:');
        console.log(`   - ID: ${cocoUser._id}`);
        console.log(`   - GitHub: ${cocoUser.github || cocoUser.user_data?.github || 'N/A'}`);
        console.log(`   - customGroupId: ${cocoUser.customGroupId || cocoUser.user_data?.customGroupId || 'N/A'}`);
        console.log(`   - Current quest: ${cocoUser.current?.quest || cocoUser.user_data?.current?.quest || 'N/A'}`);
        console.log(`   - All fields:`, Object.keys(cocoUser));
      } else {
        console.log('❌ CocoCrispy95 not found in user_data collection');
      }
    }
    
    // Also check other possible collections
    const possibleCollections = ['Quest', 'userstoreddata', 'Task'];
    for (const collectionName of possibleCollections) {
      if (collections.some(c => c.name === collectionName)) {
        try {
          const collection = doorwayDb.collection(collectionName);
          const user = await collection.findOne({
            $or: [
              { _id: 'CocoCrispy95-cs386-software-engineering' },
              { github: 'CocoCrispy95' },
              { username: 'CocoCrispy95' },
              { 'user_data.github': 'CocoCrispy95' }
            ]
          });
          
          if (user) {
            console.log(`✅ Found CocoCrispy95 in ${collectionName} collection:`);
            console.log(`   - ID: ${user._id}`);
            console.log(`   - Fields:`, Object.keys(user));
            
            // Look for customGroupId
            const customGroupId = user.customGroupId || user.user_data?.customGroupId;
            if (customGroupId) {
              console.log(`   - customGroupId: ${customGroupId}`);
            }
          }
        } catch (err) {
          // Collection might not be accessible, continue
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error with Doorway DB:', error.message);
  } finally {
    await doorwayClient.close();
  }
}

findSpecificConfigs();


