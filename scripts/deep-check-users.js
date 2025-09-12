import { MongoClient } from 'mongodb';

const DOORWAY_URI = "mongodb+srv://cna93:gamification@gamification.nwes9ze.mongodb.net/?retryWrites=true&w=majority&appName=gamification";

async function deepCheckUsers() {
  console.log('🔍 Deep checking user collections for CocoCrispy95 and CS386 users...');
  
  const doorwayClient = new MongoClient(DOORWAY_URI);
  
  try {
    await doorwayClient.connect();
    const doorwayDb = doorwayClient.db('gamification');
    
    // Check user_data collection thoroughly
    console.log('\n📋 Deep checking user_data collection (53 documents)...');
    const userDataCollection = doorwayDb.collection('user_data');
    
    // Get all documents and search through them
    const allUserData = await userDataCollection.find({}).toArray();
    console.log(`Retrieved ${allUserData.length} user_data documents`);
    
    let foundCoco = false;
    let cs386Users = [];
    
    for (const user of allUserData) {
      // Check for CocoCrispy95
      const userStr = JSON.stringify(user).toLowerCase();
      if (userStr.includes('cococrispy95')) {
        foundCoco = true;
        console.log('✅ Found CocoCrispy95 in user_data:');
        console.log(`   - ID: ${user._id}`);
        console.log(`   - Fields: ${Object.keys(user).join(', ')}`);
        console.log(`   - Full document:`, JSON.stringify(user, null, 2));
      }
      
      // Check for CS386 related users
      if (userStr.includes('cs386') || userStr.includes('68a770b8140b9c0174c13ce')) {
        cs386Users.push({
          id: user._id,
          user: user
        });
      }
    }
    
    if (!foundCoco) {
      console.log('❌ CocoCrispy95 not found in user_data collection');
      
      // Show some sample user_data documents to understand structure
      console.log('\n📝 Sample user_data documents (first 3):');
      for (let i = 0; i < Math.min(3, allUserData.length); i++) {
        const user = allUserData[i];
        console.log(`   ${i + 1}. ID: ${user._id}`);
        console.log(`      Fields: ${Object.keys(user).join(', ')}`);
        if (user.github || user.username) {
          console.log(`      GitHub/Username: ${user.github || user.username}`);
        }
      }
    }
    
    if (cs386Users.length > 0) {
      console.log(`\n🎯 Found ${cs386Users.length} CS386 related users in user_data:`);
      for (const userInfo of cs386Users.slice(0, 5)) {
        console.log(`   - ID: ${userInfo.id}`);
        console.log(`   - Document: ${JSON.stringify(userInfo.user, null, 2)}`);
      }
    } else {
      console.log('❌ No CS386 users found in user_data collection');
    }
    
    // Check userstoreddata collection
    console.log('\n📋 Checking userstoreddata collection...');
    const userStoredDataCollection = doorwayDb.collection('userstoreddata');
    
    const storedDataDoc = await userStoredDataCollection.findOne({});
    if (storedDataDoc) {
      console.log('📝 userstoreddata document:');
      console.log(`   - ID: ${storedDataDoc._id}`);
      console.log(`   - Username: ${storedDataDoc.username}`);
      console.log(`   - Fields: ${Object.keys(storedDataDoc).join(', ')}`);
      
      // Check if this contains CocoCrispy95 or CS386 data
      const docStr = JSON.stringify(storedDataDoc).toLowerCase();
      if (docStr.includes('cococrispy95')) {
        console.log('✅ Found CocoCrispy95 reference in userstoreddata');
      }
      if (docStr.includes('cs386') || docStr.includes('68a770b8140b9c0174c13ce')) {
        console.log('✅ Found CS386 reference in userstoreddata');
      }
      
      console.log(`   - Full document:`, JSON.stringify(storedDataDoc, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await doorwayClient.close();
  }
}

deepCheckUsers();
