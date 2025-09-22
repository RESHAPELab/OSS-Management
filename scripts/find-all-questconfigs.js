import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/oss-doorway';

async function findAllQuestConfigs() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('🔍 Connected to MongoDB');
    
    const db = client.db();
    
    // List all collections first
    const collections = await db.listCollections().toArray();
    console.log('\n📋 Available collections:');
    collections.forEach(col => console.log(`   - ${col.name}`));
    
    // Try questconfigs collection
    const questConfigsCollection = db.collection('questconfigs');
    const allConfigs = await questConfigsCollection.find({}).limit(20).toArray();
    
    console.log(`\n🔧 Found ${allConfigs.length} quest configs (showing first 20):`);
    console.log('=' .repeat(80));
    
    for (const config of allConfigs) {
      console.log(`\n📝 Config: ${config.classId || config._id}`);
      console.log(`   - ID: ${config._id}`);
      console.log(`   - Created: ${config.createdAt}`);
      
      if (config.config) {
        const quests = Object.keys(config.config).filter(k => k.startsWith('Q'));
        console.log(`   - Quests: ${quests.join(', ')}`);
      }
      
      // Look for configs that might match what we want
      if (config.classId && (
        config.classId.includes('68a770b8140b9c0174c13ce7') ||
        config.classId.includes('68a770b8140b9c0174c13ce8') ||
        config.classId.includes('purple') ||
        config.classId.includes('with-q3')
      )) {
        console.log(`   ⭐ POTENTIAL MATCH for CS386!`);
      }
    }
    
    // Also search for any config with "purple" in the name
    const purpleConfigs = await questConfigsCollection.find({
      classId: { $regex: 'purple', $options: 'i' }
    }).toArray();
    
    console.log(`\n🟣 Purple configs found: ${purpleConfigs.length}`);
    for (const config of purpleConfigs) {
      console.log(`   - ${config.classId}`);
    }
    
    // Search for configs with "q3" in the name
    const q3Configs = await questConfigsCollection.find({
      classId: { $regex: 'q3', $options: 'i' }
    }).toArray();
    
    console.log(`\n🎯 Q3 configs found: ${q3Configs.length}`);
    for (const config of q3Configs) {
      console.log(`   - ${config.classId}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

findAllQuestConfigs();




