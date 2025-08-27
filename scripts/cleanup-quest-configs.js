const { MongoClient } = require('mongodb');

const uri = 'mongodb+srv://cna93:gamification@gamification.nwes9ze.mongodb.net/?retryWrites=true&w=majority&appName=gamification';
const dbName = 'test';

async function cleanupConfigs() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(dbName);
    const QuestConfig = db.collection('questconfigs');

    console.log('🧹 Cleaning up quest configs with undefined/null values...');

    // Find configs with undefined/null groupId or configId
    const problematicConfigs = await QuestConfig.find({
      $or: [
        { groupId: { $exists: false } },
        { groupId: null },
        { groupId: undefined },
        { configId: { $exists: false } },
        { configId: null },
        { configId: undefined }
      ]
    }).toArray();

    console.log(`📊 Found ${problematicConfigs.length} problematic configs`);

    if (problematicConfigs.length > 0) {
      // Delete problematic configs
      const result = await QuestConfig.deleteMany({
        $or: [
          { groupId: { $exists: false } },
          { groupId: null },
          { groupId: undefined },
          { configId: { $exists: false } },
          { configId: null },
          { configId: undefined }
        ]
      });

      console.log(`✅ Deleted ${result.deletedCount} problematic configs`);
    }

    // Show remaining configs
    const remainingConfigs = await QuestConfig.find({}).toArray();
    console.log(`\n📊 Remaining configs: ${remainingConfigs.length}`);
    remainingConfigs.forEach(config => {
      console.log(`- groupId: ${config.groupId}, configId: ${config.configId}`);
    });

  } finally {
    await client.close();
  }
}

cleanupConfigs();
