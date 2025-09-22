const { MongoClient } = require('mongodb');

const OSS_DOORWAY_URI = process.env.OSS_DOORWAY_DB_URI || 'mongodb+srv://cna93:gamification@gamification.nwes9ze.mongodb.net/?retryWrites=true&w=majority&appName=gamification';
const OSS_DOORWAY_DB_NAME = process.env.OSS_DOORWAY_DB_NAME || 'test';

async function identifyUsers() {
  const client = new MongoClient(OSS_DOORWAY_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to database');
    
    const db = client.db(OSS_DOORWAY_DB_NAME);
    
    // Get all users
    const users = await db.collection('users').find({}).toArray();
    console.log(`📊 Found ${users.length} users:`);
    
    for (const user of users) {
      const userData = user.user_data;
      console.log(`\n👤 User: ${user.username}`);
      console.log(`   ID: ${user._id}`);
      console.log(`   GitHub: ${userData.github || 'N/A'}`);
      console.log(`   CustomGroupId: ${userData.customGroupId || 'N/A'}`);
      console.log(`   Current: ${userData.current ? `${userData.current.quest}.${userData.current.task}` : 'null'}`);
      console.log(`   Points: ${userData.points || 0}`);
      console.log(`   XP: ${userData.xp || 0}`);
      console.log(`   Completion: ${userData.completion || 0}%`);
      
      if (userData.accepted) {
        console.log(`   Accepted Quests:`);
        Object.keys(userData.accepted).forEach(quest => {
          const completedTasks = Object.keys(userData.accepted[quest])
            .filter(task => userData.accepted[quest][task]?.completed);
          console.log(`     ${quest}: ${completedTasks.length} completed tasks (${completedTasks.join(', ')})`);
        });
      } else {
        console.log(`   Accepted Quests: none`);
      }
      
      if (userData.completed) {
        console.log(`   Completed Quests: ${Object.keys(userData.completed).join(', ')}`);
      } else {
        console.log(`   Completed Quests: none`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the script
identifyUsers().catch(console.error);
