const { MongoClient } = require('mongodb');
const fs = require('fs');

// MongoDB connection
const OSS_DOORWAY_URI = process.env.OSS_DOORWAY_DB_URI || 'mongodb+srv://cna93:gamification@gamification.nwes9ze.mongodb.net/?retryWrites=true&w=majority&appName=gamification';
const OSS_DOORWAY_DB_NAME = process.env.OSS_DOORWAY_DB_NAME || 'test';

async function pullQuestConfig() {
  console.log('🚀 Pulling quest configuration: 68a770b8140b9c0174c13ce8-with-q3');
  
  const client = new MongoClient(OSS_DOORWAY_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(OSS_DOORWAY_DB_NAME);
    const questConfigsCollection = db.collection('questconfigs');
    
    // Find the specific quest configuration
    const config = await questConfigsCollection.findOne({
      configId: '68a770b8140b9c0174c13ce8-with-q3'
    });
    
    if (!config) {
      console.log('❌ Quest configuration not found');
      return;
    }
    
    console.log('✅ Found quest configuration');
    console.log(`📋 Config ID: ${config.configId}`);
    console.log(`📋 Class ID: ${config.classId}`);
    console.log(`📋 Created: ${config.createdAt}`);
    console.log(`📋 Updated: ${config.updatedAt}`);
    
    // Check Q3T1 points specifically
    if (config.config.Q3 && config.config.Q3.T1) {
      console.log(`🎯 Q3T1 Points: ${config.config.Q3.T1.points}`);
      console.log(`🎯 Q3T1 XP: ${config.config.Q3.T1.xp}`);
    }
    
    // Save to file
    const configFilePath = `quest_config_${config.configId}_pulled_${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(configFilePath, JSON.stringify(config, null, 2));
    
    console.log(`💾 Saved to: ${configFilePath}`);
    console.log('');
    console.log('📊 Configuration Summary:');
    console.log(`   📝 Quests: ${Object.keys(config.config).filter(key => key.startsWith('Q')).join(', ')}`);
    
    if (config.config.Q3) {
      const q3Tasks = Object.keys(config.config.Q3).filter(key => key.startsWith('T'));
      console.log(`   📝 Q3 Tasks: ${q3Tasks.join(', ')}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

pullQuestConfig();
