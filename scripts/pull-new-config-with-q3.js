const { MongoClient } = require('mongodb');
const fs = require('fs');

const OSS_DOORWAY_URI = process.env.OSS_DOORWAY_DB_URI || 'mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/?retryWrites=true&w=majority&appName=gamification';
const OSS_DOORWAY_DB_NAME = process.env.OSS_DOORWAY_DB_NAME || 'test';

async function pullNewConfigWithQ3() {
  const client = new MongoClient(OSS_DOORWAY_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to database');
    
    const db = client.db(OSS_DOORWAY_DB_NAME);
    
    // Get the new config with Q3
    const newConfig = await db.collection('questconfigs').findOne({
      configId: '68a770b8140b9c0174c13ce8-with-q3'
    });
    
    if (!newConfig) {
      console.log('❌ New config not found');
      return;
    }
    
    console.log('📋 Found new config:', newConfig.configId);
    console.log('📋 Config contains quests:', Object.keys(newConfig.config).filter(key => key.startsWith('Q')));
    
    // Save the config to file
    const configFilePath = `quest_config_${newConfig.configId}_pulled.json`;
    fs.writeFileSync(configFilePath, JSON.stringify(newConfig, null, 2));
    console.log('💾 Saved config to:', configFilePath);
    
    // Show some details about Q3
    if (newConfig.config.Q3) {
      console.log('✅ Q3 found with title:', newConfig.config.Q3.metadata.title);
      console.log('📋 Q3 has', Object.keys(newConfig.config.Q3).filter(key => key.startsWith('T')).length, 'tasks');
      console.log('📋 Q3 prerequisite:', newConfig.config.Q3.metadata.prerequisite);
    } else {
      console.log('❌ Q3 not found in config');
    }
    
    // Check how many users are using this config
    const usersWithNewConfig = await db.collection('user_data').find({
      'user_data.customGroupId': '68a770b8140b9c0174c13ce8-with-q3'
    }).toArray();
    
    console.log('📋 Users using new config:', usersWithNewConfig.length);
    
    console.log('✅ Done!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

pullNewConfigWithQ3();
