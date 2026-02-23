require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const CLASS_ID = '691b7f64528ddbaa6810aa3f';

async function restoreAndVerify() {
  console.log('='.repeat(80));
  console.log('🔧 RESTORING AND VERIFYING DATABASE CONFIG');
  console.log('='.repeat(80));
  console.log('');
  
  try {
    // Load correct config
    const configPath = path.join(__dirname, 'shared-quest-configs', 'q1-github-basics-config.json');
    const correctConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    
    console.log('✅ Loaded correct config');
    console.log(`   Q1.T1 type: ${correctConfig.questSequence[0].tasks.T1.type}`);
    console.log('');
    
    // Connect using EXACT bot method
    const ossDoorwayURI = process.env.URI;
    const ossDoorwayDBName = process.env.DB_NAME;
    const connectionString = `${ossDoorwayURI}/${ossDoorwayDBName}`;
    
    console.log('📡 Connecting using EXACT bot method...');
    console.log(`   URI: ${ossDoorwayURI.substring(0, 60)}...`);
    console.log(`   DB_NAME: ${ossDoorwayDBName}`);
    console.log(`   Connection: ${connectionString.substring(0, 80)}...`);
    console.log('');
    
    const connection = await mongoose.createConnection(connectionString, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }).asPromise();
    
    console.log('✅ Connected');
    console.log('');
    
    // EXACT schema bot uses
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
    
    // Delete any existing
    console.log('🗑️  Deleting any existing configs...');
    const deleted = await QuestConfig.deleteMany({
      $or: [
        { groupId: CLASS_ID },
        { configId: CLASS_ID },
        { classId: CLASS_ID }
      ]
    });
    console.log(`   Deleted ${deleted.deletedCount} config(s)`);
    console.log('');
    
    // Insert correct config
    console.log('💾 Inserting CORRECT config...');
    const now = new Date();
    const newConfig = await QuestConfig.create({
      configId: CLASS_ID,
      classId: CLASS_ID,
      groupId: CLASS_ID,
      config: correctConfig,
      configData: correctConfig,
      createdAt: now,
      updatedAt: now,
      createdBy: 'restore-and-verify-db-config',
      source: 'database',
      originalFilePath: `quest_config_${CLASS_ID}.json`,
      version: 4
    });
    
    console.log(`✅ Config saved with _id: ${newConfig._id}`);
    console.log('');
    
    // NOW verify using EXACT bot query
    console.log('🔍 Verifying using EXACT bot query...');
    console.log(`   Query: $or: [{groupId: "${CLASS_ID}"}, {configId: "${CLASS_ID}"}, {classId: "${CLASS_ID}"}]`);
    console.log('');
    
    const found = await QuestConfig.findOne({
      $or: [
        { groupId: CLASS_ID },
        { configId: CLASS_ID },
        { classId: CLASS_ID }
      ]
    });
    
    if (!found) {
      console.error('❌❌❌ CONFIG NOT FOUND AFTER SAVE!');
      console.error('This means the bot will NOT find it!');
      await connection.close();
      return;
    }
    
    console.log('✅ Config found!');
    console.log(`   _id: ${found._id}`);
    console.log(`   configId: ${found.configId}`);
    console.log(`   classId: ${found.classId}`);
    console.log(`   groupId: ${found.groupId}`);
    console.log('');
    
    // Get config data EXACTLY as bot does
    let configData = found.configData || found.config;
    
    if (typeof configData === 'string') {
      configData = JSON.parse(configData);
    }
    
    if (!configData) {
      console.error('❌❌❌ Config data is null/undefined!');
      await connection.close();
      return;
    }
    
    console.log('📋 Config data structure:');
    console.log(`   Keys: ${Object.keys(configData).join(', ')}`);
    console.log(`   Has questSequence: ${Array.isArray(configData.questSequence)}`);
    
    if (configData.questSequence && configData.questSequence[0]) {
      const q1 = configData.questSequence[0];
      const t1 = q1.tasks?.T1;
      
      console.log(`   Q1 questId: ${q1.questId}`);
      console.log(`   Q1 tasks: ${Object.keys(q1.tasks).length}`);
      console.log(`   Q1.T1 type: ${t1?.type}`);
      console.log(`   Q1.T1 desc: ${t1?.desc}`);
      
      if (t1?.type === 'get-issue-count') {
        console.log('');
        console.log('✅✅✅ SUCCESS! Config is CORRECT in database!');
        console.log('✅✅✅ Bot WILL find it using this exact query!');
        console.log('✅✅✅ T1 will route to handleIssueCount!');
      } else {
        console.log('');
        console.error(`❌❌❌ ERROR! T1 type is "${t1?.type}" - should be "get-issue-count"`);
      }
    } else {
      console.error('❌❌❌ ERROR! No questSequence in config!');
    }
    
    await connection.close();
    console.log('');
    console.log('='.repeat(80));
    console.log('🎯 CONCLUSION');
    console.log('='.repeat(80));
    console.log('The config is now in the database and can be found using the exact bot query.');
    console.log('When the bot cache expires, it will:');
    console.log('  1. Check cache (miss)');
    console.log('  2. Query database using EXACT same query');
    console.log('  3. Find this config');
    console.log('  4. Convert and cache it');
    console.log('  5. Use it correctly');
    console.log('');
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.error(error.stack);
  }
}

restoreAndVerify();


