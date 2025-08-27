const { MongoClient } = require('mongodb');

const ossDoorwayURI = 'mongodb+srv://cna93:gamification@gamification.nwes9ze.mongodb.net/?retryWrites=true&w=majority&appName=gamification';
const ossDoorwayDBName = 'test';

async function checkOSSData() {
  console.log(`🔍 [OSS-DATA] Checking OSS-Doorway database for quest configs and students...`);
  
  const client = new MongoClient(ossDoorwayURI);
  
  try {
    await client.connect();
    const db = client.db(ossDoorwayDBName);
    
    // Check quest configs
    console.log(`📋 Checking quest configs...`);
    const questConfigs = await db.collection('questconfigs').find({}).toArray();
    console.log(`   Found ${questConfigs.length} quest configs:`);
    
    questConfigs.forEach((config, index) => {
      console.log(`   ${index + 1}. groupId: ${config.groupId || 'N/A'}`);
      console.log(`      configId: ${config.configId || 'N/A'}`);
      console.log(`      classId: ${config.classId || 'N/A'}`);
      console.log(`      has configData: ${!!config.configData}`);
      console.log(`      created: ${config.createdAt ? new Date(config.createdAt).toLocaleDateString() : 'Unknown'}`);
      console.log(`      ---`);
    });
    
    // Check user data
    console.log(`👥 Checking user data...`);
    const userData = await db.collection('user_data').find({}).toArray();
    console.log(`   Found ${userData.length} user records:`);
    
    // Group by customGroupId to see patterns
    const groupStats = {};
    userData.forEach(user => {
      const groupId = user.user_data?.customGroupId || 'no-group';
      if (!groupStats[groupId]) {
        groupStats[groupId] = 0;
      }
      groupStats[groupId]++;
    });
    
    console.log(`   Users by group:`);
    Object.entries(groupStats).forEach(([groupId, count]) => {
      console.log(`      ${groupId}: ${count} users`);
    });
    
    // Look for students with the specific class ID pattern
    console.log(`🔍 Looking for students with class ID: 68ab703e6ceb965e0759df11...`);
    const targetStudents = userData.filter(user => 
      user.user_data?.customGroupId === '68ab703e6ceb965e0759df11'
    );
    
    if (targetStudents.length > 0) {
      console.log(`   ✅ Found ${targetStudents.length} students with this class ID:`);
      targetStudents.forEach((student, index) => {
        const username = student._id || student.user_data?.username || 'unknown';
        console.log(`      ${index + 1}. ${username}`);
        console.log(`         Accepted: ${Object.keys(student.user_data?.accepted || {}).length} quests`);
        console.log(`         Completed: ${Object.keys(student.user_data?.completed || {}).length} quests`);
        console.log(`         Current: ${student.user_data?.current?.quest || 'None'}`);
      });
    } else {
      console.log(`   ❌ No students found with class ID: 68ab703e6ceb965e0759df11`);
      
      // Look for similar patterns
      console.log(`🔍 Looking for similar class IDs...`);
      const similarIds = Object.keys(groupStats).filter(id => 
        id.startsWith('68') && id.length === 24
      );
      
      if (similarIds.length > 0) {
        console.log(`   Found similar class IDs:`);
        similarIds.forEach(id => {
          console.log(`      ${id}: ${groupStats[id]} users`);
        });
      }
    }
    
  } catch (error) {
    console.error(`❌ Error checking OSS data:`, error);
  } finally {
    await client.close();
  }
}

checkOSSData()
  .then(() => {
    console.log('✅ OSS data check complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
