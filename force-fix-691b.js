require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const CLASS_ID = '691b7f64528ddbaa6810aa3f';

async function forceFix() {
  console.log('🔧 FORCE FIXING CONFIG FOR CLASS 691b7f64528ddbaa6810aa3f');
  console.log('='.repeat(80));
  console.log('');
  
  try {
    // Read the correct config
    const configPath = path.join(__dirname, 'shared-quest-configs', 'q1-github-basics-config.json');
    const correctConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    
    console.log('✅ Loaded correct config:');
    console.log(`   Quests: ${correctConfig.questSequence.length}`);
    console.log(`   Q1.T1 type: ${correctConfig.questSequence[0].tasks.T1.type}`);
    console.log('');
    
    // Connect to the EXACT database the bot uses
    const DOORWAY_URI = process.env.URI;
    const DOORWAY_DB_NAME = process.env.DB_NAME;
    
    console.log(`📡 Connecting to: ${DOORWAY_DB_NAME}...`);
    const connection = await mongoose.createConnection(DOORWAY_URI, {
      dbName: DOORWAY_DB_NAME,
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }).asPromise();
    
    console.log('✅ Connected\n');
    
    // Delete ALL existing configs for this class ID
    const questConfigSchema = new mongoose.Schema({}, { collection: 'questconfigs', strict: false });
    const QuestConfig = connection.model('QuestConfig', questConfigSchema);
    
    console.log('🗑️  Deleting ALL existing configs for this class...');
    const deleteResult = await QuestConfig.deleteMany({
      $or: [
        { configId: CLASS_ID },
        { classId: CLASS_ID },
        { groupId: CLASS_ID }
      ]
    });
    console.log(`   Deleted ${deleteResult.deletedCount} config(s)\n`);
    
    // Insert the CORRECT config with a fresh timestamp
    console.log('💾 Inserting CORRECT config...');
    const now = new Date();
    const newConfig = new QuestConfig({
      configId: CLASS_ID,
      classId: CLASS_ID,
      groupId: CLASS_ID,
      config: correctConfig,
      configData: correctConfig,
      createdAt: now,
      updatedAt: now,
      createdBy: 'force-fix-691b',
      originalFilePath: `quest_config_${CLASS_ID}.json`,
      version: 2
    });
    
    await newConfig.save();
    console.log('✅ Config saved with fresh timestamp\n');
    
    // Verify it's there
    console.log('🔍 Verifying saved config...');
    const verify = await QuestConfig.findOne({ configId: CLASS_ID });
    
    if (verify) {
      const savedConfig = verify.config || verify.configData;
      if (savedConfig && savedConfig.questSequence) {
        const q1 = savedConfig.questSequence[0];
        console.log(`✅ Verified: Q1 has ${Object.keys(q1.tasks).length} tasks`);
        console.log(`✅ Verified: Q1.T1 type: ${q1.tasks.T1.type}`);
        
        if (q1.tasks.T1.type === 'get-issue-count') {
          console.log('');
          console.log('✅✅✅ SUCCESS! Config is CORRECT in database!');
          console.log('');
          console.log('⏳ Next steps:');
          console.log('   1. The bot cache will expire within 1 hour');
          console.log('   2. OR restart the bot to clear cache immediately');
          console.log('   3. Bot will load from database (Priority 1)');
          console.log('   4. Config will be converted and cached correctly');
        } else {
          console.log(`❌ ERROR: T1 type is still wrong: ${q1.tasks.T1.type}`);
        }
      } else {
        console.log('❌ ERROR: Config structure is wrong');
      }
    } else {
      console.log('❌ ERROR: Config not found after save!');
    }
    
    await connection.close();
    console.log('\n🔌 Database connection closed');
    
  } catch (error) {
    console.error('❌ ERROR:', error);
    console.error(error.stack);
  }
}

forceFix();


