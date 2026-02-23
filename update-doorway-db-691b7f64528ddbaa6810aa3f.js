require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const CLASS_ID = '691b7f64528ddbaa6810aa3f';

async function updateDoorwayDB() {
  let ossDoorwayConnection = null;
  
  try {
    // Read the Q1 configuration with 6 tasks
    const configPath = path.join(__dirname, 'shared-quest-configs', 'q1-github-basics-config.json');
    const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));

    console.log('🔄 Updating OSS-Doorway database for class 691b7f64528ddbaa6810aa3f...\n');

    // Use the MAIN bot database connection (URI + DB_NAME)
    const DOORWAY_URI = process.env.URI;
    const DOORWAY_DB_NAME = process.env.DB_NAME;

    if (!DOORWAY_URI || !DOORWAY_DB_NAME) {
      console.error('❌ URI or DB_NAME not found in environment variables');
      return;
    }

    console.log(`📡 Connecting to OSS-Doorway DB: ${DOORWAY_DB_NAME}...`);
    ossDoorwayConnection = await mongoose.createConnection(DOORWAY_URI, {
      dbName: DOORWAY_DB_NAME,
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }).asPromise();

    console.log('✅ Connected to OSS-Doorway database\n');

    // Define the QuestConfig schema
    const questConfigSchema = new mongoose.Schema({
      configId: { type: String, required: true },
      classId: String,
      groupId: String,
      config: mongoose.Schema.Types.Mixed,
      configData: mongoose.Schema.Types.Mixed,
      createdAt: Date,
      updatedAt: Date,
      createdBy: String,
      source: String,
      originalFilePath: String,
      version: Number
    }, { collection: 'questconfigs', strict: false });

    const DoorwayQuestConfig = ossDoorwayConnection.model('QuestConfig', questConfigSchema);

    // Check if config already exists
    const existing = await DoorwayQuestConfig.findOne({
      $or: [
        { configId: CLASS_ID },
        { classId: CLASS_ID },
        { groupId: CLASS_ID }
      ]
    });

    console.log(`Existing config: ${existing ? 'FOUND' : 'NOT FOUND'}`);
    if (existing) {
      console.log(`   Config ID: ${existing.configId || existing.groupId || existing.classId}`);
      console.log(`   Updated at: ${existing.updatedAt}`);
    }
    console.log('');

    // Update or create the quest config
    const now = new Date();
    const result = await DoorwayQuestConfig.findOneAndUpdate(
      { 
        $or: [
          { configId: CLASS_ID },
          { classId: CLASS_ID },
          { groupId: CLASS_ID }
        ]
      },
      {
        $set: {
          configId: CLASS_ID,
          classId: CLASS_ID,
          groupId: CLASS_ID,
          config: configData,
          configData: configData,
          updatedAt: now,
          createdBy: 'oss-management:update-691b7f64528ddbaa6810aa3f',
          originalFilePath: `quest_config_${CLASS_ID}.json`,
          version: 1
        },
        $setOnInsert: {
          createdAt: now
        }
      },
      { upsert: true, new: true }
    );

    console.log(`✅ Successfully updated OSS-Doorway database (${DOORWAY_DB_NAME})`);
    console.log(`   Config ID: ${result.configId}`);
    console.log(`   Updated at: ${result.updatedAt}`);
    console.log(`   Quest count: ${configData.questSequence?.length || 0}`);
    
    if (configData.questSequence && configData.questSequence[0]) {
      const q1 = configData.questSequence[0];
      const taskCount = q1.tasks ? Object.keys(q1.tasks).length : 0;
      console.log(`   Q1: "${q1.title}" with ${taskCount} tasks`);
    }
    
    console.log('\n⏳ Note: The OSS-Doorway bot cache may take up to 1 hour to expire.');
    console.log('   Students will see the updated config after cache expiry or bot restart.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    if (ossDoorwayConnection) {
      await ossDoorwayConnection.close();
      console.log('\n🔌 Database connection closed.');
    }
  }
}

updateDoorwayDB();

