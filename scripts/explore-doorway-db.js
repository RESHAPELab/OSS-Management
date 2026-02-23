import { MongoClient } from 'mongodb';

const DOORWAY_URI = "mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/oss-doorway?retryWrites=true&w=majority&appName=gamification";

async function exploreDoorwayDatabase() {
  console.log('🔍 Exploring OSS-Doorway database collections...');
  
  const doorwayClient = new MongoClient(DOORWAY_URI);
  
  try {
    await doorwayClient.connect();
    const doorwayDb = doorwayClient.db('oss-doorway');
    
    // List all collections
    const collections = await doorwayDb.listCollections().toArray();
    console.log(`\n📁 Found ${collections.length} collections:`);
    for (const collection of collections) {
      console.log(`   - ${collection.name}`);
    }
    
    // Check each collection for the purple config
    for (const collection of collections) {
      const coll = doorwayDb.collection(collection.name);
      const count = await coll.countDocuments();
      console.log(`\n🔍 Collection: ${collection.name} (${count} documents)`);
      
      if (count > 0) {
        // Search for purple config in this collection
        const purpleDocs = await coll.find({
          $or: [
            { classId: { $regex: 'purple', $options: 'i' } },
            { configId: { $regex: 'purple', $options: 'i' } },
            { groupId: { $regex: 'purple', $options: 'i' } },
            { _id: { $regex: 'purple', $options: 'i' } },
            { 'config.classId': { $regex: 'purple', $options: 'i' } },
            { 'config.configId': { $regex: 'purple', $options: 'i' } },
            { 'config.groupId': { $regex: 'purple', $options: 'i' } }
          ]
        }).toArray();
        
        if (purpleDocs.length > 0) {
          console.log(`   ✅ Found ${purpleDocs.length} purple configs:`);
          for (const doc of purpleDocs) {
            console.log(`      - ID: ${doc._id}`);
            console.log(`      - ClassId: ${doc.classId || 'N/A'}`);
            console.log(`      - ConfigId: ${doc.configId || 'N/A'}`);
            console.log(`      - GroupId: ${doc.groupId || 'N/A'}`);
            if (doc.config && doc.config.classId) {
              console.log(`      - Config.ClassId: ${doc.config.classId}`);
            }
          }
        } else {
          console.log(`   ❌ No purple configs found`);
        }
        
        // Also search for the specific timestamp
        const timestampDocs = await coll.find({
          $or: [
            { classId: { $regex: '1757967107200', $options: 'i' } },
            { configId: { $regex: '1757967107200', $options: 'i' } },
            { groupId: { $regex: '1757967107200', $options: 'i' } },
            { _id: { $regex: '1757967107200', $options: 'i' } }
          ]
        }).toArray();
        
        if (timestampDocs.length > 0) {
          console.log(`   ✅ Found ${timestampDocs.length} configs with timestamp 1757967107200:`);
          for (const doc of timestampDocs) {
            console.log(`      - ID: ${doc._id}`);
            console.log(`      - ClassId: ${doc.classId || 'N/A'}`);
            console.log(`      - ConfigId: ${doc.configId || 'N/A'}`);
            console.log(`      - GroupId: ${doc.groupId || 'N/A'}`);
          }
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await doorwayClient.close();
  }
}

exploreDoorwayDatabase();



