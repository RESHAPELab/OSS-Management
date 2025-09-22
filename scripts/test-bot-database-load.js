// test-bot-database-load.js
// Test what the bot actually loads from the database for the purple config

const { MongoClient } = require('mongodb');

async function main() {
  const targetPurpleConfigId = '68a770b8140b9c0174c13ce7_purple_1756928031626';
  
  const ossDoorwayUri = process.env.OSS_DOORWAY_DB_URI || 'mongodb+srv://cna93:gamification@gamification.nwes9ze.mongodb.net/?retryWrites=true&w=majority&appName=gamification';
  const ossDoorwayDbName = process.env.OSS_DOORWAY_DB_NAME || 'test';

  let client;
  try {
    client = new MongoClient(ossDoorwayUri);
    await client.connect();
    const db = client.db(ossDoorwayDbName);

    const questConfigsCol = db.collection('questconfigs');

    console.log('🔍 TESTING BOT DATABASE LOAD');
    console.log('=' .repeat(50));

    // Simulate exactly what the bot does
    console.log('\n📋 Step 1: Direct database query (what bot does)...');
    const config = await questConfigsCol.findOne({
      $or: [
        { groupId: targetPurpleConfigId },
        { configId: targetPurpleConfigId },
        { classId: targetPurpleConfigId }
      ]
    });

    if (!config) {
      console.error('❌ Config not found in database');
      return;
    }

    console.log('✅ Config found in database:');
    console.log('  - _id:', config._id);
    console.log('  - classId:', config.classId);
    console.log('  - groupId:', config.groupId);
    console.log('  - configId:', config.configId);
    console.log('  - Created:', config.createdAt);

    // Check what fields exist
    console.log('\n📋 Step 2: Available fields...');
    const availableFields = Object.keys(config);
    console.log('  - Available fields:', availableFields);

    // Check config field specifically
    console.log('\n📋 Step 3: Config field analysis...');
    if (config.config) {
      console.log('  - config field exists:', typeof config.config);
      console.log('  - config type:', typeof config.config);
      
      if (typeof config.config === 'object') {
        const configKeys = Object.keys(config.config);
        const questKeys = configKeys.filter(k => k.startsWith('Q'));
        console.log('  - All config keys:', configKeys);
        console.log('  - Quest keys:', questKeys);
        
        // Show quest details
        for (const questKey of questKeys) {
          const quest = config.config[questKey];
          if (quest && typeof quest === 'object') {
            const taskKeys = Object.keys(quest).filter(k => k !== 'metadata');
            console.log(`  - ${questKey}: ${taskKeys.length} tasks [${taskKeys.join(', ')}]`);
          }
        }
      } else if (typeof config.config === 'string') {
        console.log('  - config is a string, length:', config.config.length);
        try {
          const parsedConfig = JSON.parse(config.config);
          const questKeys = Object.keys(parsedConfig).filter(k => k.startsWith('Q'));
          console.log('  - Parsed quest keys:', questKeys);
        } catch (e) {
          console.log('  - Failed to parse config string:', e.message);
        }
      }
    } else {
      console.log('  - No config field found');
    }

    // Check configData field (legacy)
    console.log('\n📋 Step 4: ConfigData field analysis (legacy)...');
    if (config.configData) {
      console.log('  - configData field exists:', typeof config.configData);
      if (typeof config.configData === 'object') {
        const configDataKeys = Object.keys(config.configData);
        const questKeys = configDataKeys.filter(k => k.startsWith('Q'));
        console.log('  - configData quest keys:', questKeys);
      }
    } else {
      console.log('  - No configData field found');
    }

    // Check questSequence field (new format)
    console.log('\n📋 Step 5: QuestSequence field analysis (new format)...');
    if (config.questSequence) {
      console.log('  - questSequence field exists:', Array.isArray(config.questSequence));
      if (Array.isArray(config.questSequence)) {
        console.log('  - questSequence length:', config.questSequence.length);
        config.questSequence.forEach((quest, index) => {
          console.log(`  - Quest ${index}: ${quest.questId || quest.metadata?.questId || 'Unknown'}`);
        });
      }
    } else {
      console.log('  - No questSequence field found');
    }

    // Test what the bot's ConfigService would return
    console.log('\n📋 Step 6: Simulating bot ConfigService logic...');
    
    let botConfig = null;
    
    // This is what ConfigService.loadConfigFromDatabase does
    if (config.config) {
      if (typeof config.config === 'string') {
        try {
          botConfig = JSON.parse(config.config);
        } catch (e) {
          console.log('  - Failed to parse config string');
        }
      } else if (typeof config.config === 'object') {
        botConfig = config.config;
      }
    } else if (config.configData) {
      botConfig = config.configData;
    }

    if (botConfig) {
      const botQuestKeys = Object.keys(botConfig).filter(k => k.startsWith('Q'));
      console.log('  - Bot would load quest keys:', botQuestKeys);
      console.log('  - Bot config keys:', Object.keys(botConfig));
    } else {
      console.log('  - Bot would return null (no config found)');
    }

    console.log('\n🎯 SUMMARY:');
    console.log('This is exactly what the bot sees when it queries the database.');
    console.log('If the bot is only loading Q1, the issue is in the processing/conversion logic.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (client) await client.close();
  }
}

main();
