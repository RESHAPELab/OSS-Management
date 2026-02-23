const { MongoClient } = require('mongodb');

const OSS_DOORWAY_URI = process.env.OSS_DOORWAY_DB_URI || 'mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/?retryWrites=true&w=majority&appName=gamification';
const OSS_DOORWAY_DB_NAME = process.env.OSS_DOORWAY_DB_NAME || 'test';

async function findCS386RelatedUsers() {
  const client = new MongoClient(OSS_DOORWAY_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to database');
    
    const db = client.db(OSS_DOORWAY_DB_NAME);
    
    // Get all users
    const allUsers = await db.collection('users').find({}).toArray();
    console.log(`📊 Found ${allUsers.length} total users`);
    
    // Look for users with CS386-related group IDs
    const cs386RelatedUsers = allUsers.filter(user => {
      const customGroupId = user.user_data.customGroupId;
      return customGroupId && (
        customGroupId.includes('68a770b8140b9c0174c13ce7') ||
        customGroupId.includes('cs386') ||
        customGroupId.includes('software-engineering') ||
        customGroupId.includes('CS386')
      );
    });
    
    console.log(`\n🔍 Found ${cs386RelatedUsers.length} CS386-related users:`);
    
    let stuckUsers = [];
    let q3t14CompletedUsers = [];
    
    for (const user of cs386RelatedUsers) {
      const userData = user.user_data;
      console.log(`\n👤 User: ${user.username}`);
      console.log(`   GitHub: ${userData.github || 'N/A'}`);
      console.log(`   CustomGroupId: ${userData.customGroupId}`);
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
            customGroupId: userData.customGroupId,
            current: userData.current,
            completedTasks: completedQ3Tasks
          });
          console.log(`   🔍 T14 COMPLETED - checking if stuck`);
          
          // Check if they're stuck
          if (!userData.current || 
              userData.current.quest !== 'Q3' || 
              userData.current.task === 'T14' ||
              !userData.accepted.Q3.T15) {
            stuckUsers.push({
              username: user.username,
              github: userData.github,
              customGroupId: userData.customGroupId,
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
          
          stuckUsers.push({
            username: user.username,
            github: userData.github,
            customGroupId: userData.customGroupId,
            current: userData.current,
            issue: `Completed ${currentQuest}.${currentTask} but not progressing to next task`
          });
          console.log(`   ❌ STUCK: Completed ${currentQuest}.${currentTask} but not progressing`);
        }
      }
    }
    
    // Also check for users with any Q3T14 completion
    console.log(`\n🔍 Checking all users for Q3T14 completion:`);
    const allQ3T14Users = allUsers.filter(user => {
      return user.user_data.accepted && 
             user.user_data.accepted.Q3 && 
             user.user_data.accepted.Q3.T14?.completed;
    });
    
    console.log(`Found ${allQ3T14Users.length} users who completed Q3T14:`);
    allQ3T14Users.forEach(user => {
      const userData = user.user_data;
      console.log(`   - ${user.username} (${userData.github}) - Group: ${userData.customGroupId}`);
      console.log(`     Current: ${userData.current ? `${userData.current.quest}.${userData.current.task}` : 'null'}`);
      
      // Check if stuck
      if (!userData.current || 
          userData.current.quest !== 'Q3' || 
          userData.current.task === 'T14' ||
          !userData.accepted.Q3.T15) {
        console.log(`     ❌ STUCK: Not progressing to T15`);
      } else {
        console.log(`     ✅ Progressing correctly`);
      }
    });
    
    console.log(`\n📊 Summary:`);
    console.log(`   Total Users: ${allUsers.length}`);
    console.log(`   CS386-Related Users: ${cs386RelatedUsers.length}`);
    console.log(`   Users who completed Q3T14: ${allQ3T14Users.length}`);
    console.log(`   Stuck Users Found: ${stuckUsers.length}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the script
findCS386RelatedUsers().catch(console.error);
