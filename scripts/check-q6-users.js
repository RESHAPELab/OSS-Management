import { MongoClient } from 'mongodb';

const TEST_URI = "mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/test?retryWrites=true&w=majority&appName=gamification";

async function checkQ6Users() {
  console.log('🔍 Checking user data for Q6 users...');
  
  const testClient = new MongoClient(TEST_URI);
  
  try {
    await testClient.connect();
    const testDb = testClient.db('test');
    const userDataCollection = testDb.collection('userstoreddatas');
    
    // Find users with the new purple config
    const purpleUsers = await userDataCollection.find({
      customGroupId: '68a770b8140b9c0174c13ce7_purple_1758142017627'
    }).toArray();
    
    console.log(`✅ Found ${purpleUsers.length} users with new purple config:`);
    
    for (const user of purpleUsers.slice(0, 5)) { // Show first 5 users
      const username = user._id;
      console.log(`\n👤 User: ${username}`);
      console.log(`   - CustomGroupId: ${user.customGroupId}`);
      console.log(`   - AcceptedQuests: ${user.acceptedQuests ? Object.keys(user.acceptedQuests).join(', ') : 'None'}`);
      console.log(`   - Has Q6: ${user.acceptedQuests && user.acceptedQuests.Q6 ? 'Yes' : 'No'}`);
      
      if (user.acceptedQuests && user.acceptedQuests.Q6) {
        console.log(`   - Q6 Details:`, user.acceptedQuests.Q6);
      }
    }
    
    // Also check for users who might have Q6 in a different format
    const q6UsersAlt = await userDataCollection.find({
      $or: [
        { 'acceptedQuests.Q6': { $exists: true } },
        { 'acceptedQuests.6': { $exists: true } },
        { 'acceptedQuests': { $regex: 'Q6', $options: 'i' } }
      ]
    }).toArray();
    
    console.log(`\n🔍 Alternative search found ${q6UsersAlt.length} users with Q6 references:`);
    for (const user of q6UsersAlt.slice(0, 3)) {
      console.log(`   - ${user._id}: ${user.acceptedQuests ? Object.keys(user.acceptedQuests).join(', ') : 'No acceptedQuests'}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await testClient.close();
  }
}

checkQ6Users();



