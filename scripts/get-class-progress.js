const { MongoClient } = require('mongodb');

// OSS-Doorway database connection (where student progress is stored)
const ossDoorwayURI = 'mongodb+srv://cna93:gamification@gamification.nwes9ze.mongodb.net/?retryWrites=true&w=majority&appName=gamification';
const ossDoorwayDBName = 'test';

// OSS-Management database connection (where class info is stored)
const managementURI = 'mongodb+srv://jadyn:290794@gamification.nwes9ze.mongodb.net/management?retryWrites=true&w=majority&appName=gamification';
const managementDBName = 'gamification-management';

async function getClassProgress(classId) {
  console.log(`🔍 [CLASS-PROGRESS] Analyzing progress for class: ${classId}`);
  
  const ossDoorwayClient = new MongoClient(ossDoorwayURI);
  const managementClient = new MongoClient(managementURI);
  
  try {
    await ossDoorwayClient.connect();
    await managementClient.connect();
    
    const ossDoorwayDb = ossDoorwayClient.db(ossDoorwayDBName);
    const managementDb = managementClient.db(managementDBName);
    
    // Get class info from management database
    const classInfo = await managementDb.collection('groups').findOne({ _id: classId });
    if (!classInfo) {
      console.log(`❌ Class not found: ${classId}`);
      return;
    }
    
    console.log(`📚 Class: ${classInfo.name}`);
    console.log(`👥 Students: ${classInfo.users?.length || 0}`);
    console.log(`---`);
    
    // Get quest config for this class
    const questConfig = await ossDoorwayDb.collection('questconfigs').findOne({
      $or: [
        { groupId: classId },
        { configId: classId },
        { classId: classId }
      ]
    });
    
    if (!questConfig) {
      console.log(`❌ No quest config found for class ${classId}`);
      return;
    }
    
    console.log(`📋 Quest Config: ${questConfig.configId || questConfig.groupId || questConfig.classId}`);
    console.log(`---`);
    
    // Parse quest config to understand quest sequence
    let questSequence = [];
    if (questConfig.configData) {
      try {
        const configData = typeof questConfig.configData === 'string' 
          ? JSON.parse(questConfig.configData) 
          : questConfig.configData;
        questSequence = configData.questSequence || [];
      } catch (e) {
        console.log(`⚠️ Could not parse configData: ${e.message}`);
      }
    }
    
    if (questSequence.length === 0) {
      console.log(`⚠️ No quest sequence found in config`);
    } else {
      console.log(`📊 Quest Sequence: ${questSequence.map(q => q.questId).join(' → ')}`);
    }
    console.log(`---`);
    
    // Find all students in this class using the pattern: username-formattedclassname
    const formattedClassName = classInfo.name.toLowerCase().replace(/\s+/g, '-');
    const searchSuffix = `-${formattedClassName}`;
    
    console.log(`🔍 Searching for students with suffix: ${searchSuffix}`);
    
    const students = await ossDoorwayDb.collection('user_data').find({
      _id: { $regex: new RegExp(`${searchSuffix}$`, 'i') }
    }).toArray();
    
    console.log(`👥 Found ${students.length} students in OSS-Doorway database`);
    console.log(`---`);
    
    if (students.length === 0) {
      console.log(`❌ No students found. Trying alternative search...`);
      
      // Alternative: search by customGroupId
      const altStudents = await ossDoorwayDb.collection('user_data').find({
        'user_data.customGroupId': classId
      }).toArray();
      
      console.log(`🔍 Alternative search found ${altStudents.length} students by customGroupId`);
      
      if (altStudents.length > 0) {
        await analyzeStudents(altStudents, questSequence, classInfo);
      }
    } else {
      await analyzeStudents(students, questSequence, classInfo);
    }
    
  } catch (error) {
    console.error(`❌ Error getting class progress:`, error);
  } finally {
    await ossDoorwayClient.close();
    await managementClient.close();
  }
}

async function analyzeStudents(students, questSequence, classInfo) {
  console.log(`📊 Analyzing ${students.length} students...`);
  console.log(`---`);
  
  // Sort students by username for better readability
  students.sort((a, b) => {
    const usernameA = a._id || a.user_data?.username || '';
    const usernameB = b._id || b.user_data?.username || '';
    return usernameA.localeCompare(usernameB);
  });
  
  for (const student of students) {
    const username = student._id || student.user_data?.username || 'unknown';
    const userData = student.user_data || {};
    
    console.log(`👤 ${username}`);
    
    // Show current quest
    if (userData.current?.quest) {
      console.log(`   🎯 Current: ${userData.current.quest}`);
    } else {
      console.log(`   🎯 Current: None`);
    }
    
    // Show accepted quests
    const acceptedQuests = userData.accepted || {};
    const acceptedCount = Object.keys(acceptedQuests).length;
    if (acceptedCount > 0) {
      console.log(`   ✅ Accepted: ${acceptedCount} quest(s)`);
      Object.entries(acceptedQuests).forEach(([questId, questData]) => {
        console.log(`      - ${questId}: ${questData.title || 'No title'}`);
      });
    } else {
      console.log(`   ✅ Accepted: None`);
    }
    
    // Show completed quests
    const completedQuests = userData.completed || {};
    const completedCount = Object.keys(completedQuests).length;
    if (completedCount > 0) {
      console.log(`   🏆 Completed: ${completedCount} quest(s)`);
      Object.entries(completedQuests).forEach(([questId, questData]) => {
        console.log(`      - ${questId}: ${questData.title || 'No title'}`);
      });
    } else {
      console.log(`   🏆 Completed: None`);
    }
    
    // Show custom group info
    if (userData.customGroupId) {
      console.log(`   🔗 Group ID: ${userData.customGroupId}`);
    }
    
    // Show points and XP
    if (userData.points !== undefined) {
      console.log(`   💰 Points: ${userData.points}`);
    }
    if (userData.xp !== undefined) {
      console.log(`   ⭐ XP: ${userData.xp}`);
    }
    
    console.log(`---`);
  }
  
  // Summary
  const totalStudents = students.length;
  const studentsWithProgress = students.filter(s => {
    const userData = s.user_data || {};
    return userData.accepted || userData.completed || userData.current?.quest;
  }).length;
  
  console.log(`📊 SUMMARY:`);
  console.log(`   Total Students: ${totalStudents}`);
  console.log(`   Students with Progress: ${studentsWithProgress}`);
  console.log(`   Students without Progress: ${totalStudents - studentsWithProgress}`);
  
  if (questSequence.length > 0) {
    console.log(`   Quest Sequence: ${questSequence.map(q => q.questId).join(' → ')}`);
  }
}

// Main execution
const classId = process.argv[2] || '68ab703e6ceb965e0759df11';

if (!classId) {
  console.log('❌ Please provide a class ID as an argument');
  console.log('Usage: node get-class-progress.js <classId>');
  process.exit(1);
}

getClassProgress(classId)
  .then(() => {
    console.log('✅ Class progress analysis complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
