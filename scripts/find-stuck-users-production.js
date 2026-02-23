const { MongoClient } = require('mongodb');

const PRODUCTION_URI = 'mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/?retryWrites=true&w=majority&appName=gamification';
const PRODUCTION_DB_NAME = 'gamification';

async function findStuckUsersInProduction() {
  const client = new MongoClient(PRODUCTION_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to production database');
    
    const db = client.db(PRODUCTION_DB_NAME);
    const collection = db.collection('user_data');
    
    // Search for Math1029 user
    const math1029User = await collection.findOne({
      username: /Math1029/i
    });
    
    if (math1029User) {
      console.log(`🎯 Found Math1029 user:`);
      console.log(`   Username: ${math1029User.username}`);
      console.log(`   GitHub: ${math1029User.github || 'N/A'}`);
      console.log(`   CustomGroupId: ${math1029User.customGroupId || 'N/A'}`);
      console.log(`   Current: ${math1029User.current ? `${math1029User.current.quest}.${math1029User.current.task}` : 'null'}`);
      console.log(`   Points: ${math1029User.points || 0}`);
      console.log(`   Completion: ${math1029User.completion || 0}%`);
      
      // Check Q3 progress
      if (math1029User.accepted && math1029User.accepted.Q3) {
        const q3Tasks = Object.keys(math1029User.accepted.Q3);
        const completedQ3Tasks = q3Tasks.filter(task => math1029User.accepted.Q3[task]?.completed);
        
        console.log(`   Q3 Progress: ${completedQ3Tasks.length}/${q3Tasks.length} tasks completed`);
        console.log(`   Completed Q3 Tasks: ${completedQ3Tasks.join(', ')}`);
        
        // Check if T14 is completed and stuck
        if (math1029User.accepted.Q3.T14?.completed) {
          console.log(`   🔍 T14 COMPLETED - checking if stuck`);
          
          if (!math1029User.current || 
              math1029User.current.quest !== 'Q3' || 
              math1029User.current.task === 'T14' ||
              !math1029User.accepted.Q3.T15) {
            console.log(`   ❌ STUCK: Completed T14 but not on T15`);
            console.log(`   Current task: ${math1029User.current ? `${math1029User.current.quest}.${math1029User.current.task}` : 'null'}`);
            console.log(`   T15 accepted: ${math1029User.accepted.Q3.T15 ? 'Yes' : 'No'}`);
          } else {
            console.log(`   ✅ Progressing correctly`);
          }
        }
      }
    } else {
      console.log(`❌ Math1029 user not found`);
    }
    
    // Search for all CS386 users
    const cs386Users = await collection.find({
      customGroupId: { $regex: /cs386|software-engineering|68a770b8140b9c0174c13ce8/i }
    }).toArray();
    
    console.log(`\n🔍 Found ${cs386Users.length} CS386 users:`);
    
    let stuckUsers = [];
    let q3t14CompletedUsers = [];
    
    for (const user of cs386Users) {
      console.log(`\n👤 User: ${user.username}`);
      console.log(`   GitHub: ${user.github || 'N/A'}`);
      console.log(`   CustomGroupId: ${user.customGroupId}`);
      console.log(`   Current: ${user.current ? `${user.current.quest}.${user.current.task}` : 'null'}`);
      console.log(`   Points: ${user.points || 0}`);
      console.log(`   Completion: ${user.completion || 0}%`);
      
      // Check Q3 progress
      if (user.accepted && user.accepted.Q3) {
        const q3Tasks = Object.keys(user.accepted.Q3);
        const completedQ3Tasks = q3Tasks.filter(task => user.accepted.Q3[task]?.completed);
        
        console.log(`   Q3 Progress: ${completedQ3Tasks.length}/${q3Tasks.length} tasks completed`);
        console.log(`   Completed Q3 Tasks: ${completedQ3Tasks.join(', ')}`);
        
        // Check if T14 is completed
        if (user.accepted.Q3.T14?.completed) {
          q3t14CompletedUsers.push({
            username: user.username,
            github: user.github,
            customGroupId: user.customGroupId,
            current: user.current,
            completedTasks: completedQ3Tasks
          });
          console.log(`   🔍 T14 COMPLETED - checking if stuck`);
          
          // Check if they're stuck
          if (!user.current || 
              user.current.quest !== 'Q3' || 
              user.current.task === 'T14' ||
              !user.accepted.Q3.T15) {
            stuckUsers.push({
              username: user.username,
              github: user.github,
              customGroupId: user.customGroupId,
              current: user.current,
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
      if (user.current) {
        const currentQuest = user.current.quest;
        const currentTask = user.current.task;
        
        // Check if current task is completed but not progressing
        if (user.accepted && 
            user.accepted[currentQuest] && 
            user.accepted[currentQuest][currentTask]?.completed) {
          
          stuckUsers.push({
            username: user.username,
            github: user.github,
            customGroupId: user.customGroupId,
            current: user.current,
            issue: `Completed ${currentQuest}.${currentTask} but not progressing to next task`
          });
          console.log(`   ❌ STUCK: Completed ${currentQuest}.${currentTask} but not progressing`);
        }
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`   Total CS386 Users: ${cs386Users.length}`);
    console.log(`   Users who completed Q3T14: ${q3t14CompletedUsers.length}`);
    console.log(`   Stuck Users Found: ${stuckUsers.length}`);
    
    if (stuckUsers.length > 0) {
      console.log(`\n🔧 Stuck Users Details:`);
      stuckUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.username} (${user.github})`);
        console.log(`      Group: ${user.customGroupId}`);
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
        console.log(`      Group: ${user.customGroupId}`);
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
findStuckUsersInProduction().catch(console.error);
