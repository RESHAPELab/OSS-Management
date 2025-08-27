const { MongoClient } = require('mongodb');

const managementURI = 'mongodb+srv://jadyn:290794@gamification.nwes9ze.mongodb.net/management?retryWrites=true&w=majority&appName=gamification';
const managementDBName = 'gamification-management';

async function listClasses() {
  console.log(`🔍 [LIST-CLASSES] Finding all classes in management database...`);
  
  const client = new MongoClient(managementURI);
  
  try {
    await client.connect();
    const db = client.db(managementDBName);
    
    const classes = await db.collection('groups').find({}).toArray();
    
    console.log(`📚 Found ${classes.length} classes:`);
    console.log(`---`);
    
    classes.forEach((cls, index) => {
      console.log(`${index + 1}. Class ID: ${cls._id}`);
      console.log(`   Name: ${cls.name || 'No name'}`);
      console.log(`   Students: ${cls.users?.length || 0}`);
      console.log(`   Created: ${cls.createdAt ? new Date(cls.createdAt).toLocaleDateString() : 'Unknown'}`);
      console.log(`---`);
    });
    
    if (classes.length === 0) {
      console.log(`❌ No classes found in database`);
    }
    
  } catch (error) {
    console.error(`❌ Error listing classes:`, error);
  } finally {
    await client.close();
  }
}

listClasses()
  .then(() => {
    console.log('✅ Class listing complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
