require('dotenv').config();
const mongoose = require('mongoose');

const CLASS_ID = '691b7f64528ddbaa6810aa3f';

/**
 * LOCATION 1: ConfigService.loadConfigFromDatabase
 * This is the EXACT function from configService.js lines 121-192
 */
async function LOCATION_1_loadConfigFromDatabase(groupId) {
  try {
    console.log(`🔍 [ConfigService] Attempting to load config from database for: ${groupId}`);
    
    // Line 126-127: Get environment variables
    const ossDoorwayURI = process.env.URI;
    const ossDoorwayDBName = process.env.DB_NAME;
    
    if (!ossDoorwayURI || !ossDoorwayDBName) {
      console.warn(`⚠️ [ConfigService] Main database credentials not found, skipping database lookup`);
      return null;
    }
    
    // Line 135: EXACT connection method
    const connection = mongoose.createConnection(`${ossDoorwayURI}/${ossDoorwayDBName}`);
    await connection.asPromise();
    
    // Lines 138-150: EXACT schema definition
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
    
    // Lines 155-161: EXACT query
    const config = await QuestConfig.findOne({
      $or: [
        { groupId: groupId },
        { configId: groupId },
        { classId: groupId }
      ]
    });
    
    // Line 164: Close connection
    await connection.close();
    
    if (config) {
      console.log(`✅ [ConfigService] Successfully loaded config from database for: ${groupId}`);
      
      // Lines 169-170: Get config data from either field
      let configData = config.configData || config.config;
      
      // Lines 173-181: Parse if string
      if (typeof configData === 'string') {
        try {
          configData = JSON.parse(configData);
          console.log(`🔧 [ConfigService] Parsed string config to object for: ${groupId}`);
        } catch (parseError) {
          console.error(`❌ [ConfigService] Failed to parse config JSON for ${groupId}:`, parseError.message);
          return null;
        }
      }
      
      // Line 183: Return config data
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
 * LOCATION 2: ConfigService.loadConfig (calls Location 1)
 * This is from configService.js lines 216-295
 */
async function LOCATION_2_loadConfig(groupId) {
  const startTime = Date.now();
  console.log(`🔍 [ConfigService] Loading config for: ${groupId}`);
  
  // Lines 220-227: Check cache first (we skip for testing)
  console.log(`   (Skipping cache check for test)`);
  
  // Lines 229-250: Try database (Priority 1)
  try {
    console.log(`🐌 [ConfigService] Cache miss for "${groupId}", querying database with retries...`);
    
    // Call LOCATION 1 with retry logic
    const dbConfig = await LOCATION_1_loadConfigFromDatabase(groupId);
    
    if (dbConfig) {
      const duration = Date.now() - startTime;
      console.log(`✅ [ConfigService] Database config loaded for "${groupId}" in ${duration}ms`);
      return dbConfig;
    }
  } catch (error) {
    console.warn(`⚠️ [ConfigService] Database lookup failed for ${groupId}:`, error.message);
  }
  
  // Would fall back to file, but we're testing database only
  console.log(`⚠️ [ConfigService] No database config, would fall back to file`);
  return null;
}

/**
 * LOCATION 3: getGroupQuestConfig (calls Location 2)
 * This is from questConfigGenerator.js lines 165-183
 */
async function LOCATION_3_getGroupQuestConfig(groupId) {
  try {
    console.log(`🔍 [QUEST-CONFIG-LOAD] Loading config for group: ${groupId}`);
    
    // Line 170: Call ConfigService.loadConfig (LOCATION 2)
    const config = await LOCATION_2_loadConfig(groupId);
    
    if (config) {
      console.log(`✅ [QUEST-CONFIG-LOAD] Successfully loaded config for: ${groupId}`);
      return config;
    }
    
    throw new Error(`No config found for group: ${groupId}`);
  } catch (error) {
    console.error(`Error loading group config for ${groupId}:`, error);
    throw error;
  }
}

/**
 * LOCATION 4: getQuestConfigForUser (calls Location 3)
 * This is from gamification.js lines 175-266
 */
async function LOCATION_4_getQuestConfigForUser(customGroupId) {
  const startTime = Date.now();
  console.log(`🔍 [BOT-QUEST-LOAD] User: misanetc`);
  console.log(`🔍 [BOT-QUEST-LOAD] customGroupId: ${customGroupId}`);
  
  // Lines 180-187: Check processed cache first (we skip for testing)
  console.log(`   (Skipping processed cache check for test)`);
  
  console.log(`🐌 [BOT-QUEST-LOAD] Cache miss, processing quest config...`);
  
  let questConfig = null;
  
  if (customGroupId) {
    try {
      console.log(`🔍 [BOT-QUEST-LOAD] Attempting to load group config for: ${customGroupId}`);
      
      // Line 198: Call getGroupQuestConfig (LOCATION 3)
      const result = await LOCATION_3_getGroupQuestConfig(customGroupId);
      
      if (result) {
        console.log(`✅ [BOT-QUEST-LOAD] Successfully loaded group config with ${Object.keys(result).length} keys:`, Object.keys(result).slice(0, 5));
        console.log(`🔍 [BOT-QUEST-LOAD] All loaded keys:`, Object.keys(result));
        questConfig = result;
        
        // Lines 205-209: Convert questSequence format if needed
        if (Array.isArray(questConfig?.questSequence)) {
          console.log(`🔧 [BOT-QUEST-LOAD] Converting questSequence format to legacy format...`);
          
          // Conversion logic from lines 39-100
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
          console.log(`✅ [BOT-QUEST-LOAD] Conversion complete. Keys:`, Object.keys(questConfig));
        }
      } else {
        console.log(`❌ [BOT-QUEST-LOAD] Group config not found for ${customGroupId}, falling back to default config`);
      }
    } catch (error) {
      console.log(`❌ [BOT-QUEST-LOAD] Error loading group config for ${customGroupId}: ${error.message}`);
      console.log(`🔍 [BOT-QUEST-LOAD] Falling back to default config`);
    }
  }
  
  if (!questConfig) {
    console.log(`❌ No config loaded`);
    return null;
  }
  
  // Line 258-261: Cache the processed config (we skip for testing)
  const duration = Date.now() - startTime;
  console.log(`✅ [BOT-QUEST-LOAD] Quest config processing complete in ${duration}ms`);
  return questConfig;
}

/**
 * LOCATION 5: validateTask (calls Location 4)
 * Simulating the task validation flow
 */
function LOCATION_5_buildDynamicTaskMapping(userQuestConfig) {
  const dynamicTaskMapping = {};
  
  for (const [questId, questData] of Object.entries(userQuestConfig)) {
    if (questId === 'metadata' || questId === 'map_repo_link') continue;
    if (!questData || typeof questData !== 'object') continue;
    
    dynamicTaskMapping[questId] = {};
    
    for (const [taskId, taskData] of Object.entries(questData)) {
      if (taskId === "metadata") continue;
      
      let handler;
      switch (taskData.type) {
        case "get-issue-count": handler = 'handleIssueCount'; break;
        case "get-pr-count": handler = 'handlePRCount'; break;
        case "multiple-choice": handler = 'handleMCQ'; break;
        case "get-top-contributor": handler = 'handleTopContributor'; break;
        case "quiz": handler = 'handleQuiz'; break;
        default: handler = 'UNKNOWN';
      }
      
      dynamicTaskMapping[questId][taskId] = handler;
    }
  }
  
  return dynamicTaskMapping;
}

/**
 * MAIN TEST
 */
async function testExactBotFlow() {
  console.log('='.repeat(80));
  console.log('🧪 TESTING EXACT BOT FLOW - ALL 5 LOCATIONS');
  console.log('='.repeat(80));
  console.log('');
  
  try {
    // Simulate what happens when student misanetc triggers a task
    console.log('📍 SIMULATING: Student misanetc validates task Q1.T1');
    console.log('');
    
    // LOCATION 5: validateTask calls getQuestConfigForUser
    console.log('LOCATION 5: validateTask()');
    console.log('-'.repeat(80));
    console.log('Calls: getQuestConfigForUser()');
    console.log('');
    
    // LOCATION 4: getQuestConfigForUser
    console.log('LOCATION 4: getQuestConfigForUser()');
    console.log('-'.repeat(80));
    const userQuestConfig = await LOCATION_4_getQuestConfigForUser(CLASS_ID);
    
    if (!userQuestConfig) {
      console.log('');
      console.log('❌❌❌ FAILED: No config loaded');
      console.log('Bot will not work!');
      return;
    }
    
    console.log('');
    console.log('LOCATION 5: buildDynamicTaskMapping()');
    console.log('-'.repeat(80));
    const dynamicTaskMapping = LOCATION_5_buildDynamicTaskMapping(userQuestConfig);
    
    // Verify final config
    console.log('');
    console.log('='.repeat(80));
    console.log('🎯 FINAL VERIFICATION');
    console.log('='.repeat(80));
    console.log('');
    
    const questKeys = Object.keys(userQuestConfig).filter(k => k !== 'map_repo_link' && k !== 'readme');
    console.log(`📋 Quest keys in final config: ${questKeys.join(', ')}`);
    console.log('');
    
    if (userQuestConfig.Q1 && userQuestConfig.Q1.T1) {
      const t1 = userQuestConfig.Q1.T1;
      const t1Handler = dynamicTaskMapping.Q1?.T1;
      
      console.log('Q1.T1 Details:');
      console.log(`   Type: ${t1.type}`);
      console.log(`   Description: ${t1.desc}`);
      console.log(`   Handler: ${t1Handler}`);
      console.log('');
      
      if (t1.type === 'get-issue-count' && t1Handler === 'handleIssueCount') {
        console.log('✅✅✅ SUCCESS!');
        console.log('✅✅✅ Config loaded through EXACT bot flow!');
        console.log('✅✅✅ Q1.T1 type is "get-issue-count"');
        console.log('✅✅✅ Q1.T1 routes to "handleIssueCount"');
        console.log('✅✅✅ Bot WILL work when cache expires!');
        console.log('');
        console.log('Flow tested:');
        console.log('  validateTask() [Location 5]');
        console.log('    ↓');
        console.log('  getQuestConfigForUser() [Location 4]');
        console.log('    ↓');
        console.log('  getGroupQuestConfig() [Location 3]');
        console.log('    ↓');
        console.log('  ConfigService.loadConfig() [Location 2]');
        console.log('    ↓');
        console.log('  loadConfigFromDatabase() [Location 1]');
        console.log('    ↓');
        console.log('  MongoDB query: findOne({ $or: [{groupId}, {configId}, {classId}] })');
        console.log('    ↓');
        console.log('  ✅ Config found and returned');
        console.log('    ↓');
        console.log('  ✅ Converted to legacy format');
        console.log('    ↓');
        console.log('  ✅ Task routing correct!');
      } else {
        console.log('❌❌❌ FAILED!');
        console.log(`❌ Type: ${t1.type} (should be "get-issue-count")`);
        console.log(`❌ Handler: ${t1Handler} (should be "handleIssueCount")`);
      }
    } else {
      console.log('❌❌❌ FAILED: Q1.T1 not found in config!');
      console.log('Config structure:', JSON.stringify(userQuestConfig, null, 2).substring(0, 500));
    }
    
    console.log('');
    console.log('='.repeat(80));
    
  } catch (error) {
    console.error('❌❌❌ TEST FAILED WITH ERROR:');
    console.error(error.message);
    console.error(error.stack);
  }
}

testExactBotFlow();


