const { MongoClient } = require('mongodb');

const OSS_DOORWAY_URI = process.env.OSS_DOORWAY_DB_URI || 'mongodb+srv://cna93:gamification@gamification.nwes9ze.mongodb.net/?retryWrites=true&w=majority&appName=gamification';
const OSS_DOORWAY_DB_NAME = process.env.OSS_DOORWAY_DB_NAME || 'test';

async function fixStuckRepos() {
  const client = new MongoClient(OSS_DOORWAY_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to database');
    
    const db = client.db(OSS_DOORWAY_DB_NAME);
    
    // Get all user data documents
    const users = await db.collection('users').find({}).toArray();
    console.log(`📊 Found ${users.length} users to check`);
    
    let fixedCount = 0;
    let skippedCount = 0;
    let resumedCount = 0;
    
    for (const user of users) {
      const userData = user.user_data;
      console.log(`\n👤 Checking user: ${user.username}`);
      console.log(`   Current: ${userData.current ? `${userData.current.quest}.${userData.current.task}` : 'null'}`);
      console.log(`   Accepted: ${userData.accepted ? Object.keys(userData.accepted).length : 0} quests`);
      console.log(`   CustomGroupId: ${userData.customGroupId}`);
      
      // Get quest config for this user
      let questConfig;
      try {
        const configDoc = await db.collection('questconfigs').findOne({
          configId: userData.customGroupId || 'default'
        });
        
        if (!configDoc) {
          console.log(`   ⚠️ No quest config found for ${userData.customGroupId}`);
          skippedCount++;
          continue;
        }
        
        questConfig = configDoc.config;
        console.log(`   📋 Found quest config with quests: ${Object.keys(questConfig).filter(k => k.startsWith('Q')).join(', ')}`);
        
      } catch (error) {
        console.log(`   ⚠️ Error getting quest config:`, error.message);
        skippedCount++;
        continue;
      }
      
      // Case 1: User has no current quest/task but has accepted quests (stuck)
      if (!userData.current && userData.accepted) {
        console.log(`   🔧 User has accepted quests but no current - finding where to resume`);
        
        // Find the first quest with incomplete tasks
        let resumeQuest = null;
        let resumeTask = null;
        
        for (const questKey of Object.keys(questConfig).filter(k => k.startsWith('Q'))) {
          const quest = questConfig[questKey];
          const allTasks = Object.keys(quest).filter(key => /^T\d+$/i.test(key))
            .sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)));
          
          if (userData.accepted[questKey]) {
            // Find first incomplete task in this quest
            for (const task of allTasks) {
              if (!userData.accepted[questKey][task] || !userData.accepted[questKey][task].completed) {
                resumeQuest = questKey;
                resumeTask = task;
                break;
              }
            }
            if (resumeQuest) break;
          } else {
            // Quest not accepted yet, check if it should be unlocked
            const questMeta = quest.metadata;
            if (!questMeta.prerequisite || userData.completed?.[questMeta.prerequisite]) {
              resumeQuest = questKey;
              resumeTask = allTasks[0]; // Start with first task
              break;
            }
          }
        }
        
        if (resumeQuest && resumeTask) {
          userData.current = { quest: resumeQuest, task: resumeTask };
          await db.collection('users').updateOne(
            { _id: user._id },
            { $set: { user_data: userData } }
          );
          console.log(`   ✅ Resumed at: ${resumeQuest}.${resumeTask}`);
          resumedCount++;
        } else {
          console.log(`   ⚠️ All quests completed or no valid quest to resume`);
          skippedCount++;
        }
        continue;
      }
      
      // Case 2: User has current quest/task but is stuck (completed tasks but not progressing)
      if (userData.current && userData.accepted) {
        const currentQuest = userData.current.quest;
        const currentTask = userData.current.task;
        
        if (!questConfig[currentQuest]) {
          console.log(`   ⚠️ Current quest ${currentQuest} not found in config`);
          skippedCount++;
          continue;
        }
        
        // Get all tasks in the current quest
        const allTasks = Object.keys(questConfig[currentQuest])
          .filter(key => /^T\d+$/i.test(key))
          .sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)));
        
        // Get completed tasks
        const completedTasks = Object.keys(userData.accepted[currentQuest] || {})
          .filter(taskKey => userData.accepted[currentQuest][taskKey]?.completed);
        
        // Check if user is stuck
        const currentTaskIndex = allTasks.indexOf(currentTask);
        const lastCompletedIndex = Math.max(...completedTasks.map(task => allTasks.indexOf(task)), -1);
        
        console.log(`   📊 Current task index: ${currentTaskIndex}, Last completed: ${lastCompletedIndex}`);
        
        // If the last completed task is not the current task, user is stuck
        if (lastCompletedIndex >= 0 && currentTaskIndex !== lastCompletedIndex + 1) {
          console.log(`   🔧 User is stuck - fixing progression`);
          
          // Find the next uncompleted task
          let nextTask = null;
          for (let i = 0; i < allTasks.length; i++) {
            const task = allTasks[i];
            if (!userData.accepted[currentQuest][task] || !userData.accepted[currentQuest][task].completed) {
              nextTask = task;
              break;
            }
          }
          
          if (nextTask) {
            userData.current.task = nextTask;
            await db.collection('users').updateOne(
              { _id: user._id },
              { $set: { user_data: userData } }
            );
            console.log(`   ✅ Updated to: ${currentQuest}.${nextTask}`);
            fixedCount++;
          } else {
            console.log(`   ⚠️ All tasks completed, quest should be finished`);
            userData.current = null;
            await db.collection('users').updateOne(
              { _id: user._id },
              { $set: { user_data: userData } }
            );
            fixedCount++;
          }
        } else {
          console.log(`   ✅ User progression is correct`);
          skippedCount++;
        }
        continue;
      }
      
      // Case 3: User has no current and no accepted (completely new)
      if (!userData.current && !userData.accepted) {
        console.log(`   🔧 User has no progress - starting from beginning`);
        
        // Find first available quest
        const firstQuest = Object.keys(questConfig).find(k => k.startsWith('Q'));
        if (firstQuest) {
          const firstTask = Object.keys(questConfig[firstQuest])
            .filter(key => /^T\d+$/i.test(key))
            .sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)))[0];
          
          if (firstTask) {
            userData.current = { quest: firstQuest, task: firstTask };
            await db.collection('users').updateOne(
              { _id: user._id },
              { $set: { user_data: userData } }
            );
            console.log(`   ✅ Started at: ${firstQuest}.${firstTask}`);
            resumedCount++;
          } else {
            console.log(`   ⚠️ No tasks found in first quest`);
            skippedCount++;
          }
        } else {
          console.log(`   ⚠️ No quests found in config`);
          skippedCount++;
        }
        continue;
      }
      
      skippedCount++;
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`   Fixed stuck users: ${fixedCount}`);
    console.log(`   Resumed users: ${resumedCount}`);
    console.log(`   Skipped: ${skippedCount} users`);
    console.log(`   Total: ${users.length} users`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the script
fixStuckRepos().catch(console.error);
