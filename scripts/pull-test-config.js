const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// MongoDB connection details
const OSS_DOORWAY_URI = process.env.OSS_DOORWAY_DB_URI || 'mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/?retryWrites=true&w=majority&appName=gamification';
const OSS_DOORWAY_DB_NAME = process.env.OSS_DOORWAY_DB_NAME || 'test';

async function pullTestConfig() {
  const client = new MongoClient(OSS_DOORWAY_URI);
  
  try {
    console.log('🔍 [pull-test-config] Connecting to database...');
    await client.connect();
    console.log('✅ [pull-test-config] Connected to MongoDB');
    
    const db = client.db(OSS_DOORWAY_DB_NAME);
    
    // Find the quest configuration for the test student
    const questConfig = await db.collection('questconfigs').findOne({
      configId: '68accc656847fdb7c19b1f0a-test'
    });
    
    if (!questConfig) {
      console.log('❌ [pull-test-config] Quest config not found in database');
      return;
    }
    
    console.log('✅ [pull-test-config] Found quest config:', questConfig.configId);
    console.log('📊 [pull-test-config] Config keys:', Object.keys(questConfig.config));
    
    // Save to local file
    const outputPath = path.join(__dirname, '..', 'quest_config_68accc656847fdb7c19b1f0a-test.json');
    fs.writeFileSync(outputPath, JSON.stringify(questConfig, null, 2));
    
    console.log(`💾 [pull-test-config] Saved config to: ${outputPath}`);
    
    // Show some sample validation parameters
    const quests = Object.keys(questConfig.config).filter(key => key !== 'map_repo_link');
    console.log('🎯 [pull-test-config] Quests found:', quests);
    
    for (const questId of quests) {
      const quest = questConfig.config[questId];
      if (quest && typeof quest === 'object') {
        const tasks = Object.keys(quest).filter(key => key.startsWith('T'));
        console.log(`📋 [pull-test-config] Quest ${questId} has ${tasks.length} tasks`);
        
        // Show first few tasks with llmTextValidation
        let shownCount = 0;
        tasks.forEach(taskId => {
          const task = quest[taskId];
          if (task && task.llmTextValidation && shownCount < 3) {
            console.log(`🔍 [pull-test-config] Task ${taskId} validation:`, task.llmTextValidation.question.substring(0, 100) + '...');
            shownCount++;
          }
        });
      }
    }
    
  } catch (error) {
    console.error('❌ [pull-test-config] Error:', error);
  } finally {
    await client.close();
    console.log('🔌 [pull-test-config] Database connection closed');
  }
}

pullTestConfig();
