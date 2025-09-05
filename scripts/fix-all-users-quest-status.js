const { MongoClient } = require('mongodb');

const OSS_DOORWAY_URI = process.env.OSS_DOORWAY_DB_URI || 'mongodb+srv://cna93:gamification@gamification.nwes9ze.mongodb.net/?retryWrites=true&w=majority&appName=gamification';
const OSS_DOORWAY_DB_NAME = process.env.OSS_DOORWAY_DB_NAME || 'test';

async function fixAllUsersQuestStatus() {
  const client = new MongoClient(OSS_DOORWAY_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to database');
    
    const db = client.db(OSS_DOORWAY_DB_NAME);
    
    // Get all users in the CS386 class
    const users = await db.collection('user_data').find({
      'user_data.customGroupId': '68a770b8140b9c0174c13ce8-with-q3'
    }).toArray();
    
    console.log('📋 Found', users.length, 'users in the class');
    
    let fixedUsers = 0;
    let usersReadyForQ3 = [];
    
    for (const user of users) {
      const userData = user.user_data;
      const completed = userData.completed || {};
      
      // Check which quests are actually completed
      const completedQuests = [];
      const availableQuests = ['Q1']; // Q1 is always available
      
      // Check Q1 completion
      let q1Completed = false;
      if (completed.Q1) {
        const q1Tasks = Object.keys(completed.Q1);
        q1Completed = q1Tasks.length > 0 && q1Tasks.every(taskId => completed.Q1[taskId].completed);
        if (q1Completed) {
          completedQuests.push('Q1');
          availableQuests.push('Q2'); // Q2 becomes available after Q1
        }
      }
      
      // Check Q2 completion
      let q2Completed = false;
      if (completed.Q2) {
        const q2Tasks = Object.keys(completed.Q2);
        q2Completed = q2Tasks.length > 0 && q2Tasks.every(taskId => completed.Q2[taskId].completed);
        if (q2Completed) {
          completedQuests.push('Q2');
          availableQuests.push('Q3'); // Q3 becomes available after Q2
          usersReadyForQ3.push(user._id);
        }
      }
      
      // Check if user data needs fixing
      const currentCompletedQuests = userData.completedQuests || [];
      const currentAvailableQuests = userData.availableQuests || [];
      
      const needsUpdate = 
        JSON.stringify(currentCompletedQuests.sort()) !== JSON.stringify(completedQuests.sort()) ||
        JSON.stringify(currentAvailableQuests.sort()) !== JSON.stringify(availableQuests.sort());
      
      if (needsUpdate) {
        console.log('🔧 Fixing user:', user._id);
        console.log('   - Was: completed=' + JSON.stringify(currentCompletedQuests) + ', available=' + JSON.stringify(currentAvailableQuests));
        console.log('   - Now: completed=' + JSON.stringify(completedQuests) + ', available=' + JSON.stringify(availableQuests));
        
        // Determine current quest
        let currentQuest = null;
        if (!q1Completed) {
          currentQuest = 'Q1';
        } else if (!q2Completed) {
          currentQuest = 'Q2';
        } else {
          currentQuest = 'Q3';
        }
        
        const updateData = {
          'user_data.completedQuests': completedQuests,
          'user_data.availableQuests': availableQuests,
          'user_data.currentQuest': currentQuest
        };
        
        const result = await db.collection('user_data').updateOne(
          { _id: user._id },
          { $set: updateData }
        );
        
        if (result.modifiedCount > 0) {
          fixedUsers++;
        }
      }
    }
    
    console.log('✅ Fixed', fixedUsers, 'users');
    console.log('🎯 Users ready for Q3:', usersReadyForQ3.length);
    
    if (usersReadyForQ3.length > 0) {
      console.log('📋 Users who completed Q2 and can now accept Q3:');
      usersReadyForQ3.forEach(userId => {
        console.log('   -', userId);
      });
      
      console.log('');
      console.log('💡 These users can now run /accept q3 in their repositories!');
    }
    
    console.log('✅ All users fixed!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

fixAllUsersQuestStatus();

