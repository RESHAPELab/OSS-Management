const { MongoClient } = require('mongodb');

const OSS_DOORWAY_URI = process.env.OSS_DOORWAY_DB_URI || 'mongodb+srv://cna93:gamification@gamification.nwes9ze.mongodb.net/?retryWrites=true&w=majority&appName=gamification';
const OSS_DOORWAY_DB_NAME = process.env.OSS_DOORWAY_DB_NAME || 'test';

async function findStuckUsersWithQ3() {
  const client = new MongoClient(OSS_DOORWAY_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to database');
    
    const db = client.db(OSS_DOORWAY_DB_NAME);
    
    // Get quest config for the with-q3 version
    const q3Config = await db.collection('questconfigs').findOne({
      configId: '68a770b8140b9c0174c13ce8-with-q3'
    });
    
    if (!q3Config) {
      console.log('❌ Quest config 68a770b8140b9c0174c13ce8-with-q3 not found');
      return;
    }
    
    console.log(`📋 Quest Config Found:`);
    console.log(`   Config ID: ${q3Config.configId}`);
    console.log(`   Available Quests: ${Object.keys(q3Config.config).filter(k => k.startsWith('Q')).join(', ')}`);
    
    // Get all users with this specific group ID
    const users = await db.collection('users').find({
      'user_data.customGroupId': '68a770b8140b9c0174c13ce8-with-q3'
    }).toArray();
    
    console.log(`\n👥 Found ${users.length} users with group ID 68a770b8140b9c0174c13ce8-with-q3:`);
    
    let stuckUsers = [];
    let q3t14CompletedUsers = [];
    
    for (const user of users) {
      const userData = user.user_data;
      console.log(`\n👤 User: ${user.username}`);
      console.log(`   GitHub: ${userData.github || 'N/A'}`);
      console.log(`   Current: ${userData.current ? `${userData.current.quest}.${userData.current.task}` : 'null'}`);
      console.log(`   Points: ${userData.points || 0}`);
      console.log(`   Completion: ${userData.completion || 0}%`);
      
      // Check Q3 progress
      if (userData.accepted && userData.accepted.Q3) {
        const q3Tasks = Object.keys(userData.accepted.Q3);
        const completedQ3Tasks = q3Tasks.filter(task => userData.accepted.Q3[task]?.completed);
        
        console.log(`   Q3 Progress: ${completedQ3Tasks.length}/${q3Tasks.length} tasks completed`);
        console.log(`   Completed Q3 Tasks: ${completedQ3Tasks.join(', ')}`);
        
        // Check if T14 is completed
        if (userData.accepted.Q3.T14?.completed) {
          q3t14CompletedUsers.push({
            username: user.username,
            github: userData.github,
            current: userData.current,
            completedTasks: completedQ3Tasks
          });
          console.log(`   🔍 T14 COMPLETED - checking if stuck`);
          
          // Check if they're stuck (current task is not T15 or beyond)
          if (!userData.current || 
              userData.current.quest !== 'Q3' || 
              userData.current.task === 'T14' ||
              !userData.accepted.Q3.T15) {
            stuckUsers.push({
              username: user.username,
              github: userData.github,
              current: userData.current,
              completedTasks: completedQ3Tasks,
              issue: 'Completed T14 but not progressing to T15'
            });
            console.log(`   ❌ STUCK: Completed T14 but not on T15`);
          } else {
            console.log(`   ✅ Progressing correctly`);
          }
        }
      } else {
        console.log(`   Q3 Progress: Not started`);
      }
      
      // Check for other stuck scenarios
      if (userData.current) {
        const currentQuest = userData.current.quest;
        const currentTask = userData.current.task;
        
        // Check if current task is completed but not progressing
        if (userData.accepted && 
            userData.accepted[currentQuest] && 
            userData.accepted[currentQuest][currentTask]?.completed) {
          
          // Find next task
          const questConfig = q3Config.config[currentQuest];
          if (questConfig) {
            const allTasks = Object.keys(questConfig)
              .filter(key => /^T\d+$/i.test(key))
              .sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)));
            
            const currentIndex = allTasks.indexOf(currentTask);
            const nextTask = allTasks[currentIndex + 1];
            
            if (nextTask) {
              stuckUsers.push({
                username: user.username,
                github: userData.github,
                current: userData.current,
                issue: `Completed ${currentQuest}.${currentTask} but not progressing to ${currentQuest}.${nextTask}`
              });
              console.log(`   ❌ STUCK: Completed ${currentQuest}.${currentTask} but not progressing to ${currentQuest}.${nextTask}`);
            }
          }
        }
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`   Total Users: ${users.length}`);
    console.log(`   Users who completed Q3T14: ${q3t14CompletedUsers.length}`);
    console.log(`   Stuck Users Found: ${stuckUsers.length}`);
    
    if (stuckUsers.length > 0) {
      console.log(`\n🔧 Stuck Users Details:`);
      stuckUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.username} (${user.github})`);
        console.log(`      Current: ${user.current ? `${user.current.quest}.${user.current.task}` : 'null'}`);
        console.log(`      Issue: ${user.issue}`);
        if (user.completedTasks) {
          console.log(`      Completed Tasks: ${user.completedTasks.join(', ')}`);
        }
      });
    }
    
    if (q3t14CompletedUsers.length > 0) {
      console.log(`\n🎯 Users who completed Q3T14:`);
      q3t14CompletedUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.username} (${user.github})`);
        console.log(`      Current: ${user.current ? `${user.current.quest}.${user.current.task}` : 'null'}`);
        console.log(`      Completed Tasks: ${user.completedTasks.join(', ')}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the script
findStuckUsersWithQ3().catch(console.error);
