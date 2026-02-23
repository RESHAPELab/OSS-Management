import { MongoClient } from 'mongodb';

const DOORWAY_URI = "mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/?retryWrites=true&w=majority&appName=gamification";

async function checkAllUserCollections() {
  console.log('🔍 Checking all collections for CocoCrispy95 and any CS386 users...');
  
  const doorwayClient = new MongoClient(DOORWAY_URI);
  
  try {
    await doorwayClient.connect();
    const doorwayDb = doorwayClient.db('gamification');
    
    const collections = await doorwayDb.listCollections().toArray();
    console.log(`\nFound ${collections.length} collections: ${collections.map(c => c.name).join(', ')}`);
    
    for (const collectionInfo of collections) {
      const collectionName = collectionInfo.name;
      console.log(`\n📋 Checking collection: ${collectionName}`);
      
      try {
        const collection = doorwayDb.collection(collectionName);
        
        // Get total count
        const totalCount = await collection.countDocuments();
        console.log(`   Total documents: ${totalCount}`);
        
        if (totalCount > 0 && totalCount < 1000) { // Only check collections with reasonable size
          // Search for CocoCrispy95 specifically
          const cocoResults = await collection.find({
            $or: [
              { _id: { $regex: 'CocoCrispy95', $options: 'i' } },
              { github: { $regex: 'CocoCrispy95', $options: 'i' } },
              { username: { $regex: 'CocoCrispy95', $options: 'i' } },
              { 'user_data.github': { $regex: 'CocoCrispy95', $options: 'i' } }
            ]
          }).toArray();
          
          if (cocoResults.length > 0) {
            console.log(`   ✅ Found ${cocoResults.length} CocoCrispy95 records:`);
            for (const result of cocoResults) {
              console.log(`      - ID: ${result._id}`);
              console.log(`      - GitHub: ${result.github || result.user_data?.github || 'N/A'}`);
              console.log(`      - customGroupId: ${result.customGroupId || result.user_data?.customGroupId || 'N/A'}`);
              console.log(`      - Fields: ${Object.keys(result).slice(0, 10).join(', ')}`);
            }
          }
          
          // Search for any CS386 related users
          const cs386Results = await collection.find({
            $or: [
              { _id: { $regex: 'cs386', $options: 'i' } },
              { github: { $regex: 'cs386', $options: 'i' } },
              { customGroupId: { $regex: '68a770b8140b9c0174c13ce', $options: 'i' } },
              { 'user_data.customGroupId': { $regex: '68a770b8140b9c0174c13ce', $options: 'i' } }
            ]
          }).limit(5).toArray();
          
          if (cs386Results.length > 0) {
            console.log(`   🎯 Found ${cs386Results.length} CS386 related records (showing first 5):`);
            for (const result of cs386Results) {
              console.log(`      - ID: ${result._id}`);
              console.log(`      - GitHub: ${result.github || result.user_data?.github || 'N/A'}`);
              console.log(`      - customGroupId: ${result.customGroupId || result.user_data?.customGroupId || 'N/A'}`);
            }
          }
          
          // If this is a small collection, show some sample data
          if (totalCount <= 10) {
            const samples = await collection.find({}).limit(3).toArray();
            console.log(`   📝 Sample documents (first 3):`);
            for (const sample of samples) {
              console.log(`      - ID: ${sample._id}, Fields: ${Object.keys(sample).join(', ')}`);
            }
          }
        } else if (totalCount >= 1000) {
          console.log(`   ⚠️ Large collection (${totalCount} docs), skipping full search`);
          
          // Just check for CocoCrispy95 specifically
          const cocoResult = await collection.findOne({
            $or: [
              { _id: 'CocoCrispy95-cs386-software-engineering' },
              { github: 'CocoCrispy95' }
            ]
          });
          
          if (cocoResult) {
            console.log(`   ✅ Found CocoCrispy95 in large collection`);
            console.log(`      - ID: ${cocoResult._id}`);
            console.log(`      - customGroupId: ${cocoResult.customGroupId || cocoResult.user_data?.customGroupId || 'N/A'}`);
          }
        }
        
      } catch (error) {
        console.log(`   ❌ Error checking ${collectionName}: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await doorwayClient.close();
  }
}

checkAllUserCollections();





