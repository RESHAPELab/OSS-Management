require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const CLASS_ID = '691b7f64528ddbaa6810aa3f';

async function fixAndVerify() {
  console.log('='.repeat(80));
  console.log('🔧 FIXING AND VERIFYING DATABASE CONFIG');
  console.log('='.repeat(80));
  console.log('');
  
  try {
    // Read correct config
    const configPath = path.join(__dirname, 'shared-quest-configs', 'q1-github-basics-config.json');
    const correctConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    
    console.log('✅ Loaded correct config');
    console.log(`   Q1.T1 type: ${correctConfig.questSequence[0].tasks.T1.type}`);
    console.log('');
    
    // Connect using EXACT bot connection string format
    const ossDoorwayURI = process.env.URI;
    const ossDoorwayDBName = process.env.DB_NAME;
    
    console.log(`📡 URI: ${ossDoorwayURI}`);
    console.log(`📡 DB_NAME: ${ossDoorwayDBName}`);
    console.log('');
    
    // The bot uses: mongoose.createConnection(`${ossDoorwayURI}/${ossDoorwayDBName}`)
    // But URI might already have a database name, so let's check
    const connectionString = `${ossDoorwayURI}/${ossDoorwayDBName}`;
    console.log(`🔗 Connection string: ${connectionString.substring(0, 80)}...`);
    console.log('');
    
    const connection = await mongoose.createConnection(connectionString, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }).asPromise();
    
    console.log('✅ Connected to database');
    console.log('');
    
    // Define schema EXACTLY as bot does
    const questConfigSchema = new mongoose.Schema({
      groupId: String,
      configId: String,
      classId: String,
      configData: Object,
      config: mongoose.Schema.Types.Mixed,
      createdAt: Date,
      updatedAt: Date,
      source: String,
      createdBy: String,
      originalFilePath: String,
      version: Number
    }, { collection: 'questconfigs' });
    
    const QuestConfig = connection.model('QuestConfig', questConfigSchema);
    
    // Check what's currently there
    console.log('🔍 Checking existing configs...');
    const existing = await QuestConfig.find({
      $or: [
        { groupId: CLASS_ID },
        { configId: CLASS_ID },
        { classId: CLASS_ID }
      ]
    });
    
    console.log(`   Found ${existing.length} existing config(s)`);
    
    if (existing.length > 0) {
      existing.forEach((cfg, idx) => {
        console.log(`   Config ${idx + 1}:`);
        console.log(`      _id: ${cfg._id}`);
        console.log(`      configId: ${cfg.configId}`);
        console.log(`      classId: ${cfg.classId}`);
        console.log(`      groupId: ${cfg.groupId}`);
        console.log(`      Has config field: ${!!cfg.config}`);
        console.log(`      Has configData field: ${!!cfg.configData}`);
      });
    }
    
    console.log('');
    console.log('🗑️  Deleting all existing configs...');
    const deleteResult = await QuestConfig.deleteMany({
      $or: [
        { groupId: CLASS_ID },
        { configId: CLASS_ID },
        { classId: CLASS_ID }
      ]
    });
    console.log(`   Deleted ${deleteResult.deletedCount} config(s)`);
    console.log('');
    
    // Insert with ALL fields the bot might check
    console.log('💾 Inserting correct config with ALL fields...');
    const now = new Date();
    const newConfig = new QuestConfig({
      configId: CLASS_ID,
      classId: CLASS_ID,
      groupId: CLASS_ID,
      config: correctConfig,
      configData: correctConfig,  // Set both fields
      createdAt: now,
      updatedAt: now,
      createdBy: 'fix-and-verify-db',
      source: 'database',
      originalFilePath: `quest_config_${CLASS_ID}.json`,
      version: 2
    });
    
    await newConfig.save();
    console.log('✅ Config saved');
    console.log('');
    
    // Verify using EXACT bot query
    console.log('🔍 Verifying with EXACT bot query...');
    const verify = await QuestConfig.findOne({
      $or: [
        { groupId: CLASS_ID },
        { configId: CLASS_ID },
        { classId: CLASS_ID }
      ]
    });
    
    if (verify) {
      console.log('✅ Config found!');
      console.log(`   _id: ${verify._id}`);
      console.log(`   configId: ${verify.configId}`);
      console.log(`   classId: ${verify.classId}`);
      console.log(`   groupId: ${verify.groupId}`);
      
      // Get config data EXACTLY as bot does
      let configData = verify.configData || verify.config;
      
      if (typeof configData === 'string') {
        configData = JSON.parse(configData);
      }
      
      if (configData && configData.questSequence) {
        const q1 = configData.questSequence[0];
        console.log(`   ✅ Has questSequence with ${configData.questSequence.length} quest(s)`);
        console.log(`   ✅ Q1.T1 type: ${q1.tasks.T1.type}`);
        
        if (q1.tasks.T1.type === 'get-issue-count') {
          console.log('');
          console.log('✅✅✅ SUCCESS! Config is CORRECT in database!');
          console.log('✅✅✅ Bot will find it and use it!');
        } else {
          console.log('');
          console.log(`❌ ERROR: T1 type is ${q1.tasks.T1.type}`);
        }
      } else {
        console.log('❌ ERROR: Config structure is wrong');
      }
    } else {
      console.log('❌ ERROR: Config not found after save!');
    }
    
    await connection.close();
    console.log('');
    console.log('🔌 Database connection closed');
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.error(error.stack);
  }
}

fixAndVerify();


