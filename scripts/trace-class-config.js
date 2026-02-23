import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/oss-doorway';

async function traceClassConfig() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('🔍 Connected to MongoDB, tracing config for class 68a770b8140b9c0174c13ce7...');
    
    const db = client.db();
    
    // Step 1: Find the class/group in groups collection
    console.log('\n📋 Step 1: Finding class in groups collection...');
    const groupsCollection = db.collection('groups');
    const classGroup = await groupsCollection.findOne({
      _id: '68a770b8140b9c0174c13ce7'
    });
    
    if (classGroup) {
      console.log('✅ Found class group:');
      console.log(`   - ID: ${classGroup._id}`);
      console.log(`   - Name: ${classGroup.name || 'N/A'}`);
      console.log(`   - questJsonConfig: ${classGroup.questJsonConfig || 'NOT SET'}`);
      console.log(`   - Created: ${classGroup.createdAt}`);
      console.log(`   - Other fields:`, Object.keys(classGroup));
    } else {
      console.log('❌ Class group not found in groups collection');
    }
    
    // Step 2: Find user CocoCrispy95 to see their config
    console.log('\n👤 Step 2: Finding user CocoCrispy95...');
    const questsCollection = db.collection('quests');
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
    
    // Step 3: Search for all quest configs that might be related
    console.log('\n🔧 Step 3: Finding all related quest configs...');
    const questConfigsCollection = db.collection('questconfigs');
    
    // Search patterns based on what we know
    const searchPatterns = [
      '68a770b8140b9c0174c13ce7',
      '68a770b8140b9c0174c13ce8',
      classGroup?.questJsonConfig,
      user?.user_data?.customGroupId
    ].filter(Boolean);
    
    console.log(`🔍 Searching for configs matching: ${searchPatterns.join(', ')}`);
    
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
            
            // Show task counts for each quest
            for (const quest of quests) {
              if (config.config[quest] && typeof config.config[quest] === 'object') {
                const tasks = Object.keys(config.config[quest]).filter(k => k.startsWith('T'));
                console.log(`      - ${quest}: ${tasks.length} tasks`);
              }
            }
          }
          
          // Mark important configs
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
    
    // Step 4: Also search for ANY config with these base IDs
    console.log('\n🌐 Step 4: Broad search for any related configs...');
    const allRelatedConfigs = await questConfigsCollection.find({
      $or: [
        { classId: { $regex: '68a770b8140b9c0174c13ce7', $options: 'i' } },
        { classId: { $regex: '68a770b8140b9c0174c13ce8', $options: 'i' } }
      ]
    }).toArray();
    
    if (allRelatedConfigs.length > 0) {
      console.log(`\n🎯 Found ${allRelatedConfigs.length} total related configs:`);
      for (const config of allRelatedConfigs) {
        console.log(`   - ${config.classId} (${config.createdAt})`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

traceClassConfig();





