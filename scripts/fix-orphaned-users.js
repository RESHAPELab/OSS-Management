const { MongoClient } = require('mongodb');

const OSS_DOORWAY_URI = process.env.OSS_DOORWAY_DB_URI || 'mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/?retryWrites=true&w=majority&appName=gamification';
const OSS_DOORWAY_DB_NAME = process.env.OSS_DOORWAY_DB_NAME || 'test';

async function fixOrphanedUsers() {
  const client = new MongoClient(OSS_DOORWAY_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to database');
    
    const db = client.db(OSS_DOORWAY_DB_NAME);
    
    // Get all users
    const users = await db.collection('users').find({}).toArray();
    console.log(`📊 Found ${users.length} users to check`);
    
    // Find a good config with Q1, Q2, Q3 to use as template
    const goodConfig = await db.collection('questconfigs').findOne({
      configId: '68a770b8140b9c0174c13ce8-with-q3'
    });
    
    if (!goodConfig) {
      console.log('❌ No good config found to use as template');
      return;
    }
    
    console.log(`📋 Using config ${goodConfig.configId} as template`);
    
    let fixedCount = 0;
    let skippedCount = 0;
    
    for (const user of users) {
      const userData = user.user_data;
      console.log(`\n👤 Checking user: ${user.username}`);
      console.log(`   CustomGroupId: ${userData.customGroupId}`);
      
      // Check if user's config exists
      const userConfig = await db.collection('questconfigs').findOne({
        configId: userData.customGroupId
      });
      
      if (!userConfig) {
        console.log(`   🔧 User's config doesn't exist - creating new one`);
        
        // Create a new config for this user based on the template
        const newConfigId = `user-${user.username}-${Date.now()}`;
        const newConfig = {
          ...goodConfig,
          _id: undefined,
          configId: newConfigId,
          classId: newConfigId,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        // Insert the new config
        await db.collection('questconfigs').insertOne(newConfig);
        console.log(`   ✅ Created new config: ${newConfigId}`);
        
        // Update user's customGroupId
        userData.customGroupId = newConfigId;
        
        // Set user to start from Q1.T1 if they have no progress
        if (!userData.current && !userData.accepted) {
          userData.current = { quest: 'Q1', task: 'T1' };
          console.log(`   ✅ Started user at Q1.T1`);
        }
        
        // Update user document
        await db.collection('users').updateOne(
          { _id: user._id },
          { $set: { user_data: userData } }
        );
        
        fixedCount++;
      } else {
        console.log(`   ✅ User's config exists`);
        
        // Check if user needs to resume
        if (!userData.current && !userData.accepted) {
          console.log(`   🔧 User has no progress - starting from Q1.T1`);
          userData.current = { quest: 'Q1', task: 'T1' };
          
          await db.collection('users').updateOne(
            { _id: user._id },
            { $set: { user_data: userData } }
          );
          
          fixedCount++;
        } else {
          skippedCount++;
        }
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`   Fixed: ${fixedCount} users`);
    console.log(`   Skipped: ${skippedCount} users`);
    console.log(`   Total: ${users.length} users`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the script
fixOrphanedUsers().catch(console.error);
