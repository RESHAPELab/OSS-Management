// simulate-purple-deploy.js
// Shows what would happen with purple deploy for CS386 class

const { MongoClient } = require('mongodb');

async function main() {
  const classId = '68a770b8140b9c0174c13ce7';
  
  const ossDoorwayUri = process.env.OSS_DOORWAY_DB_URI || 'mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/?retryWrites=true&w=majority&appName=gamification';
  const ossDoorwayDbName = process.env.OSS_DOORWAY_DB_NAME || 'test';

  let client;
  try {
    client = new MongoClient(ossDoorwayUri);
    await client.connect();
    const db = client.db(ossDoorwayDbName);

    const questConfigsCol = db.collection('questconfigs');

    console.log('🟣 SIMULATING PURPLE DEPLOY FOR CS386 CLASS');
    console.log('=' .repeat(60));

    // 1. Find what purple deploy would use as base
    const baseConfig = await questConfigsCol.findOne({ classId: classId });
    console.log('\n📋 Purple deploy would use as BASE:');
    console.log('  - Config ID:', baseConfig?.classId);
    console.log('  - Created:', baseConfig?.createdAt);
    console.log('  - Quest keys:', baseConfig?.config ? Object.keys(baseConfig.config).filter(k => k.startsWith('Q')) : 'none');

    // 2. Show hypothetical Q4 data
    const hypotheticalQ4 = {
      "Q4": {
        "metadata": {
          "title": "Q4: Advanced Software Engineering Concepts",
          "description": "Explore advanced topics in software engineering",
          "prerequisite": "Q3",
          "type": "custom"
        },
        "T1": {
          "desc": "Design Patterns Analysis",
          "points": 25,
          "xp": 25,
          "type": "llm-text-validation",
          "accept": "Analyze the design patterns used in the provided codebase. Identify at least 3 patterns and explain their benefits.",
          "success": "✅ **Excellent Analysis!**\n\nYou've successfully identified and analyzed design patterns in the codebase.\n\n**Points earned:** 25\n\nGreat work on understanding software architecture patterns!",
          "error": "❌ **Analysis Incomplete**\n\nPlease provide a more detailed analysis of the design patterns.\n\n**Hint:** Look for patterns like Singleton, Factory, Observer, Strategy, etc.",
          "answer": "",
          "hints": [],
          "llmTextValidation": {
            "question": "Analyze design patterns in the codebase",
            "validationParameters": [
              "Student identifies at least 3 design patterns",
              "Explains benefits of each pattern",
              "Provides specific examples from the code"
            ],
            "temperature": 0.1,
            "enableDetailedFeedback": true
          }
        },
        "T2": {
          "desc": "Code Quality Assessment",
          "points": 25,
          "xp": 25,
          "type": "llm-text-validation",
          "accept": "Evaluate the code quality of the provided module. Consider maintainability, readability, and adherence to best practices.",
          "success": "✅ **Quality Assessment Complete!**\n\nYou've provided a thorough evaluation of the code quality.\n\n**Points earned:** 25\n\nExcellent analysis of software engineering principles!",
          "error": "❌ **Assessment Needs More Detail**\n\nPlease provide a more comprehensive quality assessment.\n\n**Hint:** Consider SOLID principles, naming conventions, documentation, etc.",
          "answer": "",
          "hints": [],
          "llmTextValidation": {
            "question": "Assess code quality",
            "validationParameters": [
              "Student evaluates maintainability",
              "Considers readability and best practices",
              "Provides specific examples and suggestions"
            ],
            "temperature": 0.1,
            "enableDetailedFeedback": true
          }
        }
      }
    };

    // 3. Show what the new purple config would look like
    const newPurpleConfigId = `${classId}_purple_${Date.now()}`;
    
    console.log('\n🆕 NEW PURPLE CONFIG WOULD BE CREATED:');
    console.log('  - Config ID:', newPurpleConfigId);
    console.log('  - Based on:', baseConfig?.classId);
    
    // Merge base config with Q4
    const newConfig = {
      ...baseConfig?.config,
      ...hypotheticalQ4
    };

    console.log('\n📚 QUEST STRUCTURE IN NEW CONFIG:');
    const questKeys = Object.keys(newConfig).filter(k => k.startsWith('Q'));
    questKeys.forEach(questId => {
      const quest = newConfig[questId];
      const taskKeys = Object.keys(quest).filter(k => k.startsWith('T'));
      console.log(`  - ${questId}: ${taskKeys.length} tasks (${taskKeys.join(', ')})`);
    });

    // 4. Check what happens to existing repos
    console.log('\n🔄 WHAT HAPPENS TO EXISTING REPOS:');
    
    // Check repos with different configs
    const userDataCol = db.collection('user_data');
    
    // Repos using the base config
    const baseConfigUsers = await userDataCol.find({ 
      'user_data.customGroupId': classId 
    }).toArray();
    
    // Repos using the purple config
    const purpleConfigUsers = await userDataCol.find({ 
      'user_data.customGroupId': '68a770b8140b9c0174c13ce7_purple_1756928031626'
    }).toArray();
    
    // Repos using the custom config
    const customConfigUsers = await userDataCol.find({ 
      'user_data.customGroupId': '68a770b8140b9c0174c13ce8-with-q3'
    }).toArray();

    console.log(`  - Repos using base config (${classId}): ${baseConfigUsers.length} users`);
    console.log(`    → Would be migrated to: ${newPurpleConfigId}`);
    console.log(`    → Would get: Q1, Q2, Q3, Q4`);
    
    console.log(`  - Repos using purple config (68a770b8140b9c0174c13ce7_purple_1756928031626): ${purpleConfigUsers.length} users`);
    console.log(`    → Would be migrated to: ${newPurpleConfigId}`);
    console.log(`    → Would get: Q1, Q2, Q3, Q4`);
    
    console.log(`  - Repos using custom config (68a770b8140b9c0174c13ce8-with-q3): ${customConfigUsers.length} users`);
    console.log(`    → Would NOT be migrated (doesn't match migration pattern)`);
    console.log(`    → Would keep: Q1, Q2, Q3 (no Q4)`);

    // 5. Show the actual config file structure
    console.log('\n📄 NEW CONFIG FILE STRUCTURE:');
    console.log(JSON.stringify({
      classId: newPurpleConfigId,
      config: newConfig,
      createdAt: new Date(),
      createdBy: 'purple-deploy-simulation'
    }, null, 2));

  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    if (client) await client.close();
  }
}

main();
