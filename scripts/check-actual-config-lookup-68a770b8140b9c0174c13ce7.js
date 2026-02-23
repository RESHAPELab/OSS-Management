// check-actual-config-lookup-68a770b8140b9c0174c13ce7.js
// Script to check how OSS-Doorway ACTUALLY looks up configs for task validation
// This matches the exact query used in ConfigService.loadConfigFromDatabase()

const { MongoClient } = require('mongodb');

const CLASS_ID = '68a770b8140b9c0174c13ce7';
const OSS_DOORWAY_URI = process.env.OSS_DOORWAY_URI || 'mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/?retryWrites=true&w=majority&appName=gamification';

async function checkActualConfigLookup() {
  console.log(`🔍 Checking ACTUAL config lookup for class: ${CLASS_ID}`);
  console.log(`🌐 Class URL: https://ossdoorway.vercel.app/class/${CLASS_ID}`);
  console.log('=' .repeat(80));

  const client = new MongoClient(OSS_DOORWAY_URI);

  try {
    await client.connect();
    console.log('✅ Connected to OSS-Doorway database');
    
    const db = client.db('test');
    const questConfigsCollection = db.collection('questconfigs');

    // This is the EXACT query that OSS-Doorway uses in ConfigService.loadConfigFromDatabase()
    console.log('\n📋 EXACT OSS-Doorway Query (from ConfigService):');
    console.log('-'.repeat(50));
    console.log('QuestConfig.findOne({');
    console.log('  $or: [');
    console.log('    { groupId: groupId },');
    console.log('    { configId: groupId },');
    console.log('    { classId: groupId }');
    console.log('  ]');
    console.log('});');
    console.log('');
    console.log(`With groupId = "${CLASS_ID}"`);
    
    // Execute the exact query
    const config = await questConfigsCollection.findOne({
      $or: [
        { groupId: CLASS_ID },
        { configId: CLASS_ID },
        { classId: CLASS_ID }
      ]
    });

    if (config) {
      console.log('\n✅ CONFIG FOUND (this is what OSS-Doorway will use):');
      console.log(`   - ID: ${config._id}`);
      console.log(`   - classId: ${config.classId}`);
      console.log(`   - groupId: ${config.groupId}`);
      console.log(`   - configId: ${config.configId}`);
      console.log(`   - Created: ${config.createdAt}`);
      console.log(`   - Updated: ${config.updatedAt}`);
      
      // Show quest content
      if (config.config) {
        const quests = Object.keys(config.config).filter(k => k.startsWith('Q'));
        console.log(`   - Quests: ${quests.join(', ')}`);
        
        // Show task counts for first few quests
        for (const quest of quests.slice(0, 3)) {
          if (config.config[quest] && typeof config.config[quest] === 'object') {
            const tasks = Object.keys(config.config[quest]).filter(k => k.startsWith('T'));
            console.log(`   - ${quest}: ${tasks.length} tasks`);
          }
        }
        if (quests.length > 3) {
          console.log(`   - ... and ${quests.length - 3} more quests`);
        }
      }
      
      console.log('\n🎯 THIS IS THE CONFIG THAT WILL BE USED FOR TASK VALIDATION');
      
    } else {
      console.log('\n❌ NO CONFIG FOUND');
      console.log('OSS-Doorway will fall back to default config or file-based config');
    }

    // Show ALL configs for this class to understand the selection
    console.log('\n📚 ALL CONFIGS FOR THIS CLASS (for reference):');
    console.log('-'.repeat(50));
    
    const allConfigs = await questConfigsCollection.find({
      $or: [
        { groupId: CLASS_ID },
        { configId: CLASS_ID },
        { classId: CLASS_ID }
      ]
    }).sort({ createdAt: -1 }).toArray();

    if (allConfigs.length > 0) {
      console.log(`Found ${allConfigs.length} total configs:`);
      
      for (let i = 0; i < allConfigs.length; i++) {
        const cfg = allConfigs[i];
        const isSelected = cfg._id === config?._id;
        
        console.log(`\n📝 Config ${i + 1}: ${cfg.classId || cfg.configId || cfg.groupId}`);
        console.log(`   - ID: ${cfg._id}`);
        console.log(`   - Created: ${cfg.createdAt}`);
        console.log(`   - Is Purple: ${cfg.classId?.includes('_purple_') || false}`);
        console.log(`   - Is Selected: ${isSelected ? '⭐ YES' : '❌ NO'}`);
        
        if (cfg.config) {
          const quests = Object.keys(cfg.config).filter(k => k.startsWith('Q'));
          console.log(`   - Quests: ${quests.join(', ')}`);
        }
      }
      
      console.log('\n⚠️ IMPORTANT: OSS-Doorway uses findOne() WITHOUT sorting!');
      console.log('This means it returns the FIRST match it finds, not necessarily the latest.');
      console.log('The order depends on MongoDB\'s internal storage order.');
      
    } else {
      console.log('❌ No configs found for this class');
    }

    // Check what happens with purple configs specifically
    console.log('\n🟣 PURPLE CONFIG ANALYSIS:');
    console.log('-'.repeat(50));
    
    const purpleConfigs = await questConfigsCollection.find({
      $or: [
        { groupId: { $regex: new RegExp(`^${CLASS_ID}_purple_`) } },
        { configId: { $regex: new RegExp(`^${CLASS_ID}_purple_`) } },
        { classId: { $regex: new RegExp(`^${CLASS_ID}_purple_`) } }
      ]
    }).sort({ createdAt: -1 }).toArray();

    if (purpleConfigs.length > 0) {
      console.log(`Found ${purpleConfigs.length} purple configs:`);
      
      for (const purpleConfig of purpleConfigs) {
        console.log(`   - ${purpleConfig.classId || purpleConfig.configId || purpleConfig.groupId}`);
        console.log(`     Created: ${purpleConfig.createdAt}`);
        console.log(`     ID: ${purpleConfig._id}`);
      }
      
      const latestPurple = purpleConfigs[0];
      console.log(`\n🏆 Latest Purple Config: ${latestPurple.classId || latestPurple.configId || latestPurple.groupId}`);
      
      // Check if this purple config would be selected by the findOne query
      const wouldBeSelected = await questConfigsCollection.findOne({
        $or: [
          { groupId: latestPurple.classId || latestPurple.configId || latestPurple.groupId },
          { configId: latestPurple.classId || latestPurple.configId || latestPurple.groupId },
          { classId: latestPurple.classId || latestPurple.configId || latestPurple.groupId }
        ]
      });
      
      if (wouldBeSelected && wouldBeSelected._id === latestPurple._id) {
        console.log('✅ This purple config WOULD be selected by findOne()');
      } else {
        console.log('❌ This purple config would NOT be selected by findOne()');
        console.log('   (Another config with the same classId exists)');
      }
      
    } else {
      console.log('❌ No purple configs found');
    }

    // Summary
    console.log('\n📊 SUMMARY:');
    console.log('-'.repeat(50));
    console.log(`Class ID: ${CLASS_ID}`);
    console.log(`Config Selected by OSS-Doorway: ${config ? (config.classId || config.configId || config.groupId) : 'NONE'}`);
    console.log(`Config ID: ${config ? config._id : 'N/A'}`);
    console.log(`Created: ${config ? config.createdAt : 'N/A'}`);
    
    if (config) {
      console.log('\n🎯 TO UPDATE QUEST CONTENT:');
      console.log(`   Modify the config with ID: ${config._id}`);
      console.log(`   This is the config that OSS-Doorway will use for task validation`);
    } else {
      console.log('\n⚠️ NO CONFIG FOUND:');
      console.log('   OSS-Doorway will use fallback logic (default config or file-based)');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  } finally {
    await client.close();
    console.log('\n✅ Disconnected from database');
  }
}

// Run the script
checkActualConfigLookup().catch(console.error);
