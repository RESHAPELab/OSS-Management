import { MongoClient } from 'mongodb';

const MANAGEMENT_URI = "mongodb+srv://jadyn:290794@gamification.nwes9ze.mongodb.net/management?retryWrites=true&w=majority&appName=gamification";

async function analyzeConfigUsage() {
  console.log('🔍 Analyzing quest config usage for CS386 class...');
  
  const managementClient = new MongoClient(MANAGEMENT_URI);
  
  try {
    await managementClient.connect();
    const managementDb = managementClient.db('management');
    
    // Step 1: Check the class group configuration
    console.log('\n📋 Step 1: Checking class group configuration...');
    const groupsCollection = managementDb.collection('groups');
    const classGroup = await groupsCollection.findOne({
      _id: '68a770b8140b9c0174c13ce7'
    });
    
    if (classGroup) {
      console.log('✅ Found class group:');
      console.log(`   - ID: ${classGroup._id}`);
      console.log(`   - Name: ${classGroup.name || 'N/A'}`);
      console.log(`   - questJsonConfig: ${classGroup.questJsonConfig || 'NOT SET'}`);
      
      if (classGroup.questJsonConfig) {
        console.log(`   ⭐ ACTIVE CONFIG: ${classGroup.questJsonConfig}`);
      }
    } else {
      console.log('❌ Class group not found');
    }
    
    // Step 2: Check all available configs for this class
    console.log('\n📋 Step 2: Checking all available configs...');
    const questConfigsCollection = managementDb.collection('questconfigs');
    
    const allConfigs = await questConfigsCollection.find({
      $or: [
        { classId: { $regex: '68a770b8140b9c0174c13ce7', $options: 'i' } },
        { groupId: { $regex: '68a770b8140b9c0174c13ce7', $options: 'i' } }
      ]
    }).sort({ createdAt: -1 }).toArray();
    
    console.log(`Found ${allConfigs.length} configs for this class:`);
    
    let purpleConfigs = [];
    let testConfigs = [];
    let baseConfigs = [];
    
    for (const config of allConfigs) {
      const configId = config.classId || config.configId || config.groupId || config._id;
      console.log(`   - ${configId} (${config.createdAt})`);
      
      if (configId.includes('purple')) {
        purpleConfigs.push(config);
      } else if (configId.includes('test')) {
        testConfigs.push(config);
      } else {
        baseConfigs.push(config);
      }
    }
    
    // Step 3: Analyze usage scenarios
    console.log('\n🎯 Step 3: Analyzing usage scenarios...');
    console.log('=' .repeat(60));
    
    // 1. New repo creation
    console.log('\n1️⃣ NEW REPO CREATION:');
    if (purpleConfigs.length > 0) {
      const latestPurple = purpleConfigs[0];
      console.log(`   ✅ Uses PURPLE config: ${latestPurple.classId || latestPurple.configId}`);
      console.log(`   📅 Created: ${latestPurple.createdAt}`);
      console.log(`   🎯 Reason: Purple configs are auto-selected for new repos`);
    } else {
      console.log(`   ❌ No purple configs found`);
      if (testConfigs.length > 0) {
        const latestTest = testConfigs[0];
        console.log(`   ⚠️ Falls back to latest test config: ${latestTest.classId || latestTest.configId}`);
      } else if (baseConfigs.length > 0) {
        const latestBase = baseConfigs[0];
        console.log(`   ⚠️ Falls back to base config: ${latestBase.classId || latestBase.configId}`);
      } else {
        console.log(`   ❌ No configs available for new repos`);
      }
    }
    
    // 2. Current repos
    console.log('\n2️⃣ CURRENT REPOS:');
    if (classGroup && classGroup.questJsonConfig) {
      console.log(`   ✅ Use class-assigned config: ${classGroup.questJsonConfig}`);
      console.log(`   🎯 Reason: Class has explicit questJsonConfig set`);
    } else {
      console.log(`   ⚠️ No explicit config assigned to class`);
      console.log(`   📋 Current repos likely use their individual customGroupId assignments`);
      console.log(`   🔍 Need to check individual user data to determine which config each repo uses`);
    }
    
    // 3. Purple deploy target
    console.log('\n3️⃣ PURPLE DEPLOY TARGET:');
    if (purpleConfigs.length > 0) {
      const latestPurple = purpleConfigs[0];
      console.log(`   ✅ Appends to PURPLE config: ${latestPurple.classId || latestPurple.configId}`);
      console.log(`   📅 Created: ${latestPurple.createdAt}`);
      console.log(`   🎯 Reason: Purple deploy appends to existing purple config`);
    } else {
      console.log(`   ❌ No purple configs found for purple deploy`);
      console.log(`   ⚠️ Purple deploy would create NEW purple config from base class config`);
      if (baseConfigs.length > 0) {
        const baseConfig = baseConfigs[0];
        console.log(`   📋 Base config for purple deploy: ${baseConfig.classId || baseConfig.configId}`);
      } else {
        console.log(`   ❌ No base config found for purple deploy`);
      }
    }
    
    // Step 4: Check for any users to see what they're actually using
    console.log('\n📋 Step 4: Checking actual user usage...');
    const doorwayClient = new MongoClient("mongodb+srv://cna93:gamification@gamification.nwes9ze.mongodb.net/?retryWrites=true&w=majority&appName=gamification");
    await doorwayClient.connect();
    const doorwayDb = doorwayClient.db('gamification');
    
    const userDataCollection = doorwayDb.collection('user_data');
    const cs386Users = await userDataCollection.find({
      $or: [
        { 'user_data.group': '68a770b8140b9c0174c13ce7' },
        { 'user_data.customGroupId': { $regex: '68a770b8140b9c0174c13ce7', $options: 'i' } }
      ]
    }).limit(5).toArray();
    
    if (cs386Users.length > 0) {
      console.log(`Found ${cs386Users.length} CS386 users:`);
      for (const user of cs386Users) {
        console.log(`   - ${user._id}: customGroupId=${user.user_data?.customGroupId || 'N/A'}`);
      }
    } else {
      console.log('No CS386 users found in user_data collection');
    }
    
    await doorwayClient.close();
    
    // Summary
    console.log('\n📊 SUMMARY:');
    console.log('=' .repeat(60));
    console.log(`Purple configs: ${purpleConfigs.length}`);
    console.log(`Test configs: ${testConfigs.length}`);
    console.log(`Base configs: ${baseConfigs.length}`);
    console.log(`Class has explicit config: ${classGroup?.questJsonConfig ? 'YES' : 'NO'}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await managementClient.close();
  }
}

analyzeConfigUsage();



