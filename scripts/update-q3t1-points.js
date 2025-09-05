const { MongoClient } = require('mongodb');

// MongoDB connection
const OSS_DOORWAY_URI = process.env.OSS_DOORWAY_DB_URI || 'mongodb+srv://cna93:gamification@gamification.nwes9ze.mongodb.net/?retryWrites=true&w=majority&appName=gamification';
const OSS_DOORWAY_DB_NAME = process.env.OSS_DOORWAY_DB_NAME || 'test';

async function updateQ3T1Points() {
  console.log('🚀 Starting to update Q3T1 points from 1 to 0 in all quest configurations');
  
  const client = new MongoClient(OSS_DOORWAY_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(OSS_DOORWAY_DB_NAME);
    const questConfigsCollection = db.collection('questconfigs');
    
    // Find all quest configurations that have Q3 with T1
    const configs = await questConfigsCollection.find({
      'config.Q3.T1': { $exists: true }
    }).toArray();
    
    console.log(`📋 Found ${configs.length} quest configurations with Q3T1`);
    
    let updatedCount = 0;
    let errorCount = 0;
    
    for (const config of configs) {
      try {
        // Check if Q3T1 currently has 1 point
        if (config.config.Q3.T1.points === 1) {
          // Update Q3T1 points from 1 to 0
          const result = await questConfigsCollection.updateOne(
            { _id: config._id },
            { 
              $set: { 
                'config.Q3.T1.points': 0,
                'config.Q3.T1.xp': 0,
                updatedAt: new Date()
              }
            }
          );
          
          if (result.modifiedCount > 0) {
            console.log(`✅ Updated Q3T1 points to 0 in config: ${config.configId || config._id}`);
            updatedCount++;
          } else {
            console.log(`⚠️  No changes made to config: ${config.configId || config._id}`);
          }
        } else {
          console.log(`ℹ️  Q3T1 already has ${config.config.Q3.T1.points} points in config: ${config.configId || config._id}`);
        }
        
      } catch (error) {
        console.error(`❌ Error updating config ${config.configId || config._id}:`, error.message);
        errorCount++;
      }
    }
    
    console.log('');
    console.log('📊 Summary:');
    console.log(`   ✅ Successfully updated: ${updatedCount} configurations`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📋 Total processed: ${configs.length}`);
    
    if (updatedCount > 0) {
      console.log('');
      console.log('🎉 Q3T1 points have been updated to 0 in all quest configurations!');
      console.log('💡 The bot cache may need to be cleared with /cache clear-all');
    }
    
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

updateQ3T1Points();
