const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// MongoDB connection details
const OSS_DOORWAY_URI = process.env.OSS_DOORWAY_DB_URI || 'mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/?retryWrites=true&w=majority&appName=gamification';
const OSS_DOORWAY_DB_NAME = process.env.OSS_DOORWAY_DB_NAME || 'test';

async function pullRealClassConfig() {
  const client = new MongoClient(OSS_DOORWAY_URI);
  
  try {
    console.log('🔍 [pull-real-class] Connecting to database...');
    await client.connect();
    console.log('✅ [pull-real-class] Connected to MongoDB');
    
    const db = client.db(OSS_DOORWAY_DB_NAME);
    
    // Find the quest configuration for the real class
    const questConfig = await db.collection('questconfigs').findOne({
      configId: '68a770b8140b9c0174c13ce7'
    });
    
    if (!questConfig) {
      console.log('❌ [pull-real-class] Real class quest config not found in database');
      return;
    }
    
    console.log('✅ [pull-real-class] Found real class quest config:', questConfig.configId);
    console.log('📊 [pull-real-class] Config keys:', Object.keys(questConfig.config));
    
    // Save to local file
    const outputPath = path.join(__dirname, '..', 'quest_config_68a770b8140b9c0174c13ce7.json');
    fs.writeFileSync(outputPath, JSON.stringify(questConfig, null, 2));
    
    console.log(`💾 [pull-real-class] Saved config to: ${outputPath}`);
    
    // Show some sample validation parameters
    const quests = Object.keys(questConfig.config).filter(key => key !== 'map_repo_link');
    console.log('🎯 [pull-real-class] Quests found:', quests);
    
    for (const questId of quests) {
      const quest = questConfig.config[questId];
      if (quest && typeof quest === 'object') {
        const tasks = Object.keys(quest).filter(key => key.startsWith('T'));
        console.log(`📋 [pull-real-class] Quest ${questId} has ${tasks.length} tasks`);
        
        // Show first few tasks with llmTextValidation
        let shownCount = 0;
        tasks.forEach(taskId => {
          const task = quest[taskId];
          if (task && task.llmTextValidation && shownCount < 3) {
            console.log(`🔍 [pull-real-class] Task ${taskId} validation:`, task.llmTextValidation.question.substring(0, 100) + '...');
            console.log(`🔍 [pull-real-class] Task ${taskId} parameters:`, task.llmTextValidation.validationParameters);
            shownCount++;
          }
        });
      }
    }
    
  } catch (error) {
    console.error('❌ [pull-real-class] Error:', error);
  } finally {
    await client.close();
    console.log('🔌 [pull-real-class] Database connection closed');
  }
}

pullRealClassConfig();
