// check-purple-config-content.js
// Verify the purple config content after migration

const { MongoClient } = require('mongodb');

async function main() {
  const targetPurpleConfigId = '68a770b8140b9c0174c13ce7_purple_1756928031626';
  
  const ossDoorwayUri = process.env.OSS_DOORWAY_DB_URI || 'mongodb+srv://cna93:gamification@gamification.nwes9ze.mongodb.net/?retryWrites=true&w=majority&appName=gamification';
  const ossDoorwayDbName = process.env.OSS_DOORWAY_DB_NAME || 'test';

  let client;
  try {
    client = new MongoClient(ossDoorwayUri);
    await client.connect();
    const db = client.db(ossDoorwayDbName);

    const questConfigsCol = db.collection('questconfigs');

    console.log('🔍 CHECKING PURPLE CONFIG CONTENT');
    console.log('=' .repeat(50));

    // Get the purple config
    const purpleConfig = await questConfigsCol.findOne({ classId: targetPurpleConfigId });
    
    if (!purpleConfig) {
      console.error('❌ Purple config not found:', targetPurpleConfigId);
      return;
    }

    console.log('✅ Purple config found:');
    console.log('  - Config ID:', purpleConfig.classId);
    console.log('  - Created:', purpleConfig.createdAt);
    console.log('  - Updated:', purpleConfig.updatedAt);
    console.log('  - Migrated from:', purpleConfig.migratedFrom);

    // Check the config structure
    console.log('\n📋 Config structure:');
    if (purpleConfig.config) {
      const allKeys = Object.keys(purpleConfig.config);
      const questKeys = allKeys.filter(k => k.startsWith('Q'));
      const otherKeys = allKeys.filter(k => !k.startsWith('Q'));
      
      console.log('  - All keys:', allKeys);
      console.log('  - Quest keys:', questKeys);
      console.log('  - Other keys:', otherKeys);

      // Show quest details
      for (const questKey of questKeys) {
        const quest = purpleConfig.config[questKey];
        if (quest && typeof quest === 'object') {
          const taskKeys = Object.keys(quest).filter(k => k !== 'metadata');
          console.log(`  - ${questKey}: ${taskKeys.length} tasks [${taskKeys.join(', ')}]`);
          
          if (quest.metadata) {
            console.log(`    Metadata: ${JSON.stringify(quest.metadata)}`);
          }
        }
      }
    } else {
      console.log('  - No config field found!');
    }

    // Check questSequence if it exists
    if (purpleConfig.questSequence) {
      console.log('\n📝 Quest sequence:');
      console.log('  - Length:', purpleConfig.questSequence.length);
      purpleConfig.questSequence.forEach((quest, index) => {
        console.log(`  - ${index}: ${quest.questId || quest.metadata?.questId || 'Unknown'}`);
      });
    } else {
      console.log('\n📝 No questSequence field');
    }

    // Compare with source config
    console.log('\n🔍 Comparing with source config...');
    const sourceConfig = await questConfigsCol.findOne({ 
      classId: '68a770b8140b9c0174c13ce8-with-q3' 
    });
    
    if (sourceConfig) {
      const sourceQuestKeys = sourceConfig?.config ? Object.keys(sourceConfig.config).filter(k => k.startsWith('Q')) : [];
      console.log('✅ Source config (-with-q3):');
      console.log('  - Quest keys:', sourceQuestKeys);
      
      // Check if content is identical
      const contentMatch = JSON.stringify(purpleConfig.config) === JSON.stringify(sourceConfig.config);
      console.log('  - Content matches purple config:', contentMatch);
      
      if (!contentMatch) {
        console.log('⚠️ Content differences detected!');
        console.log('Purple config quests:', Object.keys(purpleConfig.config || {}).filter(k => k.startsWith('Q')));
        console.log('Source config quests:', Object.keys(sourceConfig.config || {}).filter(k => k.startsWith('Q')));
      }
    } else {
      console.log('❌ Source config not found');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (client) await client.close();
  }
}

main();
