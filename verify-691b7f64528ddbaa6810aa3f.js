require('dotenv').config();
const mongoose = require('mongoose');

const CLASS_ID = '691b7f64528ddbaa6810aa3f';

function convertQuestSequenceToLegacy(questConfig) {
  console.log(`🔧 [CONVERT] Starting questSequence to legacy conversion...`);
  const legacyConfig = { map_repo_link: questConfig.map_repo_link };

  questConfig.questSequence.forEach((quest) => {
    const questId = quest.questId;
    const processedTasks = {};

    Object.entries(quest.tasks || {}).forEach(([taskId, taskData]) => {
      const processedTask = { ...taskData };

      if (processedTask.type === 'quiz' && Array.isArray(processedTask.questions) && processedTask.questions.length > 0) {
        console.log(`🧠 [CONVERT] Processing quiz task ${questId}.${taskId}`);
        let quizContent = processedTask.accept ? processedTask.accept + '\n\n' : `🧠 Quest Quiz\n\n`;
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

    if (quest.metadata) {
      legacyConfig[questId] = { ...processedTasks, metadata: quest.metadata };
    } else {
      legacyConfig[questId] = processedTasks;
    }
  });

  console.log(`✅ [CONVERT] Conversion complete. Legacy config keys:`, Object.keys(legacyConfig));
  return legacyConfig;
}

async function loadConfigFromDatabase(groupId) {
  try {
    console.log(`🔍 [ConfigService] Loading config from database for: ${groupId}`);
    
    const ossDoorwayURI = process.env.URI;
    const ossDoorwayDBName = process.env.DB_NAME || 'gamification-management';
    
    if (!ossDoorwayURI) {
      console.warn(`⚠️ [ConfigService] Database credentials not found`);
      return null;
    }
    
    console.log(`📡 Connecting to: ${ossDoorwayDBName}...`);
    
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
      createdAt: Date,
      updatedAt: Date,
      source: String,
      createdBy: String,
      originalFilePath: String,
      version: Number
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
      console.log(`✅ [ConfigService] Successfully loaded config from database`);
      console.log(`   Updated at: ${config.updatedAt}`);
      console.log(`   Created by: ${config.createdBy || config.source}`);
      
      let configData = config.configData || config.config;
      
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

function buildDynamicTaskMapping(userQuestConfig) {
  const dynamicTaskMapping = {};
  
  for (const [questId, questData] of Object.entries(userQuestConfig)) {
    if (questId === 'metadata' || questId === 'map_repo_link') continue;
    if (!questData || typeof questData !== 'object') continue;
    
    dynamicTaskMapping[questId] = {};
    
    for (const [taskId, taskData] of Object.entries(questData)) {
      if (taskId === "metadata") continue;
      
      let handlerName;
      switch (taskData.type) {
        case "multiple-choice":
        case "mcq":
          handlerName = 'handleMCQ';
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
        case "quiz":
          handlerName = 'handleQuiz';
          break;
        default:
          handlerName = 'UNKNOWN';
      }
      
      dynamicTaskMapping[questId][taskId] = handlerName;
    }
  }
  
  return dynamicTaskMapping;
}

async function verifyConfig() {
  console.log('='.repeat(80));
  console.log('🧪 VERIFYING CLASS 691b7f64528ddbaa6810aa3f');
  console.log('='.repeat(80));
  console.log('');
  
  try {
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
      
      const legacyConfig = convertQuestSequenceToLegacy(rawConfig);
      
      console.log('');
      const questKeys = Object.keys(legacyConfig).filter(k => k !== 'map_repo_link');
      console.log('📋 Converted config - Quest keys:', questKeys);
      console.log('');
      
      if (legacyConfig.Q1) {
        const q1Tasks = Object.keys(legacyConfig.Q1).filter(k => k !== 'metadata');
        console.log(`✅ Q1 found with ${q1Tasks.length} tasks: ${q1Tasks.join(', ')}`);
        console.log('');
        
        const taskMapping = buildDynamicTaskMapping(legacyConfig);
        
        console.log('✅ Q1 task handlers:');
        Object.entries(taskMapping.Q1).forEach(([taskId, handler]) => {
          const taskType = legacyConfig.Q1[taskId]?.type;
          console.log(`   ${taskId} (type: ${taskType}) → ${handler}`);
        });
        
        console.log('');
        const t1 = legacyConfig.Q1.T1;
        const t1Handler = taskMapping.Q1?.T1;
        
        console.log('🎯 Q1.T1 Verification:');
        console.log(`   Task type: ${t1.type}`);
        console.log(`   Handler: ${t1Handler}`);
        
        if (t1.type === 'get-issue-count' && t1Handler === 'handleIssueCount') {
          console.log('');
          console.log('✅✅✅ SUCCESS! Class 691b7f64528ddbaa6810aa3f is correctly configured!');
        } else {
          console.log('');
          console.log(`❌ ERROR! Incorrect routing`);
        }
        
      } else {
        console.error('❌ Q1 not found in legacy config');
      }
      
    } else {
      console.error('❌ Config does not have questSequence array');
    }
    
    console.log('');
    console.log('='.repeat(80));
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
  }
}

verifyConfig();

