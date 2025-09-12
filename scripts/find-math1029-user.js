const { MongoClient } = require('mongodb');

const OSS_DOORWAY_URI = process.env.OSS_DOORWAY_DB_URI || 'mongodb+srv://cna93:gamification@gamification.nwes9ze.mongodb.net/?retryWrites=true&w=majority&appName=gamification';
const OSS_DOORWAY_DB_NAME = process.env.OSS_DOORWAY_DB_NAME || 'test';

async function findMath1029User() {
  const client = new MongoClient(OSS_DOORWAY_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to database');
    
    const db = client.db(OSS_DOORWAY_DB_NAME);
    
    // Search for Math1029 user
    const math1029User = await db.collection('users').findOne({
      username: /Math1029/i
    });
    
    if (math1029User) {
      console.log(`🎯 Found Math1029 user:`);
      console.log(`   Username: ${math1029User.username}`);
      console.log(`   GitHub: ${math1029User.user_data.github || 'N/A'}`);
      console.log(`   CustomGroupId: ${math1029User.user_data.customGroupId || 'N/A'}`);
      console.log(`   Current: ${math1029User.user_data.current ? `${math1029User.user_data.current.quest}.${math1029User.user_data.current.task}` : 'null'}`);
      console.log(`   Points: ${math1029User.user_data.points || 0}`);
      console.log(`   Completion: ${math1029User.user_data.completion || 0}%`);
      
      // Check Q3 progress
      if (math1029User.user_data.accepted && math1029User.user_data.accepted.Q3) {
        const q3Tasks = Object.keys(math1029User.user_data.accepted.Q3);
        const completedQ3Tasks = q3Tasks.filter(task => math1029User.user_data.accepted.Q3[task]?.completed);
        
        console.log(`   Q3 Progress: ${completedQ3Tasks.length}/${q3Tasks.length} tasks completed`);
        console.log(`   Completed Q3 Tasks: ${completedQ3Tasks.join(', ')}`);
        
        // Check if T14 is completed
        if (math1029User.user_data.accepted.Q3.T14?.completed) {
          console.log(`   🔍 T14 COMPLETED - checking if stuck`);
          
          // Check if they're stuck
          if (!math1029User.user_data.current || 
              math1029User.user_data.current.quest !== 'Q3' || 
              math1029User.user_data.current.task === 'T14' ||
              !math1029User.user_data.accepted.Q3.T15) {
            console.log(`   ❌ STUCK: Completed T14 but not on T15`);
            console.log(`   Current task: ${math1029User.user_data.current ? `${math1029User.user_data.current.quest}.${math1029User.user_data.current.task}` : 'null'}`);
            console.log(`   T15 accepted: ${math1029User.user_data.accepted.Q3.T15 ? 'Yes' : 'No'}`);
          } else {
            console.log(`   ✅ Progressing correctly`);
          }
        }
      }
    } else {
      console.log(`❌ Math1029 user not found`);
      
      // Search for users with similar names
      const similarUsers = await db.collection('users').find({
        username: { $regex: /math|1029/i }
      }).toArray();
      
      console.log(`\n🔍 Found ${similarUsers.length} users with similar names:`);
      similarUsers.forEach(user => {
        console.log(`   - ${user.username} (${user.user_data.github || 'N/A'})`);
        console.log(`     Group: ${user.user_data.customGroupId || 'N/A'}`);
        console.log(`     Current: ${user.user_data.current ? `${user.user_data.current.quest}.${user.user_data.current.task}` : 'null'}`);
      });
    }
    
    // Also search for users with cs386 in their group ID
    const cs386Users = await db.collection('users').find({
      'user_data.customGroupId': { $regex: /cs386|software-engineering/i }
    }).toArray();
    
    console.log(`\n🔍 Found ${cs386Users.length} users with CS386-related group IDs:`);
    cs386Users.forEach(user => {
      console.log(`   - ${user.username} (${user.user_data.github || 'N/A'})`);
      console.log(`     Group: ${user.user_data.customGroupId}`);
      console.log(`     Current: ${user.user_data.current ? `${user.user_data.current.quest}.${user.user_data.current.task}` : 'null'}`);
      
      // Check Q3 progress
      if (user.user_data.accepted && user.user_data.accepted.Q3) {
        const completedQ3Tasks = Object.keys(user.user_data.accepted.Q3)
          .filter(task => user.user_data.accepted.Q3[task]?.completed);
        console.log(`     Q3 Completed: ${completedQ3Tasks.join(', ')}`);
      }
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the script
findMath1029User().catch(console.error);
