const { MongoClient } = require('mongodb');
const fs = require('fs');

const OSS_DOORWAY_URI = process.env.OSS_DOORWAY_DB_URI || 'mongodb+srv://cna93:gamification@gamification.nwes9ze.mongodb.net/?retryWrites=true&w=majority&appName=gamification';
const OSS_DOORWAY_DB_NAME = process.env.OSS_DOORWAY_DB_NAME || 'test';

async function addQ3ToRealClass() {
  const client = new MongoClient(OSS_DOORWAY_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to database');
    
    const db = client.db(OSS_DOORWAY_DB_NAME);
    
    // Get the current real class config
    const currentConfig = await db.collection('questconfigs').findOne({
      configId: '68a770b8140b9c0174c13ce8'
    });
    
    if (!currentConfig) {
      console.log('❌ Current config not found');
      return;
    }
    
    console.log('📋 Found current config:', currentConfig.configId);
    
    // Get the test config to extract Q3
    const testConfig = await db.collection('questconfigs').findOne({
      configId: '68accc656847fdb7c19b1f0a-test'
    });
    
    if (!testConfig) {
      console.log('❌ Test config not found');
      return;
    }
    
    console.log('📋 Found test config:', testConfig.configId);
    
    // Extract Q3 from test config (it's the TEMP_1756847144814 quest)
    const q3Content = testConfig.config.TEMP_1756847144814;
    
    if (!q3Content) {
      console.log('❌ Q3 content not found in test config');
      return;
    }
    
    console.log('📋 Extracted Q3 content');
    
    // Create new config with Q3 added
    const newConfigId = '68a770b8140b9c0174c13ce8-with-q3';
    const newConfig = {
      ...currentConfig,
      _id: undefined, // Let MongoDB generate new _id
      configId: newConfigId,
      classId: newConfigId,
      config: {
        ...currentConfig.config,
        Q3: {
          ...q3Content,
          metadata: {
            ...q3Content.metadata,
            title: "A-2.1 - Software Engineering Tools",
            description: "Goal: You will gain a deeper understanding of the tools used in software engineering.",
            prerequisite: "Q2",
            type: "custom"
          }
        }
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: "q3-addition-script",
      source: "q3-addition"
    };
    
    // Insert the new config
    const result = await db.collection('questconfigs').insertOne(newConfig);
    console.log('✅ Created new config with ID:', result.insertedId);
    console.log('📋 New config ID:', newConfigId);
    
    // Save the new config to file for verification
    const configFilePath = `quest_config_${newConfigId}.json`;
    fs.writeFileSync(configFilePath, JSON.stringify(newConfig, null, 2));
    console.log('💾 Saved new config to:', configFilePath);
    
    // Update all user_data entries for this class to use the new config
    const updateResult = await db.collection('user_data').updateMany(
      { 'user_data.customGroupId': '68a770b8140b9c0174c13ce8' },
      { $set: { 'user_data.customGroupId': newConfigId } }
    );
    
    console.log('✅ Updated', updateResult.modifiedCount, 'user records to use new config');
    
    // List the updated users
    const updatedUsers = await db.collection('user_data').find({
      'user_data.customGroupId': newConfigId
    }).toArray();
    
    console.log('📋 Users now using new config:');
    updatedUsers.forEach(user => {
      console.log('  -', user._id);
    });
    
    console.log('✅ Done! New config created and users updated');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

addQ3ToRealClass();
