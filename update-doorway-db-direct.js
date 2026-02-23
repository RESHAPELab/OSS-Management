require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const CLASS_ID = '692735b4668a78a28bcf7c3e';

async function updateDoorwayDB() {
  let ossDoorwayConnection = null;
  
  try {
    // Read the Q1 configuration with 6 tasks
    const configPath = path.join(__dirname, 'shared-quest-configs', 'q1-github-basics-config.json');
    const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));

    console.log('🔄 Updating OSS-Doorway database directly...\n');

    // Connect to OSS-Doorway database
    const DOORWAY_URI = process.env.OSS_DOORWAY_DB_URI;
    const DOORWAY_DB_NAME = process.env.OSS_DOORWAY_DB_NAME || 'student-quests';

    if (!DOORWAY_URI) {
      console.error('❌ OSS_DOORWAY_DB_URI not found in environment variables');
      console.log('Available env vars:', Object.keys(process.env).filter(k => k.includes('DOORWAY')));
      return;
    }

    console.log(`📡 Connecting to OSS-Doorway DB: ${DOORWAY_DB_NAME}...`);
    ossDoorwayConnection = await mongoose.createConnection(DOORWAY_URI, {
      dbName: DOORWAY_DB_NAME,
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }).asPromise();

    console.log('✅ Connected to OSS-Doorway database\n');

    // Define the QuestConfig schema for OSS-Doorway
    const questConfigSchema = new mongoose.Schema({
      configId: { type: String, required: true },
      classId: String,
      config: mongoose.Schema.Types.Mixed,
      createdAt: Date,
      updatedAt: Date,
      createdBy: String,
      originalFilePath: String,
      version: Number
    }, { collection: 'questconfigs', strict: false });

    const DoorwayQuestConfig = ossDoorwayConnection.model('QuestConfig', questConfigSchema);

    // Update or create the quest config
    const now = new Date();
    const result = await DoorwayQuestConfig.findOneAndUpdate(
      { configId: CLASS_ID },
      {
        configId: CLASS_ID,
        classId: CLASS_ID,
        config: configData,
        updatedAt: now,
        createdBy: 'oss-management:manual-update',
        originalFilePath: `quest_config_${CLASS_ID}.json`,
        version: 1
      },
      { upsert: true, new: true }
    );

    console.log(`✅ Successfully updated OSS-Doorway database`);
    console.log(`   Config ID: ${result.configId}`);
    console.log(`   Updated at: ${result.updatedAt}`);
    console.log(`   Quest count: ${configData.questSequence?.length || 0}`);
    
    if (configData.questSequence && configData.questSequence[0]) {
      const q1 = configData.questSequence[0];
      const taskCount = q1.tasks ? Object.keys(q1.tasks).length : 0;
      console.log(`   Q1: "${q1.title}" with ${taskCount} tasks`);
    }
    
    console.log('\n⏳ Note: The OSS-Doorway bot cache may take up to 1 hour to expire.');
    console.log('   Student will see the updated config after cache expiry or bot restart.');

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

