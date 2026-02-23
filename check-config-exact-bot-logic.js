require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const CLASS_ID = '691b7f64528ddbaa6810aa3f';

/**
 * EXACT replica of ConfigService.loadConfigFromDatabase
 */
async function loadConfigFromDatabase(groupId) {
  try {
    console.log(`🔍 [ConfigService] Attempting to load config from database for: ${groupId}`);
    
    // Use the main OSS-Doorway database connection (same as URI/DB_NAME)
    const ossDoorwayURI = process.env.URI;
    const ossDoorwayDBName = process.env.DB_NAME;
    
    if (!ossDoorwayURI || !ossDoorwayDBName) {
      console.warn(`⚠️ [ConfigService] Main database credentials not found, skipping database lookup`);
      return null;
    }
    
    console.log(`📡 Using URI: ${ossDoorwayURI}`);
    console.log(`📡 Using DB: ${ossDoorwayDBName}`);
    
    // Create connection to main OSS-Doorway database - EXACT same way bot does
    const connection = await mongoose.createConnection(`${ossDoorwayURI}/${ossDoorwayDBName}`, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }).asPromise();
    
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
    console.log(`🔍 Querying with: $or: [{groupId: "${groupId}"}, {configId: "${groupId}"}, {classId: "${groupId}"}]`);
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
      console.log(`   updatedAt: ${config.updatedAt}`);
      console.log(`   createdBy: ${config.createdBy}`);
      
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
    console.error(error.stack);
    return null;
  }
}

/**
 * EXACT replica of ConfigService.loadConfigFromFile
 */
function loadConfigFromFile(groupId) {
  try {
    // EXACT path the bot uses
    const configPath = path.join(process.cwd(), 'src/config/generated', `quest_config_${groupId}.json`);
    console.log(`🔍 [ConfigService] Attempting to load config from file: ${configPath}`);
    
    if (fs.existsSync(configPath)) {
      const content = fs.readFileSync(configPath, 'utf8');
      const config = JSON.parse(content);
      console.log(`✅ [ConfigService] Successfully loaded config from file for: ${groupId}`);
      return config;
    }
    
    console.log(`⚠️ [ConfigService] Config file not found for: ${groupId}`);
    return null;
  } catch (error) {
    console.error(`❌ [ConfigService] Failed to load config from file for ${groupId}:`, error.message);
    return null;
  }
}

/**
 * Simulate ConfigService.loadConfig - EXACT same priority order
 */
async function loadConfig(groupId) {
  const startTime = Date.now();
  console.log(`🔍 [ConfigService] Loading config for: ${groupId}`);
  
  // Priority 1: Try database (new functionality) with exponential backoff
  try {
    console.log(`🐌 [ConfigService] Querying database...`);
    
    const dbConfig = await loadConfigFromDatabase(groupId);
    
    if (dbConfig) {
      const duration = Date.now() - startTime;
      console.log(`✅ [ConfigService] Database config loaded for "${groupId}" in ${duration}ms`);
      return dbConfig;
    }
  } catch (error) {
    console.warn(`⚠️ [ConfigService] Database lookup failed for ${groupId}, continuing with file fallback:`, error.message);
  }

  // Priority 2: Fallback to file system
  try {
    console.log(`📁 [ConfigService] Trying file system for "${groupId}"...`);
    
    const fileConfig = loadConfigFromFile(groupId);
    
    if (fileConfig) {
      const duration = Date.now() - startTime;
      console.log(`✅ [ConfigService] File config loaded for "${groupId}" in ${duration}ms`);
      return fileConfig;
    }
  } catch (error) {
    console.warn(`⚠️ [ConfigService] File lookup failed for ${groupId}:`, error.message);
  }

  // Priority 3: No config found
  const duration = Date.now() - startTime;
  console.log(`⚠️ [ConfigService] No config found for: ${groupId} after ${duration}ms`);
  return null;
}

/**
 * Simulate convertQuestSequenceToLegacy
 */
function convertQuestSequenceToLegacy(questConfig) {
  const legacyConfig = { map_repo_link: questConfig.map_repo_link };

  questConfig.questSequence.forEach((quest) => {
    const questId = quest.questId;
    const processedTasks = {};

    Object.entries(quest.tasks || {}).forEach(([taskId, taskData]) => {
      processedTasks[taskId] = { ...taskData };
    });

    if (quest.metadata) {
      legacyConfig[questId] = { ...processedTasks, metadata: quest.metadata };
    } else {
      legacyConfig[questId] = processedTasks;
    }
  });

  return legacyConfig;
}

/**
 * Main check function
 */
async function checkConfig() {
  console.log('='.repeat(80));
  console.log('🔍 CHECKING CONFIG USING EXACT BOT LOGIC');
  console.log('='.repeat(80));
  console.log('');
  
  try {
    // Step 1: Load config using EXACT bot logic
    const rawConfig = await loadConfig(CLASS_ID);
    
    if (!rawConfig) {
      console.log('');
      console.log('❌❌❌ CONFIG NOT FOUND!');
      console.log('');
      console.log('The bot will NOT find this config and will use default config.');
      console.log('This needs to be fixed!');
      return;
    }
    
    console.log('');
    console.log('✅ Config found!');
    console.log('');
    console.log('📋 Raw config structure:');
    console.log('   Keys:', Object.keys(rawConfig));
    console.log('   Has questSequence:', Array.isArray(rawConfig?.questSequence));
    
    // Step 2: Convert if needed (same as bot does)
    let questConfig = rawConfig;
    if (Array.isArray(rawConfig?.questSequence)) {
      console.log('');
      console.log('🔧 Converting questSequence to legacy format (as bot does)...');
      questConfig = convertQuestSequenceToLegacy(rawConfig);
      console.log('✅ Conversion complete');
    }
    
    console.log('');
    console.log('📋 Final config (what bot will use):');
    const questKeys = Object.keys(questConfig).filter(k => k !== 'map_repo_link' && k !== 'readme');
    console.log('   Quest keys:', questKeys);
    
    // Step 3: Verify Q1.T1
    if (questConfig.Q1 && questConfig.Q1.T1) {
      const t1 = questConfig.Q1.T1;
      console.log('');
      console.log('🎯 Q1.T1 Analysis:');
      console.log(`   Type: ${t1.type}`);
      console.log(`   Description: ${t1.desc}`);
      
      if (t1.type === 'get-issue-count') {
        console.log('');
        console.log('✅✅✅ SUCCESS! Config is CORRECT!');
        console.log('✅✅✅ T1 will route to handleIssueCount');
        console.log('✅✅✅ Bot will work correctly when cache expires!');
      } else {
        console.log('');
        console.log(`❌❌❌ ERROR! T1 type is "${t1.type}"`);
        console.log('❌❌❌ This is WRONG and needs to be fixed!');
      }
    } else {
      console.log('');
      console.log('❌❌❌ ERROR! Q1.T1 not found!');
    }
    
    console.log('');
    console.log('='.repeat(80));
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.error(error.stack);
  }
}

checkConfig();


