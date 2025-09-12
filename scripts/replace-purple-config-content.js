import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/oss-doorway';

async function replacePurpleConfigContent() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('🔍 Connected to MongoDB, searching for configs...');
    
    const db = client.db();
    const questConfigsCollection = db.collection('questconfigs');
    
    // Step 1: Find the source config (with content we want)
    console.log('\n📋 Step 1: Finding source config (68a770b8140b9c0174c13ce8-with-q3)...');
    const sourceConfig = await questConfigsCollection.findOne({
      classId: '68a770b8140b9c0174c13ce8-with-q3'
    });
    
    if (!sourceConfig) {
      console.error('❌ Source config not found: 68a770b8140b9c0174c13ce8-with-q3');
      return;
    }
    
    console.log('✅ Found source config:');
    console.log(`   - ID: ${sourceConfig._id}`);
    console.log(`   - ClassId: ${sourceConfig.classId}`);
    console.log(`   - Created: ${sourceConfig.createdAt}`);
    
    // Analyze source config content
    const sourceQuests = Object.keys(sourceConfig.config).filter(k => k.startsWith('Q'));
    console.log(`   - Quests: ${sourceQuests.join(', ')}`);
    for (const quest of sourceQuests) {
      const tasks = Object.keys(sourceConfig.config[quest]).filter(k => k.startsWith('T'));
      console.log(`   - ${quest}: ${tasks.length} tasks (${tasks.join(', ')})`);
    }
    
    // Step 2: Find the target config (purple config we want to replace)
    console.log('\n🎯 Step 2: Finding target purple config (68a770b8140b9c0174c13ce7_purple_1756928031626)...');
    const targetConfig = await questConfigsCollection.findOne({
      classId: '68a770b8140b9c0174c13ce7_purple_1756928031626'
    });
    
    if (!targetConfig) {
      console.error('❌ Target purple config not found: 68a770b8140b9c0174c13ce7_purple_1756928031626');
      return;
    }
    
    console.log('✅ Found target purple config:');
    console.log(`   - ID: ${targetConfig._id}`);
    console.log(`   - ClassId: ${targetConfig.classId}`);
    console.log(`   - Created: ${targetConfig.createdAt}`);
    
    // Analyze target config content
    const targetQuests = Object.keys(targetConfig.config).filter(k => k.startsWith('Q'));
    console.log(`   - Current Quests: ${targetQuests.join(', ')}`);
    for (const quest of targetQuests) {
      const tasks = Object.keys(targetConfig.config[quest]).filter(k => k.startsWith('T'));
      console.log(`   - ${quest}: ${tasks.length} tasks (${tasks.join(', ')})`);
    }
    
    // Step 3: Confirm replacement
    console.log('\n🔄 Step 3: Preparing replacement...');
    console.log('This will:');
    console.log(`   - Keep purple config name: ${targetConfig.classId}`);
    console.log(`   - Replace content with: ${sourceConfig.classId} content`);
    console.log(`   - Preserve purple config metadata (ID, createdAt, etc.)`);
    
    // Create the updated config
    const updatedConfig = {
      ...targetConfig,
      config: sourceConfig.config, // Replace the config content
      updatedAt: new Date(),
      contentSourceFrom: sourceConfig.classId,
      originalContent: `Replaced content from ${sourceConfig.classId} on ${new Date().toISOString()}`
    };
    
    console.log('\n✅ Ready to replace. New config will have:');
    const newQuests = Object.keys(updatedConfig.config).filter(k => k.startsWith('Q'));
    console.log(`   - Quests: ${newQuests.join(', ')}`);
    for (const quest of newQuests) {
      if (updatedConfig.config[quest] && typeof updatedConfig.config[quest] === 'object') {
        const tasks = Object.keys(updatedConfig.config[quest]).filter(k => k.startsWith('T'));
        console.log(`   - ${quest}: ${tasks.length} tasks (${tasks.join(', ')})`);
      }
    }
    
    // Step 4: Perform the replacement
    console.log('\n🚀 Step 4: Performing replacement...');
    const result = await questConfigsCollection.replaceOne(
      { _id: targetConfig._id },
      updatedConfig
    );
    
    if (result.modifiedCount === 1) {
      console.log('✅ SUCCESS! Purple config content has been replaced.');
      console.log('🎉 All users will now get the preferred content from 68a770b8140b9c0174c13ce8-with-q3');
      console.log('📋 Summary:');
      console.log(`   - Purple config: ${targetConfig.classId} (unchanged name)`);
      console.log(`   - Content source: ${sourceConfig.classId}`);
      console.log(`   - New repos will automatically use this updated purple config`);
      console.log(`   - Existing repos using the purple config will get the new content`);
    } else {
      console.error('❌ Failed to update the purple config');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

// Run with confirmation
console.log('🔧 Purple Config Content Replacement Tool');
console.log('==========================================');
console.log('This will replace the content of the purple config with your preferred content.');
console.log('');

replacePurpleConfigContent();
