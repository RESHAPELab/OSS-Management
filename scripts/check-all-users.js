import { MongoClient } from 'mongodb';

const TEST_URI = "mongodb+srv://cna93:gamification@gamification.nwes9ze.mongodb.net/test?retryWrites=true&w=majority&appName=gamification";

async function checkAllUsers() {
  console.log('🔍 Checking all users in the database...');
  
  const testClient = new MongoClient(TEST_URI);
  
  try {
    await testClient.connect();
    const testDb = testClient.db('test');
    const userDataCollection = testDb.collection('userstoreddatas');
    
    // Get total count
    const totalUsers = await userDataCollection.countDocuments();
    console.log(`📊 Total users in database: ${totalUsers}`);
    
    // Find users with any purple config
    const purpleUsers = await userDataCollection.find({
      customGroupId: { $regex: 'purple', $options: 'i' }
    }).toArray();
    
    console.log(`\n🟣 Users with purple configs: ${purpleUsers.length}`);
    for (const user of purpleUsers.slice(0, 10)) {
      console.log(`   - ${user._id}: ${user.customGroupId}`);
    }
    
    // Find users with the specific class ID
    const classUsers = await userDataCollection.find({
      customGroupId: { $regex: '68a770b8140b9c0174c13ce7', $options: 'i' }
    }).toArray();
    
    console.log(`\n🎓 Users with class 68a770b8140b9c0174c13ce7: ${classUsers.length}`);
    for (const user of classUsers.slice(0, 10)) {
      console.log(`   - ${user._id}: ${user.customGroupId}`);
    }
    
    // Check if there are any users at all
    const allUsers = await userDataCollection.find({}).limit(5).toArray();
    console.log(`\n👥 Sample users:`);
    for (const user of allUsers) {
      console.log(`   - ${user._id}: ${user.customGroupId || 'No customGroupId'}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await testClient.close();
  }
}

checkAllUsers();
