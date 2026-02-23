require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const CLASS_ID = '691b7f64528ddbaa6810aa3f';

/**
 * EXACT BOT FLOW - Step by step
 */

// Step 1: ConfigService.loadConfigFromDatabase (Priority 1)
async function step1_loadConfigFromDatabase(groupId) {
  console.log('STEP 1: ConfigService.loadConfigFromDatabase()');
  console.log('-'.repeat(80));
  
  try {
    const ossDoorwayURI = process.env.URI;
    const ossDoorwayDBName = process.env.DB_NAME;
    
    if (!ossDoorwayURI || !ossDoorwayDBName) {
      console.log('❌ No database credentials - will skip to file');
      return null;
    }
    
    console.log(`📡 Connecting: ${ossDoorwayURI}/${ossDoorwayDBName}`);
    const connectionString = `${ossDoorwayURI}/${ossDoorwayDBName}`;
    
    const connection = await mongoose.createConnection(connectionString, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }).asPromise();
    
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
    
    console.log(`🔍 Query: findOne({ $or: [{groupId: "${groupId}"}, {configId: "${groupId}"}, {classId: "${groupId}"}] })`);
    
    const config = await QuestConfig.findOne({
      $or: [
        { groupId: groupId },
        { configId: groupId },
        { classId: groupId }
      ]
    });
    
    await connection.close();
    
    if (config) {
      console.log(`✅ Config found in database!`);
      console.log(`   _id: ${config._id}`);
      
      let configData = config.configData || config.config;
      
      if (typeof configData === 'string') {
        configData = JSON.parse(configData);
      }
      
      console.log(`   Structure: ${Array.isArray(configData?.questSequence) ? 'questSequence format' : 'flat format'}`);
      if (configData?.questSequence?.[0]?.tasks?.T1) {
        console.log(`   Q1.T1 type: ${configData.questSequence[0].tasks.T1.type}`);
      }
      
      return configData;
    }
    
    console.log(`❌ Config NOT found in database`);
    return null;
  } catch (error) {
    console.error(`❌ Database error: ${error.message}`);
    return null;
  }
}

// Step 2: ConfigService.loadConfigFromFile (Priority 2)
function step2_loadConfigFromFile(groupId) {
  console.log('');
  console.log('STEP 2: ConfigService.loadConfigFromFile()');
  console.log('-'.repeat(80));
  
  try {
    const configPath = path.join(process.cwd(), 'src/config/generated', `quest_config_${groupId}.json`);
    console.log(`📁 Checking file: ${configPath}`);
    
    if (fs.existsSync(configPath)) {
      const content = fs.readFileSync(configPath, 'utf8');
      const config = JSON.parse(content);
      
      console.log(`✅ Config found in file!`);
      console.log(`   Structure: ${Array.isArray(config?.questSequence) ? 'questSequence format' : 'flat format'}`);
      if (config?.questSequence?.[0]?.tasks?.T1) {
        console.log(`   Q1.T1 type: ${config.questSequence[0].tasks.T1.type}`);
      } else if (config?.Q1?.T1) {
        console.log(`   Q1.T1 type: ${config.Q1.T1.type}`);
      }
      
      return config;
    }
    
    console.log(`❌ Config file NOT found`);
    return null;
  } catch (error) {
    console.error(`❌ File error: ${error.message}`);
    return null;
  }
}

// Step 3: getGroupQuestConfig (calls ConfigService.loadConfig)
async function step3_getGroupQuestConfig(groupId) {
  console.log('');
  console.log('STEP 3: getGroupQuestConfig()');
  console.log('-'.repeat(80));
  console.log('This calls ConfigService.loadConfig() which:');
  console.log('  1. Checks cache (we skip this in test)');
  console.log('  2. Tries database (Priority 1)');
  console.log('  3. Falls back to file (Priority 2)');
  console.log('');
  
  // Try database first
  let config = await step1_loadConfigFromDatabase(groupId);
  
  // If no database, try file
  if (!config) {
    config = step2_loadConfigFromFile(groupId);
  }
  
  return config;
}

// Step 4: getQuestConfigForUser (converts if needed)
async function step4_getQuestConfigForUser(groupId) {
  console.log('');
  console.log('STEP 4: getQuestConfigForUser()');
  console.log('-'.repeat(80));
  
  let questConfig = await step3_getGroupQuestConfig(groupId);
  
  if (!questConfig) {
    console.log('❌ No config loaded - will use default');
    return null;
  }
  
  console.log('✅ Config loaded');
  
  // Convert if questSequence format
  if (Array.isArray(questConfig?.questSequence)) {
    console.log('');
    console.log('🔧 Converting questSequence to legacy format...');
    
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
    
    questConfig = legacyConfig;
    console.log('✅ Conversion complete');
  }
  
  return questConfig;
}

// Step 5: Build dynamic task mapping
function step5_buildDynamicTaskMapping(questConfig) {
  console.log('');
  console.log('STEP 5: buildDynamicTaskMapping()');
  console.log('-'.repeat(80));
  
  const taskMapping = {};
  
  for (const [questId, questData] of Object.entries(questConfig)) {
    if (questId === 'metadata' || questId === 'map_repo_link') continue;
    if (!questData || typeof questData !== 'object') continue;
    
    taskMapping[questId] = {};
    
    for (const [taskId, taskData] of Object.entries(questData)) {
      if (taskId === 'metadata') continue;
      
      let handler;
      switch (taskData.type) {
        case 'get-issue-count': handler = 'handleIssueCount'; break;
        case 'get-pr-count': handler = 'handlePRCount'; break;
        case 'multiple-choice': handler = 'handleMCQ'; break;
        case 'get-top-contributor': handler = 'handleTopContributor'; break;
        case 'quiz': handler = 'handleQuiz'; break;
        default: handler = 'UNKNOWN';
      }
      
      taskMapping[questId][taskId] = { type: taskData.type, handler };
    }
  }
  
  return taskMapping;
}

// Main flow
async function main() {
  console.log('='.repeat(80));
  console.log('🤖 TRACING COMPLETE BOT FLOW');
  console.log('='.repeat(80));
  console.log('');
  console.log('Simulating bot loading config for class: 691b7f64528ddbaa6810aa3f');
  console.log('(Ignoring cache - testing fresh load)');
  console.log('');
  
  const finalConfig = await step4_getQuestConfigForUser(CLASS_ID);
  
  if (!finalConfig) {
    console.log('');
    console.log('❌❌❌ FAILED: Bot could not load config!');
    return;
  }
  
  console.log('');
  console.log('STEP 6: Analyze final config');
  console.log('-'.repeat(80));
  
  const questKeys = Object.keys(finalConfig).filter(k => k !== 'map_repo_link' && k !== 'readme');
  console.log(`📋 Final config quest keys: ${questKeys.join(', ')}`);
  
  if (finalConfig.Q1 && finalConfig.Q1.T1) {
    console.log('');
    console.log('✅ Q1.T1 found');
    console.log(`   Type: ${finalConfig.Q1.T1.type}`);
    console.log(`   Description: ${finalConfig.Q1.T1.desc}`);
    
    const taskMapping = step5_buildDynamicTaskMapping(finalConfig);
    
    if (taskMapping.Q1 && taskMapping.Q1.T1) {
      console.log(`   Handler: ${taskMapping.Q1.T1.handler}`);
      
      if (finalConfig.Q1.T1.type === 'get-issue-count' && taskMapping.Q1.T1.handler === 'handleIssueCount') {
        console.log('');
        console.log('✅✅✅ SUCCESS!');
        console.log('✅✅✅ Config is correct!');
        console.log('✅✅✅ T1 will route to handleIssueCount!');
        console.log('✅✅✅ Bot WILL work when cache expires!');
      } else {
        console.log('');
        console.log('❌❌❌ ERROR!');
        console.log(`❌❌❌ Type: ${finalConfig.Q1.T1.type}`);
        console.log(`❌❌❌ Handler: ${taskMapping.Q1.T1.handler}`);
      }
    }
  } else {
    console.log('');
    console.log('❌❌❌ ERROR: Q1.T1 not found in final config!');
  }
  
  console.log('');
  console.log('='.repeat(80));
}

main().catch(console.error);


