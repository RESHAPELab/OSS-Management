// mirror-oss-management-config-selection.js
// Script that mirrors exactly how OSS-Management selects configs for:
// 1. New repo creation
// 2. Purple deploy

const { MongoClient } = require('mongodb');

const CLASS_ID = '68a770b8140b9c0174c13ce7';
const MANAGEMENT_URI = process.env.MANAGEMENT_URI || 'mongodb+srv://jadyn:290794@gamification.nwes9ze.mongodb.net/management?retryWrites=true&w=majority&appName=gamification';
const OSS_DOORWAY_URI = process.env.OSS_DOORWAY_URI || 'mongodb+srv://cna93:gamification@gamification.nwes9ze.mongodb.net/?retryWrites=true&w=majority&appName=gamification';

async function mirrorConfigSelection() {
  console.log(`🔍 Mirroring OSS-Management config selection for class: ${CLASS_ID}`);
  console.log('=' .repeat(80));

  const managementClient = new MongoClient(MANAGEMENT_URI);
  const ossDoorwayClient = new MongoClient(OSS_DOORWAY_URI);

  try {
    await managementClient.connect();
    await ossDoorwayClient.connect();
    
    const managementDb = managementClient.db('management');
    const ossDoorwayDb = ossDoorwayClient.db('test');

    console.log('✅ Connected to both databases');

    // ========================================
    // SCENARIO 1: NEW REPO CREATION LOGIC
    // ========================================
    console.log('\n🆕 SCENARIO 1: NEW REPO CREATION');
    console.log('-'.repeat(50));
    console.log('This mirrors the logic in repoController.js createCustomRepos()');
    
    const questConfigsCollection = ossDoorwayDb.collection('questconfigs');
    
    // Step 1: Start with base classId
    let uniqueGroupId = CLASS_ID;
    console.log(`📋 Step 1: Starting with base classId: ${uniqueGroupId}`);
    
    // Step 2: Check for purple config (EXACT logic from repoController.js)
    console.log(`🔍 Step 2: Checking for purple config...`);
    const latestPurpleConfig = await questConfigsCollection.findOne(
      { classId: { $regex: new RegExp(`^${uniqueGroupId}_purple_`) } },
      { sort: { createdAt: -1 } }
    );
    
    if (latestPurpleConfig) {
      uniqueGroupId = latestPurpleConfig.classId;
      console.log(`🟣 Step 3: Found purple config! Using: ${uniqueGroupId}`);
      console.log(`   - Original classId: ${CLASS_ID}`);
      console.log(`   - Purple config ID: ${latestPurpleConfig._id}`);
      console.log(`   - Created: ${latestPurpleConfig.createdAt}`);
      
      // Step 4: Verify quest content (EXACT logic from repoController.js)
      const questIds = Object.keys(latestPurpleConfig.config || {}).filter(k => k.startsWith('Q'));
      console.log(`🔍 Step 4: Purple config quests: ${questIds.join(', ')}`);
      
      if (questIds.length === 0) {
        console.error(`❌ Step 5: WARNING: Purple config has no quests! Falling back to original.`);
        uniqueGroupId = CLASS_ID;
      } else {
        console.log(`✅ Step 5: Purple config validated - ${questIds.length} quests found`);
      }
    } else {
      console.log(`📋 Step 3: No purple config found, using original: ${uniqueGroupId}`);
    }
    
    console.log(`\n🎯 NEW REPO CREATION RESULT:`);
    console.log(`   Final config to use: ${uniqueGroupId}`);
    console.log(`   This is what new students will get when repos are created`);

    // ========================================
    // SCENARIO 2: PURPLE DEPLOY LOGIC
    // ========================================
    console.log('\n\n🟣 SCENARIO 2: PURPLE DEPLOY');
    console.log('-'.repeat(50));
    console.log('This mirrors the logic in gamificationController.js purpleDeployQuest()');
    
    // Step 1: Find existing config (EXACT logic from gamificationController.js)
    console.log(`🔍 Step 1: Finding existing config for class: ${CLASS_ID}`);
    const existingConfig = await questConfigsCollection.findOne({
      $or: [
        { classId: CLASS_ID },
        { groupId: CLASS_ID },
        { configId: CLASS_ID }
      ]
    });
    
    if (existingConfig) {
      console.log(`✅ Found existing config: ${existingConfig.classId}`);
      console.log(`   - ID: ${existingConfig._id}`);
      console.log(`   - Created: ${existingConfig.createdAt}`);
    } else {
      console.log(`❌ No existing config found for class: ${CLASS_ID}`);
    }
    
    // Step 2: Check for latest purple config (EXACT logic from gamificationController.js)
    console.log(`🔍 Step 2: Checking for latest purple config...`);
    const latestPurpleConfigForDeploy = await questConfigsCollection.findOne(
      { classId: { $regex: new RegExp(`^${CLASS_ID}_purple_`) } },
      { sort: { createdAt: -1 } }
    );
    
    // Step 3: Determine which config to analyze (EXACT logic from gamificationController.js)
    const configToAnalyze = latestPurpleConfigForDeploy || existingConfig;
    console.log(`🔍 Step 3: Config to analyze: ${configToAnalyze?.classId} (${latestPurpleConfigForDeploy ? 'latest purple' : 'original'})`);
    
    if (configToAnalyze) {
      let existingQuests = [];
      let configData = null;
      
      // Step 4: Extract quests (EXACT logic from gamificationController.js)
      if (configToAnalyze.questSequence && Array.isArray(configToAnalyze.questSequence)) {
        // New format: questSequence array
        existingQuests = configToAnalyze.questSequence;
        configData = configToAnalyze;
        console.log(`📋 Step 4: Using questSequence format with ${existingQuests.length} quests`);
      } else {
        // Old format: individual quest objects
        const configToSearch = configToAnalyze.config || configToAnalyze;
        const questKeys = Object.keys(configToSearch).filter(key => key.startsWith('Q') && key !== 'map_repo_link');
        existingQuests = questKeys.map(key => ({
          questId: key,
          title: configToSearch[key].metadata?.title || key,
          sequenceNumber: parseInt(key.slice(1)) - 1
        })).sort((a, b) => a.sequenceNumber - b.sequenceNumber);
        console.log(`📋 Step 4: Using legacy format with ${existingQuests.length} quests`);
      }
      
      // Step 5: Calculate next quest number (EXACT logic from gamificationController.js)
      const nextQuestNumber = existingQuests.length + 1;
      const newQuestId = `Q${nextQuestNumber}`;
      
      console.log(`🔍 Step 5: Quest analysis:`);
      console.log(`   - Existing quests: ${existingQuests.map(q => q.questId || q).join(', ')}`);
      console.log(`   - Next quest number: ${nextQuestNumber}`);
      console.log(`   - New quest ID: ${newQuestId}`);
      
      // Step 6: Show what purple deploy would create
      console.log(`\n🎯 PURPLE DEPLOY RESULT:`);
      console.log(`   Base config: ${configToAnalyze.classId}`);
      console.log(`   Base config ID: ${configToAnalyze._id}`);
      console.log(`   Current quests: ${existingQuests.length}`);
      console.log(`   Next quest would be: ${newQuestId}`);
      console.log(`   New purple config name: ${CLASS_ID}_purple_${Date.now()}`);
      
    } else {
      console.log(`❌ No config found to analyze for purple deploy`);
    }

    // ========================================
    // COMPARISON SUMMARY
    // ========================================
    console.log('\n\n📊 COMPARISON SUMMARY');
    console.log('=' .repeat(50));
    
    console.log(`\n🆕 NEW REPO CREATION:`);
    console.log(`   Uses: ${uniqueGroupId}`);
    console.log(`   Logic: Purple config first, fallback to original`);
    
    console.log(`\n🟣 PURPLE DEPLOY:`);
    console.log(`   Uses: ${configToAnalyze?.classId || 'NONE'}`);
    console.log(`   Logic: Latest purple config first, fallback to original`);
    
    // Check if they're the same
    if (uniqueGroupId === configToAnalyze?.classId) {
      console.log(`\n✅ CONSISTENT: Both scenarios use the same config`);
    } else {
      console.log(`\n⚠️ INCONSISTENT: Different configs used`);
      console.log(`   New repo creation: ${uniqueGroupId}`);
      console.log(`   Purple deploy: ${configToAnalyze?.classId || 'NONE'}`);
    }

    // ========================================
    // ACTUAL CONFIG DETAILS
    // ========================================
    console.log('\n\n📋 ACTUAL CONFIG DETAILS');
    console.log('=' .repeat(50));
    
    // Show the config that would be used for new repos
    const configForNewRepos = await questConfigsCollection.findOne({
      $or: [
        { classId: uniqueGroupId },
        { groupId: uniqueGroupId },
        { configId: uniqueGroupId }
      ]
    });
    
    if (configForNewRepos) {
      console.log(`\n🆕 CONFIG FOR NEW REPOS:`);
      console.log(`   - ID: ${configForNewRepos._id}`);
      console.log(`   - Name: ${configForNewRepos.classId}`);
      console.log(`   - Created: ${configForNewRepos.createdAt}`);
      
      if (configForNewRepos.config) {
        const quests = Object.keys(configForNewRepos.config).filter(k => k.startsWith('Q'));
        console.log(`   - Quests: ${quests.join(', ')}`);
        
        // Show task counts for first few quests
        for (const quest of quests.slice(0, 3)) {
          if (configForNewRepos.config[quest] && typeof configForNewRepos.config[quest] === 'object') {
            const tasks = Object.keys(configForNewRepos.config[quest]).filter(k => k.startsWith('T'));
            console.log(`   - ${quest}: ${tasks.length} tasks`);
          }
        }
        if (quests.length > 3) {
          console.log(`   - ... and ${quests.length - 3} more quests`);
        }
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  } finally {
    await managementClient.close();
    await ossDoorwayClient.close();
    console.log('\n✅ Disconnected from databases');
  }
}

// Run the script
mirrorConfigSelection().catch(console.error);
