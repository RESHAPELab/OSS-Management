require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const CLASS_ID = '691b7f64528ddbaa6810aa3f';

/**
 * EXACT replica of ConfigService.loadConfigFromDatabase
 * This is the EXACT method the bot uses
 */
async function loadConfigFromDatabase_EXACT_BOT_METHOD(groupId) {
  try {
    console.log(`🔍 [ConfigService] Attempting to load config from database for: ${groupId}`);
    
    // Use the main OSS-Doorway database connection (same as URI/DB_NAME)
    const ossDoorwayURI = process.env.URI;
    const ossDoorwayDBName = process.env.DB_NAME;
    
    if (!ossDoorwayURI || !ossDoorwayDBName) {
      console.warn(`⚠️ [ConfigService] Main database credentials not found, skipping database lookup`);
      return null;
    }
    
    console.log(`📡 URI: ${ossDoorwayURI}`);
    console.log(`📡 DB_NAME: ${ossDoorwayDBName}`);
    
    // EXACT connection method the bot uses
    const connectionString = `${ossDoorwayURI}/${ossDoorwayDBName}`;
    console.log(`🔗 Connection string: ${connectionString.substring(0, 100)}...`);
    
    // Create connection to main OSS-Doorway database - EXACT same as bot
    const connection = await mongoose.createConnection(connectionString, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }).asPromise();
    
    console.log(`✅ Connected to database`);
    
    // Define QuestConfig schema for this connection - EXACT same as bot
    const questConfigSchema = new mongoose.Schema({
      groupId: String,     // Legacy schema field
      configId: String,    // New schema field (has unique index)
      classId: String,     // Class/group identifier
      configData: Object,  // Legacy schema field
      config: mongoose.Schema.Types.Mixed,      // Mixed type to handle both Object and String
      createdAt: Date,
      updatedAt: Date,
      source: String,      // Legacy schema field
      createdBy: String,   // New schema field
      originalFilePath: String, // New schema field
      version: Number      // New schema field
    }, { collection: 'questconfigs' });
    
    const QuestConfig = connection.model('QuestConfig', questConfigSchema);
    
    // Find the config using multiple field types - EXACT same query as bot
    const config = await QuestConfig.findOne({
      $or: [
        { groupId: groupId },
        { configId: groupId },
        { classId: groupId }
      ]
    });
    
    // Close connection
    await connection.close();
    
    if (config) {
      console.log(`✅ [ConfigService] Successfully loaded config from database for: ${groupId}`);
      console.log(`   _id: ${config._id}`);
      console.log(`   configId: ${config.configId}`);
      console.log(`   classId: ${config.classId}`);
      console.log(`   groupId: ${config.groupId}`);
      
      // Get the config data from either field - EXACT same logic as bot
      let configData = config.configData || config.config;
      
      // If config field is a string (JSON), parse it - EXACT same logic as bot
      if (typeof configData === 'string') {
        try {
          configData = JSON.parse(configData);
          console.log(`🔧 [ConfigService] Parsed string config to object for: ${groupId}`);
        } catch (parseError) {
          console.error(`❌ [ConfigService] Failed to parse config JSON for ${groupId}:`, parseError.message);
          return null;
        }
      }
      
      return configData;
    }
    
    console.log(`⚠️ [ConfigService] No config found in database for: ${groupId}`);
    return null;
  } catch (error) {
    console.error(`❌ [ConfigService] Failed to load config from database for ${groupId}:`, error.message);
    return null;
  }
}

/**
 * Save config using EXACT bot connection method
 */
async function saveConfig_EXACT_BOT_METHOD(groupId, configData) {
  try {
    console.log(`💾 Saving config using EXACT bot connection method...`);
    
    const ossDoorwayURI = process.env.URI;
    const ossDoorwayDBName = process.env.DB_NAME;
    
    // EXACT connection method the bot uses
    const connectionString = `${ossDoorwayURI}/${ossDoorwayDBName}`;
    const connection = await mongoose.createConnection(connectionString, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }).asPromise();
    
    // EXACT schema the bot uses
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
    
    // Delete all existing
    await QuestConfig.deleteMany({
      $or: [
        { groupId: groupId },
        { configId: groupId },
        { classId: groupId }
      ]
    });
    
    // Insert with ALL fields
    const now = new Date();
    await QuestConfig.create({
      configId: groupId,
      classId: groupId,
      groupId: groupId,
      config: configData,
      configData: configData,
      createdAt: now,
      updatedAt: now,
      createdBy: 'final-verify-exact-bot-method',
      source: 'database',
      originalFilePath: `quest_config_${groupId}.json`,
      version: 3
    });
    
    await connection.close();
    console.log(`✅ Config saved using EXACT bot method`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to save:`, error.message);
    return false;
  }
}

async function main() {
  console.log('='.repeat(80));
  console.log('🔍 FINAL VERIFICATION USING EXACT BOT METHOD');
  console.log('='.repeat(80));
  console.log('');
  
  // Step 1: Load correct config
  const configPath = path.join(__dirname, 'shared-quest-configs', 'q1-github-basics-config.json');
  const correctConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  
  console.log('✅ Loaded correct config:');
  console.log(`   Q1.T1 type: ${correctConfig.questSequence[0].tasks.T1.type}`);
  console.log('');
  
  // Step 2: Save using EXACT bot method
  console.log('STEP 1: Save config using EXACT bot connection method');
  console.log('-'.repeat(80));
  const saved = await saveConfig_EXACT_BOT_METHOD(CLASS_ID, correctConfig);
  
  if (!saved) {
    console.error('❌ Failed to save config!');
    return;
  }
  
  console.log('');
  
  // Step 3: Load using EXACT bot method
  console.log('STEP 2: Load config using EXACT bot method');
  console.log('-'.repeat(80));
  const loadedConfig = await loadConfigFromDatabase_EXACT_BOT_METHOD(CLASS_ID);
  
  if (!loadedConfig) {
    console.log('');
    console.error('❌❌❌ CONFIG NOT FOUND!');
    console.error('The bot will NOT be able to find this config!');
    return;
  }
  
  console.log('');
  console.log('✅ Config loaded successfully!');
  console.log('');
  
  // Step 4: Verify structure
  console.log('STEP 3: Verify config structure');
  console.log('-'.repeat(80));
  console.log('📋 Config structure:');
  console.log(`   Keys: ${Object.keys(loadedConfig).join(', ')}`);
  console.log(`   Has questSequence: ${Array.isArray(loadedConfig?.questSequence)}`);
  
  if (loadedConfig.questSequence && loadedConfig.questSequence[0]) {
    const q1 = loadedConfig.questSequence[0];
    const t1 = q1.tasks?.T1;
    
    console.log(`   Q1 questId: ${q1.questId}`);
    console.log(`   Q1 title: ${q1.title}`);
    console.log(`   Q1 tasks: ${Object.keys(q1.tasks).length}`);
    console.log(`   Q1.T1 type: ${t1?.type}`);
    console.log(`   Q1.T1 desc: ${t1?.desc}`);
    
    if (t1?.type === 'get-issue-count') {
      console.log('');
      console.log('✅✅✅ SUCCESS! Config is CORRECT!');
      console.log('✅✅✅ Bot will find it using EXACT same method!');
      console.log('✅✅✅ T1 will route to handleIssueCount!');
    } else {
      console.log('');
      console.error(`❌❌❌ ERROR! T1 type is "${t1?.type}" - should be "get-issue-count"`);
    }
  } else {
    console.error('❌❌❌ ERROR! Config structure is wrong - no questSequence!');
  }
  
  console.log('');
  console.log('='.repeat(80));
  console.log('🎯 CONCLUSION');
  console.log('='.repeat(80));
  console.log('The config is saved and can be loaded using the EXACT same method the bot uses.');
  console.log('When the bot cache expires, it will find this config and use it correctly.');
  console.log('');
}

main().catch(console.error);


