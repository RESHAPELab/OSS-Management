const { MongoClient } = require('mongodb');

const OSS_DOORWAY_URI = process.env.OSS_DOORWAY_DB_URI || 'mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/?retryWrites=true&w=majority&appName=gamification';
const OSS_DOORWAY_DB_NAME = process.env.OSS_DOORWAY_DB_NAME || 'test';

async function postAcceptQ3ForUsers() {
  const client = new MongoClient(OSS_DOORWAY_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to database');
    
    const db = client.db(OSS_DOORWAY_DB_NAME);
    
    // Get all users in the CS386-Software Engineering class
    const users = await db.collection('user_data').find({
      'user_data.customGroupId': '68a770b8140b9c0174c13ce8-with-q3'
    }).toArray();
    
    console.log('📋 Found', users.length, 'users in the class');
    
    // Filter users who have completed Q2
    const usersWithQ2Completed = [];
    
    for (const user of users) {
      const userData = user.user_data;
      if (userData && userData.completedQuests && userData.completedQuests.includes('Q2')) {
        usersWithQ2Completed.push(user._id);
      }
    }
    
    console.log('📋 Users who completed Q2:', usersWithQ2Completed.length);
    console.log('📋 Users:', usersWithQ2Completed);
    
    if (usersWithQ2Completed.length === 0) {
      console.log('❌ No users have completed Q2 yet');
      return;
    }
    
    // For each user who completed Q2, we need to simulate posting /accept q3
    // This would typically be done through the bot's webhook or API
    console.log('🎯 Ready to post /accept q3 for users who completed Q2');
    console.log('📝 Note: This would require integration with the bot\'s webhook system');
    console.log('📝 The bot would need to process these commands for each user');
    
    // Show the command that would be posted for each user
    usersWithQ2Completed.forEach(userId => {
      console.log(`📤 Would post: /accept q3 for user: ${userId}`);
    });
    
    console.log('✅ Analysis complete');
    console.log('💡 To actually post these commands, you would need to:');
    console.log('   1. Use the bot\'s webhook endpoint');
    console.log('   2. Or trigger the bot\'s command processing system');
    console.log('   3. Or manually post /accept q3 in each user\'s repository');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

postAcceptQ3ForUsers();
