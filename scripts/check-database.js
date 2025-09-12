const { MongoClient } = require('mongodb');

const OSS_DOORWAY_URI = process.env.OSS_DOORWAY_DB_URI || 'mongodb+srv://cna93:gamification@gamification.nwes9ze.mongodb.net/?retryWrites=true&w=majority&appName=gamification';
const OSS_DOORWAY_DB_NAME = process.env.OSS_DOORWAY_DB_NAME || 'test';

async function checkDatabase() {
  const client = new MongoClient(OSS_DOORWAY_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to database');
    
    const db = client.db(OSS_DOORWAY_DB_NAME);
    
    // List all collections
    const collections = await db.listCollections().toArray();
    console.log('📋 Available collections:');
    collections.forEach(col => console.log(`   - ${col.name}`));
    
    // Check userstoreddata collection
    const userCount = await db.collection('userstoreddata').countDocuments();
    console.log(`\n👥 Users in userstoreddata: ${userCount}`);
    
    if (userCount > 0) {
      // Get a sample user to see the structure
      const sampleUser = await db.collection('userstoreddata').findOne({});
      console.log('\n📄 Sample user structure:');
      console.log(JSON.stringify(sampleUser, null, 2));
    }
    
    // Check other possible collections
    const possibleCollections = ['users', 'userdata', 'studentdata', 'gamification'];
    for (const colName of possibleCollections) {
      try {
        const count = await db.collection(colName).countDocuments();
        if (count > 0) {
          console.log(`\n👥 Users in ${colName}: ${count}`);
          const sample = await db.collection(colName).findOne({});
          console.log(`📄 Sample from ${colName}:`);
          console.log(JSON.stringify(sample, null, 2));
        }
      } catch (error) {
        // Collection doesn't exist
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
checkDatabase().catch(console.error);
