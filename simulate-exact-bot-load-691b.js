require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const CLASS_ID = '691b7f64528ddbaa6810aa3f';

/**
 * Simulate EXACT bot loading process following ConfigService priority
 */

// 1. Simulate loadConfigFromFile (Priority 2 in bot)
function loadConfigFromFile(groupId) {
  try {
    // This is the EXACT path the bot uses
    const configPath = path.join(__dirname, '../OSS-Doorway/src/config/generated', `quest_config_${groupId}.json`);
    console.log(`📁 [FILE] Checking: ${configPath}`);
    
    if (fs.existsSync(configPath)) {
      const content = fs.readFileSync(configPath, 'utf8');
      const config = JSON.parse(content);
      console.log(`✅ [FILE] Successfully loaded config from file`);
      return config;
    }
    
    console.log(`⚠️  [FILE] Config file not found`);
    return null;
  } catch (error) {
    console.error(`❌ [FILE] Failed to load:`, error.message);
    return null;
  }
}

// 2. Simulate loadConfigFromDatabase (Priority 3 in bot)
async function loadConfigFromDatabase(groupId) {
  try {
    console.log(`🔍 [DB] Attempting to load from database...`);
    
    const ossDoorwayURI = process.env.URI;
    const ossDoorwayDBName = process.env.DB_NAME;
    
    if (!ossDoorwayURI || !ossDoorwayDBName) {
      console.warn(`⚠️  [DB] Credentials not found`);
      return null;
    }
    
    const connection = await mongoose.createConnection(ossDoorwayURI, {
      dbName: ossDoorwayDBName,
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }).asPromise();
    
    const questConfigSchema = new mongoose.Schema({
      groupId: String,
      configId: String,
      classId: String,
      configData: Object,
      config: mongoose.Schema.Types.Mixed,
    }, { collection: 'questconfigs' });
    
    const QuestConfig = connection.model('QuestConfig', questConfigSchema);
    
    const config = await QuestConfig.findOne({
      $or: [
        { groupId: groupId },
        { configId: groupId },
        { classId: groupId }
      ]
    });
    
    await connection.close();
    
    if (config) {
      console.log(`✅ [DB] Successfully loaded from database`);
      let configData = config.configData || config.config;
      if (typeof configData === 'string') {
        configData = JSON.parse(configData);
      }
      return configData;
    }
    
    console.log(`⚠️  [DB] No config found`);
    return null;
  } catch (error) {
    console.error(`❌ [DB] Failed:`, error.message);
    return null;
  }
}

// 3. Simulate convertQuestSequenceToLegacy
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

async function simulateExactBotLoad() {
  console.log('='.repeat(80));
  console.log('🤖 SIMULATING EXACT BOT CONFIG LOADING PROCESS');
  console.log('='.repeat(80));
  console.log('');
  
  try {
    let questConfig = null;
    
    // STEP 1: Check file (Priority 2 - cache is Priority 1 but we're testing post-cache)
    console.log('STEP 1: Load from FILE SYSTEM (what bot tries first after cache miss)');
    console.log('-'.repeat(80));
    
    const fileConfig = loadConfigFromFile(CLASS_ID);
    
    if (fileConfig) {
      console.log('');
      console.log('📋 File config structure:');
      console.log('   Keys:', Object.keys(fileConfig));
      console.log('   Has questSequence:', Array.isArray(fileConfig?.questSequence));
      
      if (Array.isArray(fileConfig?.questSequence)) {
        console.log('   ✅ questSequence format with', fileConfig.questSequence.length, 'quest(s)');
        if (fileConfig.questSequence[0]?.tasks?.T1) {
          console.log('   ✅ Q1.T1 type:', fileConfig.questSequence[0].tasks.T1.type);
        }
        questConfig = fileConfig;
      } else {
        const questKeys = Object.keys(fileConfig).filter(k => k !== 'map_repo_link' && k !== 'readme');
        console.log('   ⚠️  Legacy format with quest keys:', questKeys.slice(0, 10).join(', '));
        if (fileConfig.Q1?.T1) {
          console.log('   ⚠️  Q1.T1 type:', fileConfig.Q1.T1.type);
        }
        questConfig = fileConfig;
      }
    }
    
    console.log('');
    
    // STEP 2: If no file, check database
    if (!questConfig) {
      console.log('STEP 2: Load from DATABASE (fallback if no file)');
      console.log('-'.repeat(80));
      
      const dbConfig = await loadConfigFromDatabase(CLASS_ID);
      
      if (dbConfig) {
        console.log('');
        console.log('📋 Database config structure:');
        console.log('   Keys:', Object.keys(dbConfig));
        console.log('   Has questSequence:', Array.isArray(dbConfig?.questSequence));
        questConfig = dbConfig;
      }
      
      console.log('');
    }
    
    if (!questConfig) {
      console.error('❌ FAILED: No config found in file or database!');
      return;
    }
    
    // STEP 3: Convert if needed
    console.log('STEP 3: Convert questSequence to legacy format (if needed)');
    console.log('-'.repeat(80));
    
    if (Array.isArray(questConfig?.questSequence)) {
      console.log('🔧 Converting questSequence to legacy format...');
      questConfig = convertQuestSequenceToLegacy(questConfig);
      console.log('✅ Conversion complete');
    } else {
      console.log('⚠️  Already in legacy format, no conversion needed');
    }
    
    console.log('');
    
    // STEP 4: Analyze final config
    console.log('STEP 4: Analyze final config that will be cached');
    console.log('-'.repeat(80));
    
    const questKeys = Object.keys(questConfig).filter(k => k !== 'map_repo_link' && k !== 'readme');
    console.log('📋 Final config quest keys:', questKeys);
    
    if (questConfig.Q1) {
      const q1Tasks = Object.keys(questConfig.Q1).filter(k => k !== 'metadata');
      console.log(`✅ Q1 found with ${q1Tasks.length} tasks`);
      console.log('');
      
      console.log('🎯 Q1 Task Analysis:');
      q1Tasks.forEach(taskId => {
        const task = questConfig.Q1[taskId];
        console.log(`   ${taskId}: type="${task.type}"`);
      });
      
      console.log('');
      
      const t1 = questConfig.Q1.T1;
      console.log('🔍 Q1.T1 Detailed Check:');
      console.log(`   Type: ${t1.type}`);
      console.log(`   Description: ${t1.desc}`);
      
      if (t1.type === 'get-issue-count') {
        console.log('');
        console.log('✅✅✅ SUCCESS! T1 will route to handleIssueCount');
        console.log('✅✅✅ Config is CORRECT and will work when cached!');
      } else {
        console.log('');
        console.log(`❌❌❌ ERROR! T1 type is "${t1.type}" - will route to wrong handler`);
        console.log(`❌❌❌ This is the WRONG config!`);
      }
    } else {
      console.error('❌ Q1 not found!');
    }
    
    console.log('');
    console.log('='.repeat(80));
    console.log('🎯 CONCLUSION');
    console.log('='.repeat(80));
    console.log('This is EXACTLY what the bot will load and cache after cache expires.');
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.error(error.stack);
  }
}

simulateExactBotLoad();

