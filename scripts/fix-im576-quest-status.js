const { MongoClient } = require('mongodb');

const OSS_DOORWAY_URI = process.env.OSS_DOORWAY_DB_URI || 'mongodb+srv://cna93:gamification@gamification.nwes9ze.mongodb.net/?retryWrites=true&w=majority&appName=gamification';
const OSS_DOORWAY_DB_NAME = process.env.OSS_DOORWAY_DB_NAME || 'test';

async function fixIm576QuestStatus() {
  const client = new MongoClient(OSS_DOORWAY_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to database');
    
    const db = client.db(OSS_DOORWAY_DB_NAME);
    
    // Get im576's user data
    const user = await db.collection('user_data').findOne({
      _id: 'im576-cs386-software-engineering'
    });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('📋 Found user:', user._id);
    
    const userData = user.user_data;
    const completed = userData.completed || {};
    
    // Check which quests are actually completed
    const completedQuests = [];
    const availableQuests = [];
    
    // Check Q1 completion
    if (completed.Q1) {
      const q1Tasks = Object.keys(completed.Q1);
      const q1Completed = q1Tasks.every(taskId => completed.Q1[taskId].completed);
      if (q1Completed) {
        completedQuests.push('Q1');
        console.log('✅ Q1 is completed');
      }
    }
    
    // Check Q2 completion
    if (completed.Q2) {
      const q2Tasks = Object.keys(completed.Q2);
      const q2Completed = q2Tasks.every(taskId => completed.Q2[taskId].completed);
      if (q2Completed) {
        completedQuests.push('Q2');
        console.log('✅ Q2 is completed');
        
        // Since Q2 is completed, Q3 should be available
        availableQuests.push('Q3');
        console.log('✅ Q3 should be available');
      }
    }
    
    console.log('📋 Completed quests:', completedQuests);
    console.log('📋 Available quests:', availableQuests);
    
    // Update the user data with correct quest status
    const updateData = {
      'user_data.completedQuests': completedQuests,
      'user_data.availableQuests': availableQuests,
      'user_data.currentQuest': availableQuests.length > 0 ? availableQuests[0] : null
    };
    
    console.log('📝 Updating user data...');
    
    const result = await db.collection('user_data').updateOne(
      { _id: 'im576-cs386-software-engineering' },
      { $set: updateData }
    );
    
    if (result.modifiedCount > 0) {
      console.log('✅ Successfully updated user data');
      console.log('📋 User should now be able to accept Q3');
    } else {
      console.log('❌ Failed to update user data');
    }
    
    // Verify the update
    const updatedUser = await db.collection('user_data').findOne({
      _id: 'im576-cs386-software-engineering'
    });
    
    console.log('📋 Updated user data:');
    console.log('   - Completed Quests:', updatedUser.user_data.completedQuests);
    console.log('   - Available Quests:', updatedUser.user_data.availableQuests);
    console.log('   - Current Quest:', updatedUser.user_data.currentQuest);
    
    console.log('✅ Fix complete! User should now be able to /accept q3');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

fixIm576QuestStatus();


