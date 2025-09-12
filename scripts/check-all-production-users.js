const { MongoClient } = require('mongodb');

const PRODUCTION_URI = 'mongodb+srv://cna93:gamification@gamification.nwes9ze.mongodb.net/?retryWrites=true&w=majority&appName=gamification';
const PRODUCTION_DB_NAME = 'gamification';

async function checkAllProductionUsers() {
  const client = new MongoClient(PRODUCTION_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to production database');
    
    const db = client.db(PRODUCTION_DB_NAME);
    const collection = db.collection('user_data');
    
    // Get all users
    const allUsers = await collection.find({}).toArray();
    console.log(`📊 Found ${allUsers.length} total users in production:`);
    
    // Show first few users to understand the structure
    console.log(`\n📋 Sample users:`);
    for (let i = 0; i < Math.min(5, allUsers.length); i++) {
      const user = allUsers[i];
      console.log(`\n👤 User ${i + 1}: ${user.username}`);
      console.log(`   GitHub: ${user.github || 'N/A'}`);
      console.log(`   CustomGroupId: ${user.customGroupId || 'N/A'}`);
      console.log(`   Current: ${user.current ? `${user.current.quest}.${user.current.task}` : 'null'}`);
      console.log(`   Points: ${user.points || 0}`);
      
      // Check Q3 progress
      if (user.accepted && user.accepted.Q3) {
        const completedQ3Tasks = Object.keys(user.accepted.Q3)
          .filter(task => user.accepted.Q3[task]?.completed);
        console.log(`   Q3 Completed: ${completedQ3Tasks.join(', ')}`);
        
        // Check for T14 completion
        if (user.accepted.Q3.T14?.completed) {
          console.log(`   🔍 T14 COMPLETED`);
          if (!user.current || user.current.task === 'T14' || !user.accepted.Q3.T15) {
            console.log(`   ❌ STUCK: Not progressing to T15`);
          }
        }
      }
    }
    
    // Search for users with Q3T14 completion
    const q3t14Users = allUsers.filter(user => {
      return user.accepted && 
             user.accepted.Q3 && 
             user.accepted.Q3.T14?.completed;
    });
    
    console.log(`\n🔍 Found ${q3t14Users.length} users who completed Q3T14:`);
    q3t14Users.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.username} (${user.github || 'N/A'})`);
      console.log(`      Group: ${user.customGroupId || 'N/A'}`);
      console.log(`      Current: ${user.current ? `${user.current.quest}.${user.current.task}` : 'null'}`);
      
      // Check if stuck
      if (!user.current || 
          user.current.quest !== 'Q3' || 
          user.current.task === 'T14' ||
          !user.accepted.Q3.T15) {
        console.log(`      ❌ STUCK: Not progressing to T15`);
      } else {
        console.log(`      ✅ Progressing correctly`);
      }
    });
    
    // Search for users with similar names to Math1029
    const mathUsers = allUsers.filter(user => {
      return user.username && (
        user.username.toLowerCase().includes('math') ||
        user.username.toLowerCase().includes('1029') ||
        user.username.toLowerCase().includes('cs386') ||
        user.username.toLowerCase().includes('software')
      );
    });
    
    console.log(`\n🔍 Found ${mathUsers.length} users with similar names:`);
    mathUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.username} (${user.github || 'N/A'})`);
      console.log(`      Group: ${user.customGroupId || 'N/A'}`);
      console.log(`      Current: ${user.current ? `${user.current.quest}.${user.current.task}` : 'null'}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the script
checkAllProductionUsers().catch(console.error);
