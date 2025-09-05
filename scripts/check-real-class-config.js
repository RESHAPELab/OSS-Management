const { MongoClient } = require('mongodb');

// MongoDB connection details
const OSS_DOORWAY_URI = process.env.OSS_DOORWAY_DB_URI || 'mongodb+srv://cna93:gamification@gamification.nwes9ze.mongodb.net/?retryWrites=true&w=majority&appName=gamification';
const OSS_DOORWAY_DB_NAME = process.env.OSS_DOORWAY_DB_NAME || 'test';

async function checkRealClassConfig() {
  const client = new MongoClient(OSS_DOORWAY_URI);
  
  try {
    console.log('🔍 [check-real-class] Connecting to database...');
    await client.connect();
    console.log('✅ [check-real-class] Connected to MongoDB');
    
    const db = client.db(OSS_DOORWAY_DB_NAME);
    
    // Find the quest configuration for the real class
    const questConfig = await db.collection('questconfigs').findOne({
      configId: '68a770b8140b9c0174c13ce7'
    });
    
    if (!questConfig) {
      console.log('❌ [check-real-class] Real class quest config not found in database');
      return;
    }
    
    console.log('✅ [check-real-class] Found real class quest config:', questConfig.configId);
    console.log('📊 [check-real-class] Config keys:', Object.keys(questConfig.config));
    
    // Check if it has image tasks
    const quests = Object.keys(questConfig.config).filter(key => key !== 'map_repo_link');
    console.log('🎯 [check-real-class] Quests found:', quests);
    
    for (const questId of quests) {
      const quest = questConfig.config[questId];
      if (quest && typeof quest === 'object') {
        const tasks = Object.keys(quest).filter(key => key.startsWith('T'));
        console.log(`📋 [check-real-class] Quest ${questId} has tasks:`, tasks);
        
        // Check for image tasks
        tasks.forEach(taskId => {
          const task = quest[taskId];
          if (task && task.llmTextValidation) {
            console.log(`🔍 [check-real-class] Task ${taskId} has llmTextValidation:`, task.llmTextValidation.question);
          }
        });
      }
    }
    
  } catch (error) {
    console.error('❌ [check-real-class] Error:', error);
  } finally {
    await client.close();
    console.log('🔌 [check-real-class] Database connection closed');
  }
}

checkRealClassConfig();
