const { MongoClient } = require('mongodb');

const PRODUCTION_URI = 'mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/?retryWrites=true&w=majority&appName=gamification';
const PRODUCTION_DB_NAME = 'gamification';

async function checkUserStoredData() {
  const client = new MongoClient(PRODUCTION_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to production database');
    
    const db = client.db(PRODUCTION_DB_NAME);
    const collection = db.collection('userstoreddata');
    
    // Get all documents
    const allDocs = await collection.find({}).toArray();
    console.log(`📊 Found ${allDocs.length} documents in userstoreddata:`);
    
    for (const doc of allDocs) {
      console.log(`\n📄 Document ID: ${doc._id}`);
      console.log(`   Keys: ${Object.keys(doc).join(', ')}`);
      
      if (doc.user_data) {
        const userData = doc.user_data;
        console.log(`   Username: ${userData.username || 'N/A'}`);
        console.log(`   GitHub: ${userData.github || 'N/A'}`);
        console.log(`   CustomGroupId: ${userData.customGroupId || 'N/A'}`);
        console.log(`   Current: ${userData.current ? `${userData.current.quest}.${userData.current.task}` : 'null'}`);
        console.log(`   Points: ${userData.points || 0}`);
        
        // Check Q3 progress
        if (userData.accepted && userData.accepted.Q3) {
          const completedQ3Tasks = Object.keys(userData.accepted.Q3)
            .filter(task => userData.accepted.Q3[task]?.completed);
          console.log(`   Q3 Completed: ${completedQ3Tasks.join(', ')}`);
          
          // Check for T14 completion
          if (userData.accepted.Q3.T14?.completed) {
            console.log(`   🔍 T14 COMPLETED`);
            if (!userData.current || userData.current.task === 'T14' || !userData.accepted.Q3.T15) {
              console.log(`   ❌ STUCK: Not progressing to T15`);
            }
          }
        }
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
checkUserStoredData().catch(console.error);
