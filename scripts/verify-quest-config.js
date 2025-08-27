const { MongoClient } = require('mongodb');

const uri = 'mongodb+srv://cna93:gamification@gamification.nwes9ze.mongodb.net/?retryWrites=true&w=majority&appName=gamification';
const dbName = 'test';

async function verifyConfig() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(dbName);

    const QuestConfig = db.collection('questconfigs');

    // Check if our class now has a config
    const ourConfig = await QuestConfig.findOne({ groupId: '68ab703e6ceb965e0759df11' });
    if (ourConfig) {
      console.log('✅ Class 68ab703e6ceb965e0759df11 now has config:');
      console.log('- groupId:', ourConfig.groupId);
      console.log('- configId:', ourConfig.configId);
      console.log('- has configData:', !!ourConfig.configData);

      if (ourConfig.configData) {
        const parsed = JSON.parse(ourConfig.configData);
        console.log('- questSequence length:', parsed.questSequence?.length || 0);
        console.log('- first quest:', parsed.questSequence?.[0]?.title || 'None');
      }
    } else {
      console.log('❌ Class 68ab703e6ceb965e0759df11 still has no config');
    }

    // Also check for any configs with this groupId
    const allConfigs = await QuestConfig.find({}).toArray();
    console.log('\n📊 All quest configs in database:');
    allConfigs.forEach(config => {
      console.log(`- groupId: ${config.groupId}, configId: ${config.configId}`);
    });

  } finally {
    await client.close();
  }
}

verifyConfig();
