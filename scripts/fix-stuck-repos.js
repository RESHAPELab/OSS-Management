const { MongoClient } = require('mongodb');

const OSS_DOORWAY_URI = process.env.OSS_DOORWAY_DB_URI || 'mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/?retryWrites=true&w=majority&appName=gamification';
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
    
    for (const user of users) {
      const userData = user.user_data;
      
      // Skip users who don't have current quest/task or accepted quests
      if (!userData.current || !userData.accepted) {
        skippedCount++;
        continue;
      }
      
      const currentQuest = userData.current.quest;
      const currentTask = userData.current.task;
      
      // Get quest config for this user
      let questConfig;
      try {
        const configDoc = await db.collection('questconfigs').findOne({
          configId: userData.customGroupId || 'default'
        });
        
        if (!configDoc || !configDoc.config[currentQuest]) {
          console.log(`⚠️ No quest config found for ${user.username} (${userData.customGroupId})`);
          skippedCount++;
          continue;
        }
        
        questConfig = configDoc.config[currentQuest];
      } catch (error) {
        console.log(`⚠️ Error getting quest config for ${user.username}:`, error.message);
        skippedCount++;
        continue;
      }
      
      // Get all tasks in the current quest
      const allTasks = Object.keys(questConfig)
        .filter(key => /^T\d+$/i.test(key))
        .sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)));
      
      // Get completed tasks
      const completedTasks = Object.keys(userData.accepted[currentQuest] || {})
        .filter(taskKey => userData.accepted[currentQuest][taskKey]?.completed);
      
      // Check if user is stuck (has completed tasks but current task is not the next uncompleted one)
      const currentTaskIndex = allTasks.indexOf(currentTask);
      const lastCompletedIndex = Math.max(...completedTasks.map(task => allTasks.indexOf(task)));
      
      // If the last completed task is not the current task, user is stuck
      if (lastCompletedIndex >= 0 && currentTaskIndex !== lastCompletedIndex + 1) {
        console.log(`🔧 Fixing stuck user: ${user.username}`);
        console.log(`   Current: ${currentQuest}.${currentTask}`);
        console.log(`   Completed: ${completedTasks.join(', ')}`);
        console.log(`   Last completed index: ${lastCompletedIndex}, Current index: ${currentTaskIndex}`);
        
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
          // Update current task to the next uncompleted task
          userData.current.task = nextTask;
          
          // Update the user document
          await db.collection('users').updateOne(
            { _id: user._id },
            { $set: { user_data: userData } }
          );
          
          console.log(`   ✅ Updated to: ${currentQuest}.${nextTask}`);
          fixedCount++;
        } else {
          console.log(`   ⚠️ All tasks completed, quest should be finished`);
          // Quest is complete, clear current
          userData.current = null;
          await db.collection('users').updateOne(
            { _id: user._id },
            { $set: { user_data: userData } }
          );
          fixedCount++;
        }
      } else {
        skippedCount++;
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`   Fixed: ${fixedCount} users`);
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
