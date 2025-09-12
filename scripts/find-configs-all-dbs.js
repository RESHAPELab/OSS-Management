import { MongoClient } from 'mongodb';

// Try different MongoDB URIs that might be used
const MONGODB_URIS = [
  process.env.MONGODB_URI || 'mongodb://localhost:27017/oss-doorway',
  'mongodb://localhost:27017/oss-management',
  'mongodb://localhost:27017/oss',
  process.env.OSS_DOORWAY_MONGODB_URI,
  process.env.OSS_MANAGEMENT_MONGODB_URI
].filter(Boolean);

async function findConfigsInAllDbs() {
  for (const uri of MONGODB_URIS) {
    console.log(`\n🔍 Checking database: ${uri}`);
    console.log('=' .repeat(60));
    
    const client = new MongoClient(uri);
    
    try {
      await client.connect();
      
      const db = client.db();
      
      // List all collections
      const collections = await db.listCollections().toArray();
      console.log(`📋 Collections: ${collections.map(c => c.name).join(', ')}`);
      
      // Check questconfigs collection if it exists
      if (collections.some(c => c.name === 'questconfigs')) {
        const questConfigsCollection = db.collection('questconfigs');
        const count = await questConfigsCollection.countDocuments();
        console.log(`🔧 questconfigs collection: ${count} documents`);
        
        if (count > 0) {
          // Get a sample of configs
          const sampleConfigs = await questConfigsCollection.find({}).limit(5).toArray();
          
          console.log('📝 Sample configs:');
          for (const config of sampleConfigs) {
            console.log(`   - ${config.classId || config._id} (created: ${config.createdAt})`);
            
            // Check if this looks like our CS386 configs
            if (config.classId && config.classId.includes('68a770b8140b9c0174c13ce')) {
              console.log(`   ⭐ FOUND CS386 CONFIG: ${config.classId}`);
              
              if (config.config) {
                const quests = Object.keys(config.config).filter(k => k.startsWith('Q'));
                console.log(`      - Quests: ${quests.join(', ')}`);
              }
            }
          }
          
          // Search specifically for our configs
          const cs386Configs = await questConfigsCollection.find({
            classId: { $regex: '68a770b8140b9c0174c13ce', $options: 'i' }
          }).toArray();
          
          if (cs386Configs.length > 0) {
            console.log(`\n🎯 Found ${cs386Configs.length} CS386 configs in this database:`);
            for (const config of cs386Configs) {
              console.log(`   - ${config.classId}`);
              if (config.config) {
                const quests = Object.keys(config.config).filter(k => k.startsWith('Q'));
                console.log(`     Quests: ${quests.join(', ')}`);
              }
            }
          }
        }
      }
      
    } catch (error) {
      console.log(`❌ Error connecting to ${uri}: ${error.message}`);
    } finally {
      await client.close();
    }
  }
}

console.log('🔍 Searching for quest configs in all possible databases...');
findConfigsInAllDbs();
