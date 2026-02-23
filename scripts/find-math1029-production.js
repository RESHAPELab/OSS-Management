const { MongoClient } = require('mongodb');

// Try production database
const PRODUCTION_URI = 'mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/?retryWrites=true&w=majority&appName=gamification';
const PRODUCTION_DB_NAME = 'gamification'; // Try production database name

async function findMath1029InProduction() {
  const client = new MongoClient(PRODUCTION_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to production database');
    
    const db = client.db(PRODUCTION_DB_NAME);
    
    // List all collections
    const collections = await db.listCollections().toArray();
    console.log('📋 Available collections in production:');
    collections.forEach(col => console.log(`   - ${col.name}`));
    
    // Search for Math1029 user in different collections
    const collectionsToCheck = ['users', 'userstoreddata', 'userstoreddatas', 'user_data', 'students'];
    
    for (const collectionName of collectionsToCheck) {
      try {
        const collection = db.collection(collectionName);
        const count = await collection.countDocuments();
        console.log(`\n📊 Collection ${collectionName}: ${count} documents`);
        
        if (count > 0) {
          // Search for Math1029
          const math1029User = await collection.findOne({
            username: /Math1029/i
          });
          
          if (math1029User) {
            console.log(`🎯 Found Math1029 in ${collectionName}:`);
            console.log(`   Username: ${math1029User.username}`);
            console.log(`   GitHub: ${math1029User.user_data?.github || math1029User.github || 'N/A'}`);
            console.log(`   CustomGroupId: ${math1029User.user_data?.customGroupId || math1029User.customGroupId || 'N/A'}`);
            
            const userData = math1029User.user_data || math1029User;
            console.log(`   Current: ${userData.current ? `${userData.current.quest}.${userData.current.task}` : 'null'}`);
            console.log(`   Points: ${userData.points || 0}`);
            
            // Check Q3 progress
            if (userData.accepted && userData.accepted.Q3) {
              const q3Tasks = Object.keys(userData.accepted.Q3);
              const completedQ3Tasks = q3Tasks.filter(task => userData.accepted.Q3[task]?.completed);
              
              console.log(`   Q3 Progress: ${completedQ3Tasks.length}/${q3Tasks.length} tasks completed`);
              console.log(`   Completed Q3 Tasks: ${completedQ3Tasks.join(', ')}`);
              
              // Check if T14 is completed and stuck
              if (userData.accepted.Q3.T14?.completed) {
                console.log(`   🔍 T14 COMPLETED - checking if stuck`);
                
                if (!userData.current || 
                    userData.current.quest !== 'Q3' || 
                    userData.current.task === 'T14' ||
                    !userData.accepted.Q3.T15) {
                  console.log(`   ❌ STUCK: Completed T14 but not on T15`);
                  console.log(`   Current task: ${userData.current ? `${userData.current.quest}.${userData.current.task}` : 'null'}`);
                  console.log(`   T15 accepted: ${userData.accepted.Q3.T15 ? 'Yes' : 'No'}`);
                } else {
                  console.log(`   ✅ Progressing correctly`);
                }
              }
            }
            
            // Also check for CS386 users in this collection
            const cs386Users = await collection.find({
              $or: [
                { 'user_data.customGroupId': { $regex: /cs386|software-engineering|68a770b8140b9c0174c13ce8/i } },
                { 'customGroupId': { $regex: /cs386|software-engineering|68a770b8140b9c0174c13ce8/i } }
              ]
            }).toArray();
            
            console.log(`\n🔍 Found ${cs386Users.length} CS386 users in ${collectionName}:`);
            cs386Users.forEach(user => {
              const userData = user.user_data || user;
              console.log(`   - ${user.username} (${userData.github || 'N/A'})`);
              console.log(`     Group: ${userData.customGroupId || 'N/A'}`);
              console.log(`     Current: ${userData.current ? `${userData.current.quest}.${userData.current.task}` : 'null'}`);
              
              // Check Q3 progress
              if (userData.accepted && userData.accepted.Q3) {
                const completedQ3Tasks = Object.keys(userData.accepted.Q3)
                  .filter(task => userData.accepted.Q3[task]?.completed);
                console.log(`     Q3 Completed: ${completedQ3Tasks.join(', ')}`);
                
                // Check for T14 completion
                if (userData.accepted.Q3.T14?.completed) {
                  console.log(`     🔍 T14 COMPLETED`);
                  if (!userData.current || userData.current.task === 'T14' || !userData.accepted.Q3.T15) {
                    console.log(`     ❌ STUCK: Not progressing to T15`);
                  }
                }
              }
            });
          }
        }
      } catch (error) {
        console.log(`   ⚠️ Error checking ${collectionName}: ${error.message}`);
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
findMath1029InProduction().catch(console.error);
