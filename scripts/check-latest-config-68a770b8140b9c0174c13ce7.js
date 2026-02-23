// check-latest-config-68a770b8140b9c0174c13ce7.js
// Script to check the latest active config for class 68a770b8140b9c0174c13ce7
// Usage: node check-latest-config-68a770b8140b9c0174c13ce7.js

const { MongoClient } = require('mongodb');

const CLASS_ID = '68a770b8140b9c0174c13ce7';
const MANAGEMENT_URI = process.env.MANAGEMENT_URI || 'mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/management?retryWrites=true&w=majority&appName=gamification';
const OSS_DOORWAY_URI = process.env.OSS_DOORWAY_URI || 'mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/?retryWrites=true&w=majority&appName=gamification';

async function checkLatestConfig() {
  console.log(`🔍 Checking latest config for class: ${CLASS_ID}`);
  console.log(`🌐 Class URL: https://ossdoorway.vercel.app/class/${CLASS_ID}`);
  console.log('=' .repeat(80));

  const managementClient = new MongoClient(MANAGEMENT_URI);
  const ossDoorwayClient = new MongoClient(OSS_DOORWAY_URI);

  try {
    // Connect to both databases
    await managementClient.connect();
    await ossDoorwayClient.connect();
    
    const managementDb = managementClient.db('management');
    const ossDoorwayDb = ossDoorwayClient.db('test');

    console.log('✅ Connected to both databases');

    // Step 1: Check Management DB - Group document
    console.log('\n📋 STEP 1: Checking Management DB - Group Document');
    console.log('-'.repeat(50));
    
    const groupsCollection = managementDb.collection('groups');
    const classGroup = await groupsCollection.findOne({ _id: CLASS_ID });
    
    if (classGroup) {
      console.log('✅ Found class group in Management DB:');
      console.log(`   - ID: ${classGroup._id}`);
      console.log(`   - Name: ${classGroup.groupName || 'N/A'}`);
      console.log(`   - questJsonConfig: ${classGroup.questJsonConfig || 'NOT SET'}`);
      console.log(`   - questJsonLastUpdated: ${classGroup.questJsonLastUpdated || 'NOT SET'}`);
      console.log(`   - questOrder: ${classGroup.questOrder ? `${classGroup.questOrder.length} quests` : 'NOT SET'}`);
      console.log(`   - Created: ${classGroup.createdAt}`);
      
      if (classGroup.questJsonConfig) {
        console.log(`\n🎯 ACTIVE CONFIG ID: ${classGroup.questJsonConfig}`);
      }
    } else {
      console.log('❌ Class group not found in Management DB');
    }

    // Step 2: Check Management DB - Quest Configs Collection
    console.log('\n📚 STEP 2: Checking Management DB - Quest Configs');
    console.log('-'.repeat(50));
    
    const questConfigsCollection = managementDb.collection('questconfigs');
    
    // Find all configs related to this class
    const relatedConfigs = await questConfigsCollection.find({
      $or: [
        { classId: CLASS_ID },
        { classId: { $regex: new RegExp(`^${CLASS_ID}_purple_`) } },
        { classId: { $regex: new RegExp(`^${CLASS_ID}-`) } },
        { groupId: CLASS_ID }
      ]
    }).sort({ createdAt: -1 }).toArray();

    if (relatedConfigs.length > 0) {
      console.log(`✅ Found ${relatedConfigs.length} quest configs for this class:`);
      
      for (let i = 0; i < relatedConfigs.length; i++) {
        const config = relatedConfigs[i];
        const isActive = classGroup?.questJsonConfig === config.classId;
        
        console.log(`\n📝 Config ${i + 1}: ${config.classId}`);
        console.log(`   - ID: ${config._id}`);
        console.log(`   - Created: ${config.createdAt}`);
        console.log(`   - Is Purple: ${config.classId.includes('_purple_')}`);
        console.log(`   - Is Active: ${isActive ? '⭐ YES' : '❌ NO'}`);
        
        // Show quest content
        if (config.config || config.configData) {
          const questConfig = config.config || config.configData;
          if (typeof questConfig === 'object') {
            const quests = Object.keys(questConfig).filter(k => k.startsWith('Q'));
            console.log(`   - Quests: ${quests.join(', ')}`);
            
            // Show task counts
            for (const quest of quests.slice(0, 3)) { // Show first 3 quests
              if (questConfig[quest] && typeof questConfig[quest] === 'object') {
                const tasks = Object.keys(questConfig[quest]).filter(k => k.startsWith('T'));
                console.log(`   - ${quest}: ${tasks.length} tasks`);
              }
            }
            if (quests.length > 3) {
              console.log(`   - ... and ${quests.length - 3} more quests`);
            }
          }
        }
        
        // Show quest sequence if available
        if (config.questSequence && Array.isArray(config.questSequence)) {
          const questIds = config.questSequence.map(q => q.questId || q.id).filter(Boolean);
          console.log(`   - Quest Sequence: [${questIds.join(', ')}]`);
        }
      }
      
      // Identify the latest config
      const latestConfig = relatedConfigs[0];
      console.log(`\n🏆 LATEST CONFIG: ${latestConfig.classId}`);
      console.log(`   Created: ${latestConfig.createdAt}`);
      
    } else {
      console.log('❌ No quest configs found for this class');
    }

    // Step 3: Check OSS-Doorway DB - Quest Configs
    console.log('\n🌐 STEP 3: Checking OSS-Doorway DB - Quest Configs');
    console.log('-'.repeat(50));
    
    const ossQuestConfigsCollection = ossDoorwayDb.collection('questconfigs');
    
    const ossRelatedConfigs = await ossQuestConfigsCollection.find({
      $or: [
        { classId: CLASS_ID },
        { classId: { $regex: new RegExp(`^${CLASS_ID}_purple_`) } },
        { classId: { $regex: new RegExp(`^${CLASS_ID}-`) } }
      ]
    }).sort({ createdAt: -1 }).toArray();

    if (ossRelatedConfigs.length > 0) {
      console.log(`✅ Found ${ossRelatedConfigs.length} quest configs in OSS-Doorway DB:`);
      
      for (let i = 0; i < ossRelatedConfigs.length; i++) {
        const config = ossRelatedConfigs[i];
        console.log(`\n📝 OSS Config ${i + 1}: ${config.classId}`);
        console.log(`   - ID: ${config._id}`);
        console.log(`   - Created: ${config.createdAt}`);
        console.log(`   - Is Purple: ${config.classId.includes('_purple_')}`);
        
        if (config.config) {
          const quests = Object.keys(config.config).filter(k => k.startsWith('Q'));
          console.log(`   - Quests: ${quests.join(', ')}`);
        }
      }
      
      const latestOssConfig = ossRelatedConfigs[0];
      console.log(`\n🏆 LATEST OSS-DOORWAY CONFIG: ${latestOssConfig.classId}`);
      
    } else {
      console.log('❌ No quest configs found in OSS-Doorway DB');
    }

    // Step 4: Check what students are actually using
    console.log('\n👥 STEP 4: Checking Active Student Configs');
    console.log('-'.repeat(50));
    
    const questsCollection = ossDoorwayDb.collection('quests');
    
    // Find users with this class ID
    const students = await questsCollection.find({
      $or: [
        { 'user_data.customGroupId': CLASS_ID },
        { 'user_data.groupId': CLASS_ID },
        { 'user_data.classId': CLASS_ID }
      ]
    }).limit(5).toArray();

    if (students.length > 0) {
      console.log(`✅ Found ${students.length} students (showing first 5):`);
      
      for (const student of students) {
        console.log(`\n👤 Student: ${student.github}`);
        console.log(`   - customGroupId: ${student.user_data?.customGroupId || 'NOT SET'}`);
        console.log(`   - Current Quest: ${student.user_data?.current?.quest || 'N/A'}`);
        console.log(`   - Current Task: ${student.user_data?.current?.task || 'N/A'}`);
        console.log(`   - Config Used: ${student.user_data?.configId || 'NOT SET'}`);
      }
    } else {
      console.log('❌ No students found for this class');
    }

    // Step 5: Summary and Recommendations
    console.log('\n📊 STEP 5: Summary & Recommendations');
    console.log('-'.repeat(50));
    
    const activeConfigId = classGroup?.questJsonConfig;
    const latestManagementConfig = relatedConfigs[0];
    const latestOssConfig = ossRelatedConfigs[0];
    
    console.log('📋 CONFIG STATUS:');
    console.log(`   - Active Config (from Group): ${activeConfigId || 'NOT SET'}`);
    console.log(`   - Latest Management Config: ${latestManagementConfig?.classId || 'NONE'}`);
    console.log(`   - Latest OSS-Doorway Config: ${latestOssConfig?.classId || 'NONE'}`);
    
    if (activeConfigId && latestManagementConfig) {
      if (activeConfigId === latestManagementConfig.classId) {
        console.log('✅ Active config matches latest management config');
      } else {
        console.log('⚠️ Active config does NOT match latest management config');
        console.log(`   Active: ${activeConfigId}`);
        console.log(`   Latest: ${latestManagementConfig.classId}`);
      }
    }
    
    console.log('\n🎯 RECOMMENDATIONS:');
    if (latestManagementConfig) {
      console.log(`   - To update quest content, modify: ${latestManagementConfig.classId}`);
      console.log(`   - This config was created: ${latestManagementConfig.createdAt}`);
    } else {
      console.log('   - No management config found - may need to create one');
    }
    
    if (activeConfigId) {
      console.log(`   - Current active config: ${activeConfigId}`);
    } else {
      console.log('   - No active config set - students may use default logic');
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
checkLatestConfig().catch(console.error);
