const { MongoClient } = require('mongodb');

const OSS_DOORWAY_URI = process.env.OSS_DOORWAY_DB_URI || 'mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/?retryWrites=true&w=majority&appName=gamification';
const OSS_DOORWAY_DB_NAME = process.env.OSS_DOORWAY_DB_NAME || 'test';

async function checkQuestConfigs() {
  const client = new MongoClient(OSS_DOORWAY_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to database');
    
    const db = client.db(OSS_DOORWAY_DB_NAME);
    
    // Get all quest configs
    const configs = await db.collection('questconfigs').find({}).toArray();
    console.log(`📋 Found ${configs.length} quest configs:`);
    
    configs.forEach(config => {
      console.log(`   - ${config.configId} (${config.classId || 'no classId'})`);
      if (config.config) {
        const quests = Object.keys(config.config).filter(k => k.startsWith('Q'));
        console.log(`     Quests: ${quests.join(', ')}`);
      }
    });
    
    // Check users and their customGroupIds
    const users = await db.collection('users').find({}).toArray();
    console.log(`\n👥 Users and their customGroupIds:`);
    users.forEach(user => {
      console.log(`   - ${user.username}: ${user.user_data.customGroupId || 'null'}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the script
checkQuestConfigs().catch(console.error);
