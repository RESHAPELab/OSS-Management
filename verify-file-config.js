const fs = require('fs');
const path = require('path');

// Simulate the bot's conversion function
function convertQuestSequenceToLegacy(questConfig) {
  console.log(`🔧 [CONVERT] Starting questSequence to legacy conversion...`);
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

console.log('='.repeat(80));
console.log('🧪 VERIFYING FILE CONFIG');
console.log('='.repeat(80));
console.log('');

try {
  const filePath = path.join(__dirname, '../OSS-Doorway/src/config/generated/quest_config_691b7f64528ddbaa6810aa3f.json');
  console.log('📁 Reading file:', filePath);
  console.log('');
  
  const rawConfig = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  console.log('📋 Raw file config:');
  console.log('   Keys:', Object.keys(rawConfig));
  console.log('   Has questSequence:', Array.isArray(rawConfig?.questSequence));
  
  if (Array.isArray(rawConfig?.questSequence)) {
    console.log('   Quest count:', rawConfig.questSequence.length);
    console.log('');
    
    console.log('🔧 Converting to legacy format...');
    const legacyConfig = convertQuestSequenceToLegacy(rawConfig);
    console.log('');
    
    const questKeys = Object.keys(legacyConfig).filter(k => k !== 'map_repo_link');
    console.log('📋 Converted legacy config:');
    console.log('   Quest keys:', questKeys);
    console.log('');
    
    if (legacyConfig.Q1) {
      const q1Tasks = Object.keys(legacyConfig.Q1).filter(k => k !== 'metadata');
      console.log(`✅ Q1 found with ${q1Tasks.length} tasks`);
      console.log('');
      
      console.log('🎯 Task routing:');
      q1Tasks.forEach(taskId => {
        const task = legacyConfig.Q1[taskId];
        let handler;
        switch(task.type) {
          case 'get-issue-count': handler = 'handleIssueCount'; break;
          case 'get-pr-count': handler = 'handlePRCount'; break;
          case 'multiple-choice': handler = 'handleMCQ'; break;
          case 'get-top-contributor': handler = 'handleTopContributor'; break;
          case 'quiz': handler = 'handleQuiz'; break;
          default: handler = 'UNKNOWN';
        }
        console.log(`   ${taskId}: ${task.type} → ${handler}`);
      });
      
      console.log('');
      const t1 = legacyConfig.Q1.T1;
      if (t1.type === 'get-issue-count') {
        console.log('✅✅✅ SUCCESS! T1 has correct type and will route to handleIssueCount');
        console.log('');
        console.log('⏳ The bot cache needs to expire or the bot needs to restart.');
        console.log('   Cache age shown in logs: 0.0 minutes (just cached)');
        console.log('   Cache TTL: 1 hour');
        console.log('   Next cache expiry: ~1 hour from last bot activity');
      } else {
        console.log(`❌ ERROR! T1 type is ${t1.type}`);
      }
    }
  } else {
    console.error('❌ Config does not have questSequence array');
  }
  
  console.log('');
  console.log('='.repeat(80));
  
} catch (error) {
  console.error('❌ Error:', error.message);
}

