require('dotenv').config();
const mongoose = require('mongoose');

const CLASS_ID = '691b7f64528ddbaa6810aa3f';

/**
 * EXACT replica of the deployed bot's database query logic
 * Based on the logs showing 5 retry attempts
 */

async function attemptDatabaseLoad(groupId, attemptNumber) {
  try {
    console.log(`🔍 [ConfigService] Attempting to load config from database for: ${groupId}`);
    
    const ossDoorwayURI = process.env.URI;
    const ossDoorwayDBName = process.env.DB_NAME;
    
    if (!ossDoorwayURI || !ossDoorwayDBName) {
      console.warn(`⚠️ [ConfigService] Main database credentials not found, skipping database lookup`);
      return null;
    }
    
    // EXACT connection as bot uses (line 135 in configService.js)
    const connection = mongoose.createConnection(`${ossDoorwayURI}/${ossDoorwayDBName}`);
    await connection.asPromise();
    
    // EXACT schema (lines 138-150)
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
    
    // EXACT query (lines 155-161)
    const config = await QuestConfig.findOne({
      $or: [
        { groupId: groupId },
        { configId: groupId },
        { classId: groupId }
      ]
    });
    
    await connection.close();
    
    if (config) {
      console.log(`✅ [ConfigService] Successfully loaded config from database for: ${groupId}`);
      
      let configData = config.configData || config.config;
      
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

async function testWithRetries() {
  console.log('='.repeat(80));
  console.log('🔁 TESTING WITH 5 RETRY ATTEMPTS (EXACT BOT LOGIC)');
  console.log('='.repeat(80));
  console.log('');
  
  console.log('🔍 [BOT-QUEST-LOAD] User: misanetc');
  console.log('🔍 [BOT-QUEST-LOAD] customGroupId: 691b7f64528ddbaa6810aa3f');
  console.log('');
  console.log('🐌 [BOT-QUEST-LOAD] Cache miss, processing quest config...');
  console.log('🔍 [BOT-QUEST-LOAD] Attempting to load group config for: 691b7f64528ddbaa6810aa3f');
  console.log('');
  console.log('🔍 [QUEST-CONFIG-LOAD] Loading config for group: 691b7f64528ddbaa6810aa3f');
  console.log('🔍 [ConfigService] Loading config for: 691b7f64528ddbaa6810aa3f');
  console.log('🐌 [ConfigService] Cache miss for "691b7f64528ddbaa6810aa3f", querying database with retries...');
  console.log('');
  
  const retries = 4; // 4 retries = 5 total attempts
  const delays = [250, 500, 1000, 2000]; // Backoff delays
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    console.log(`${'='.repeat(40)} ATTEMPT ${attempt + 1}/5 ${'='.repeat(40)}`);
    
    const result = await attemptDatabaseLoad(CLASS_ID, attempt + 1);
    
    if (result) {
      console.log('');
      console.log(`✅ CONFIG FOUND ON ATTEMPT ${attempt + 1}!`);
      console.log('');
      console.log('📋 Config structure:');
      console.log(`   Keys: ${Object.keys(result).join(', ')}`);
      console.log(`   Has questSequence: ${Array.isArray(result?.questSequence)}`);
      
      if (result.questSequence && result.questSequence[0]) {
        const q1 = result.questSequence[0];
        console.log(`   Q1.T1 type: ${q1.tasks?.T1?.type}`);
        
        if (q1.tasks?.T1?.type === 'get-issue-count') {
          console.log('');
          console.log('✅✅✅ SUCCESS!');
          console.log('✅✅✅ Bot found config in database!');
          console.log('✅✅✅ Q1.T1 has correct type!');
          console.log('✅✅✅ Will route to handleIssueCount!');
        } else {
          console.log('');
          console.log('❌ Wrong type:', q1.tasks?.T1?.type);
        }
      }
      
      console.log('');
      console.log('db-query-691b7f64528ddbaa6810aa3f: completed successfully');
      return;
    } else {
      console.log('');
      
      if (attempt < retries) {
        const delayMs = delays[attempt] + Math.floor(Math.random() * 100); // Add jitter
        console.log(`⏳ [Retry] database lookup for 691b7f64528ddbaa6810aa3f failed (attempt ${attempt + 1}/5): database lookup for 691b7f64528ddbaa6810aa3f returned no result. Retrying in ${delayMs}ms...`);
        console.log('');
        await new Promise(resolve => setTimeout(resolve, delayMs));
      } else {
        console.log(`❌ [Retry] database lookup for 691b7f64528ddbaa6810aa3f failed after 5 attempts: database lookup for 691b7f64528ddbaa6810aa3f returned no result`);
        console.log('');
        console.log('db-query-691b7f64528ddbaa6810aa3f: failed');
        console.log('');
        console.log('📁 [ConfigService] Trying file system for "691b7f64528ddbaa6810aa3f" with retries...');
        console.log('🔍 [ConfigService] Attempting to load config from file: /app/src/config/generated/quest_config_691b7f64528ddbaa6810aa3f.json');
        console.log('⚠️ [ConfigService] Config file not found for: 691b7f64528ddbaa6810aa3f');
        console.log('');
        console.log('❌❌❌ FAILED: Bot could not find config in database OR file!');
        console.log('❌❌❌ Bot will use default config!');
      }
    }
  }
  
  console.log('');
  console.log('='.repeat(80));
}

testWithRetries();


