require('dotenv').config();
const mongoose = require('mongoose');

const CLASS_ID = '692735b4668a78a28bcf7c3e';

/**
 * Simulates the bot's convertQuestSequenceToLegacy function
 */
function convertQuestSequenceToLegacy(questConfig) {
  console.log(`🔧 [CONVERT] Starting questSequence to legacy conversion...`);
  const legacyConfig = { map_repo_link: questConfig.map_repo_link };

  questConfig.questSequence.forEach((quest) => {
    const questId = quest.questId;
    const processedTasks = {};

    Object.entries(quest.tasks || {}).forEach(([taskId, taskData]) => {
      const processedTask = { ...taskData };

      // If quiz, bake questions into accept
      if (processedTask.type === 'quiz' && Array.isArray(processedTask.questions) && processedTask.questions.length > 0) {
        console.log(`🧠 [CONVERT] Processing quiz task ${questId}.${taskId} with ${processedTask.questions.length} questions`);
        
        let quizContent = '';
        if (processedTask.accept) {
          quizContent = processedTask.accept + '\n\n';
        } else {
          quizContent = `🧠 Quest Quiz\nAnswer the following questions to test your knowledge.\n\n`;
        }

        processedTask.questions.forEach((q, idx) => {
          if (q?.question) {
            quizContent += `Question ${idx + 1}:\n${q.question}\n\n`;
            if (q.optionA) quizContent += `A) ${q.optionA}\n`;
            if (q.optionB) quizContent += `B) ${q.optionB}\n`;
            if (q.optionC) quizContent += `C) ${q.optionC}\n`;
            if (q.optionD) quizContent += `D) ${q.optionD}\n`;
            quizContent += `\n`;
          }
        });

        quizContent += `Important: please provide answers in the format [x,x,x,x,x]\nNote that there is only one attempt allowed!\n\nClick here to start`;
        processedTask.accept = quizContent;
      }

      processedTasks[taskId] = processedTask;
    });

    // Attach metadata if present
    if (quest.metadata) {
      legacyConfig[questId] = { ...processedTasks, metadata: quest.metadata };
    } else {
      legacyConfig[questId] = processedTasks;
    }
  });

  console.log(`✅ [CONVERT] Conversion complete. Legacy config keys:`, Object.keys(legacyConfig));
  return legacyConfig;
}

/**
 * Simulates the bot's loadConfigFromDatabase function
 */
async function loadConfigFromDatabase(groupId) {
  try {
    console.log(`🔍 [ConfigService] Attempting to load config from database for: ${groupId}`);
    
    // Use the main OSS-Doorway database connection
    const ossDoorwayURI = process.env.URI || process.env.OSS_DOORWAY_DB_URI;
    const ossDoorwayDBName = process.env.DB_NAME || process.env.OSS_DOORWAY_DB_NAME || 'test';
    
    if (!ossDoorwayURI) {
      console.warn(`⚠️ [ConfigService] Database credentials not found`);
      return null;
    }
    
    console.log(`📡 Connecting to: ${ossDoorwayDBName}...`);
    
    // Create connection to main OSS-Doorway database
    const connection = await mongoose.createConnection(ossDoorwayURI, {
      dbName: ossDoorwayDBName,
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }).asPromise();
    
    // Define QuestConfig schema - handle both schema types
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
    
    // Find the config using multiple field types
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
      console.log(`✅ [ConfigService] Successfully loaded config from database`);
      console.log(`   Updated at: ${config.updatedAt}`);
      console.log(`   Created by: ${config.createdBy || config.source}`);
      
      // Get the config data from either field
      let configData = config.configData || config.config;
      
      // If config field is a string (JSON), parse it
      if (typeof configData === 'string') {
        try {
          configData = JSON.parse(configData);
          console.log(`🔧 [ConfigService] Parsed string config to object`);
        } catch (parseError) {
          console.error(`❌ [ConfigService] Failed to parse config JSON:`, parseError.message);
          return null;
        }
      }
      
      return configData;
    }
    
    console.log(`⚠️ [ConfigService] No config found in database`);
    return null;
  } catch (error) {
    console.error(`❌ [ConfigService] Failed to load config from database:`, error.message);
    return null;
  }
}

/**
 * Simulates buildDynamicTaskMapping to verify task type routing
 */
function buildDynamicTaskMapping(userQuestConfig) {
  const dynamicTaskMapping = {};
  
  for (const [questId, questData] of Object.entries(userQuestConfig)) {
    if (questId === 'metadata' || questId === 'map_repo_link') continue;
    
    if (!questData || typeof questData !== 'object') {
      continue;
    }
    
    dynamicTaskMapping[questId] = {};
    
    for (const [taskId, taskData] of Object.entries(questData)) {
      if (taskId === "metadata") continue;
      
      let handlerName;
      switch (taskData.type) {
        case "multiple-choice":
        case "mcq":
          handlerName = 'handleMCQ';
          break;
        case "truefalse":
          handlerName = 'handleTrueFalse';
          break;
        case "custom":
          handlerName = 'handleCustom';
          break;
        case "get-issue-count":
          handlerName = 'handleIssueCount';
          break;
        case "get-pr-count":
          handlerName = 'handlePRCount';
          break;
        case "get-top-contributor":
          handlerName = 'handleTopContributor';
          break;
        case "llm-text-validation":
          handlerName = 'handleLLMTextValidation';
          break;
        case "collect-info":
          handlerName = 'handleCollectInfo';
          break;
        case "quiz":
          handlerName = 'handleQuiz';
          break;
        case "imageValidation":
          handlerName = 'handleImageValidation';
          break;
        default:
          handlerName = 'UNKNOWN';
      }
      
      dynamicTaskMapping[questId][taskId] = handlerName;
    }
  }
  
  return dynamicTaskMapping;
}

/**
 * Main test function
 */
async function testBotConfigLoad() {
  console.log('='.repeat(80));
  console.log('🧪 SIMULATING BOT CONFIG LOAD PROCESS');
  console.log('='.repeat(80));
  console.log('');
  
  try {
    // Step 1: Load from database (simulating what bot does)
    console.log('STEP 1: Load config from database (what bot will do after cache expires)');
    console.log('-'.repeat(80));
    const rawConfig = await loadConfigFromDatabase(CLASS_ID);
    
    if (!rawConfig) {
      console.error('❌ FAILED: Could not load config from database');
      return;
    }
    
    console.log('');
    console.log('📋 Raw config structure:');
    console.log('   Keys:', Object.keys(rawConfig));
    console.log('   Has questSequence:', Array.isArray(rawConfig?.questSequence));
    
    if (Array.isArray(rawConfig?.questSequence)) {
      console.log('   Quest count:', rawConfig.questSequence.length);
      console.log('');
      
      // Step 2: Convert questSequence to legacy format
      console.log('STEP 2: Convert questSequence to legacy format');
      console.log('-'.repeat(80));
      const legacyConfig = convertQuestSequenceToLegacy(rawConfig);
      
      console.log('');
      console.log('📋 Converted legacy config structure:');
      const questKeys = Object.keys(legacyConfig).filter(k => k !== 'map_repo_link');
      console.log('   Quest keys:', questKeys);
      console.log('');
      
      // Step 3: Analyze Q1 in detail
      console.log('STEP 3: Analyze Q1 configuration');
      console.log('-'.repeat(80));
      if (legacyConfig.Q1) {
        const q1Tasks = Object.keys(legacyConfig.Q1).filter(k => k !== 'metadata');
        console.log(`✅ Q1 found with ${q1Tasks.length} tasks: ${q1Tasks.join(', ')}`);
        console.log('');
        
        // Show each task's type
        q1Tasks.forEach(taskId => {
          const task = legacyConfig.Q1[taskId];
          console.log(`   ${taskId}:`);
          console.log(`      Type: ${task.type}`);
          console.log(`      Description: ${task.desc}`);
          if (task.ossRepository) {
            console.log(`      OSS Repo: ${task.ossRepository}`);
          }
          if (task.correctAnswer || task.answer) {
            console.log(`      Correct Answer: ${task.correctAnswer || task.answer}`);
          }
          console.log('');
        });
        
        // Step 4: Build dynamic task mapping
        console.log('STEP 4: Build dynamic task mapping (handler routing)');
        console.log('-'.repeat(80));
        const taskMapping = buildDynamicTaskMapping(legacyConfig);
        
        if (taskMapping.Q1) {
          console.log('✅ Q1 task handlers:');
          Object.entries(taskMapping.Q1).forEach(([taskId, handler]) => {
            const taskType = legacyConfig.Q1[taskId]?.type;
            console.log(`   ${taskId} (type: ${taskType}) → ${handler}`);
          });
        }
        
        // Step 5: Verify T1 specifically
        console.log('');
        console.log('STEP 5: Verify Q1.T1 (the problematic task)');
        console.log('-'.repeat(80));
        const t1 = legacyConfig.Q1.T1;
        const t1Handler = taskMapping.Q1?.T1;
        
        console.log(`   Task type: ${t1.type}`);
        console.log(`   Handler: ${t1Handler}`);
        console.log(`   OSS Repository: ${t1.ossRepository}`);
        console.log(`   Points: ${t1.points}`);
        console.log(`   XP: ${t1.xp}`);
        
        if (t1.type === 'get-issue-count' && t1Handler === 'handleIssueCount') {
          console.log('');
          console.log('✅✅✅ SUCCESS! Q1.T1 will correctly route to handleIssueCount');
          console.log('✅✅✅ The bot will work correctly when cache expires!');
        } else {
          console.log('');
          console.log(`❌❌❌ ERROR! Q1.T1 type is "${t1.type}" but handler is "${t1Handler}"`);
          console.log('❌❌❌ This indicates a problem with the configuration');
        }
        
      } else {
        console.error('❌ Q1 not found in legacy config');
      }
      
    } else {
      console.error('❌ Config does not have questSequence array');
      console.log('   Config structure:', JSON.stringify(rawConfig, null, 2).substring(0, 500));
    }
    
    console.log('');
    console.log('='.repeat(80));
    console.log('🎯 TEST COMPLETE');
    console.log('='.repeat(80));
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error(error.stack);
  }
}

testBotConfigLoad();

