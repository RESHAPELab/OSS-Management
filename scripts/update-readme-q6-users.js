import { MongoClient } from 'mongodb';
import axios from 'axios';

const TEST_URI = "mongodb+srv://cna93:gamification@gamification.nwes9ze.mongodb.net/test?retryWrites=true&w=majority&appName=gamification";

async function updateReadmeForQ6Users() {
  console.log('🔍 Finding all users with Q6 and updating their READMEs...');
  
  const testClient = new MongoClient(TEST_URI);
  
  try {
    await testClient.connect();
    const testDb = testClient.db('test');
    const userDataCollection = testDb.collection('userstoreddatas');
    
    // Find all users with Q6 in their accepted quests
    const q6Users = await userDataCollection.find({
      'acceptedQuests.Q6': { $exists: true }
    }).toArray();
    
    console.log(`✅ Found ${q6Users.length} users with Q6:`);
    
    for (const user of q6Users) {
      const username = user._id;
      console.log(`\n👤 Processing user: ${username}`);
      
      // Check if they have the new purple config
      if (user.customGroupId && user.customGroupId.includes('1758142017627')) {
        console.log(`   ✅ Using new purple config: ${user.customGroupId}`);
        
        // Update README for this user
        try {
          const response = await axios.post('https://oss-michael-production.up.railway.app/api/group/68a770b8140b9c0174c13ce7/readme/batch-update', {
            usernames: [username],
            readmeContent: `# CS386 - Software Engineering

## Quest Progress

### Q6: A-4.2 Use Cases
**Status**: Active
**Description**: Learn about employing use cases to specify software requirements.

**Tasks**:
- T1: Student Names
- T2: Actors and Use Cases  
- T3: Actors for Systems
- T4: Use Cases
- T5: Restaurant Management System Requirements
- T6-T16: Additional Use Case Tasks

**Prerequisite**: Q5 (A-4.1 - SW Requirements Concepts)

---

*This README was automatically updated when Q6 was deployed.*`
          });
          
          if (response.data.success) {
            console.log(`   ✅ README updated successfully for ${username}`);
          } else {
            console.log(`   ❌ Failed to update README for ${username}: ${response.data.message}`);
          }
        } catch (error) {
          console.log(`   ❌ Error updating README for ${username}: ${error.message}`);
        }
      } else {
        console.log(`   ⚠️ User ${username} has Q6 but not using new purple config: ${user.customGroupId || 'No customGroupId'}`);
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`   - Total users with Q6: ${q6Users.length}`);
    console.log(`   - Users processed: ${q6Users.length}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await testClient.close();
  }
}

updateReadmeForQ6Users();


