const { MongoClient } = require('mongodb');

// OSS-Doorway database connection (where student progress is stored)
const ossDoorwayURI = 'mongodb+srv://cna93:gamification@gamification.nwes9ze.mongodb.net/?retryWrites=true&w=majority&appName=gamification';
const ossDoorwayDBName = 'test';

async function getClassCurrentTasks(classId) {
  console.log(`🔍 [CLASS-CURRENT-TASKS] Analyzing current tasks for class: ${classId}`);
  
  const client = new MongoClient(ossDoorwayURI);
  
  try {
    await client.connect();
    const db = client.db(ossDoorwayDBName);
    
    // Get quest config for this class
    const questConfig = await db.collection('questconfigs').findOne({
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
    
    console.log(`📋 Quest Config Found:`);
    console.log(`   groupId: ${questConfig.configId || questConfig.groupId || questConfig.classId}`);
    console.log(`   Created: ${questConfig.createdAt ? new Date(questConfig.createdAt).toLocaleDateString() : 'Unknown'}`);
    console.log(`---`);
    
    // Parse quest config to understand quest sequence
    let questSequence = [];
    let questTitles = {};
    
    if (questConfig.configData) {
      try {
        const configData = typeof questConfig.configData === 'string' 
          ? JSON.parse(questConfig.configData) 
          : questConfig.configData;
        
        questSequence = configData.questSequence || [];
        
        // Extract quest titles and task info
        questSequence.forEach(quest => {
          questTitles[quest.questId] = quest.metadata?.title || quest.title || quest.questId;
        });
        
        console.log(`📊 Quest Sequence (${questSequence.length} quests):`);
        questSequence.forEach((quest, index) => {
          const title = questTitles[quest.questId] || quest.questId;
          const prerequisite = quest.metadata?.prerequisite || 'None';
          console.log(`   ${index + 1}. ${quest.questId}: ${title}`);
          console.log(`      Prerequisite: ${prerequisite}`);
          
          // Show tasks for this quest
          if (quest.tasks) {
            const taskKeys = Object.keys(quest.tasks).filter(key => key !== 'metadata');
            console.log(`      Tasks: ${taskKeys.join(', ')}`);
          }
        });
        
      } catch (e) {
        console.log(`⚠️ Could not parse configData: ${e.message}`);
      }
    }
    
    console.log(`---`);
    
    // Find all students in this class
    const students = await db.collection('user_data').find({
      'user_data.customGroupId': classId
    }).toArray();
    
    console.log(`👥 Found ${students.length} students in class:`);
    console.log(`---`);
    
    // Sort students by username for better readability
    students.sort((a, b) => {
      const usernameA = a._id || a.user_data?.username || '';
      const usernameB = b._id || b.user_data?.username || '';
      return usernameA.localeCompare(usernameB);
    });
    
    let studentsOnQ1 = 0;
    let studentsOnQ2 = 0;
    let studentsOnOther = 0;
    let studentsStuck = 0;
    
    for (const student of students) {
      const username = student._id || student.user_data?.username || 'unknown';
      const userData = student.user_data || {};
      
      console.log(`👤 ${username}`);
      
      // Show current quest and task
      if (userData.current?.quest) {
        const currentQuest = userData.current.quest;
        const currentTask = userData.current.task || 'None';
        console.log(`   🎯 Current: ${currentQuest} - ${currentTask}`);
        
        // Count students by current quest
        if (currentQuest === 'Q1') {
          studentsOnQ1++;
        } else if (currentQuest === 'Q2') {
          studentsOnQ2++;
        } else if (currentQuest.startsWith('TEMP_')) {
          studentsStuck++;
          console.log(`      ⚠️  Student appears to be stuck on temporary quest`);
        } else {
          studentsOnOther++;
        }
        
        // Show quest details if available
        if (questTitles[currentQuest]) {
          console.log(`      📚 Quest: ${questTitles[currentQuest]}`);
        }
        
        // Show task details if available
        if (questSequence.length > 0) {
          const quest = questSequence.find(q => q.questId === currentQuest);
          if (quest && quest.tasks && quest.tasks[currentTask]) {
            const taskData = quest.tasks[currentTask];
            console.log(`      📝 Task: ${taskData.title || currentTask}`);
            console.log(`      🔧 Type: ${taskData.type || 'Unknown'}`);
            if (taskData.desc) {
              console.log(`      📖 Description: ${taskData.desc.substring(0, 100)}${taskData.desc.length > 100 ? '...' : ''}`);
            }
          }
        }
        
      } else {
        console.log(`   🎯 Current: None`);
        studentsStuck++;
      }
      
      // Show accepted quests
      const acceptedQuests = userData.accepted || {};
      const acceptedCount = Object.keys(acceptedQuests).length;
      if (acceptedCount > 0) {
        console.log(`   ✅ Accepted: ${acceptedCount} quest(s)`);
        Object.entries(acceptedQuests).forEach(([questId, questData]) => {
          const title = questTitles[questId] || questData.title || 'No title';
          const acceptedAt = questData.acceptedAt ? new Date(questData.acceptedAt).toLocaleDateString() : 'Unknown';
          console.log(`      - ${questId}: ${title} (Accepted: ${acceptedAt})`);
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
          const title = questTitles[questId] || questData.title || 'No title';
          const completedAt = questData.completedAt ? new Date(questData.completedAt).toLocaleDateString() : 'Unknown';
          const points = questData.points || 0;
          const xp = questData.xp || 0;
          console.log(`      - ${questId}: ${title} (Completed: ${completedAt}, Points: ${points}, XP: ${xp})`);
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
        console.log(`   💰 Total Points: ${userData.points}`);
      }
      if (userData.xp !== undefined) {
        console.log(`   ⭐ Total XP: ${userData.xp}`);
      }
      
      // Show completion percentage
      if (questSequence.length > 0) {
        const completionPercent = ((completedCount / questSequence.length) * 100).toFixed(1);
        console.log(`   📊 Progress: ${completedCount}/${questSequence.length} quests (${completionPercent}%)`);
      }
      
      console.log(`---`);
    }
    
    // Summary statistics
    console.log(`📊 CLASS CURRENT TASKS SUMMARY:`);
    console.log(`   Total Students: ${students.length}`);
    console.log(`   Students on Q1: ${studentsOnQ1}`);
    console.log(`   Students on Q2: ${studentsOnQ2}`);
    console.log(`   Students on Other: ${studentsOnOther}`);
    console.log(`   Students Stuck: ${studentsStuck}`);
    
    if (questSequence.length > 0) {
      console.log(`   Quest Sequence: ${questSequence.map(q => q.questId).join(' → ')}`);
      
      // Show progress by quest
      console.log(`   Progress by Quest:`);
      questSequence.forEach(quest => {
        const questId = quest.questId;
        const title = questTitles[questId] || questId;
        const acceptedCount = students.filter(s => s.user_data?.accepted?.[questId]).length;
        const completedCount = students.filter(s => s.user_data?.completed?.[questId]).length;
        const currentCount = students.filter(s => s.user_data?.current?.quest === questId).length;
        const acceptanceRate = ((acceptedCount / students.length) * 100).toFixed(1);
        const completionRate = ((completedCount / students.length) * 100).toFixed(1);
        const currentRate = ((currentCount / students.length) * 100).toFixed(1);
        
        console.log(`      ${questId} (${title}): ${acceptedCount}/${students.length} accepted (${acceptanceRate}%), ${completedCount}/${students.length} completed (${completionRate}%), ${currentCount}/${students.length} currently on (${currentRate}%)`);
      });
    }
    
    // Show students who need help
    if (studentsStuck > 0) {
      console.log(`\n⚠️  STUDENTS WHO MAY NEED HELP:`);
      students.forEach(student => {
        const userData = student.user_data || {};
        if (!userData.current?.quest || userData.current.quest.startsWith('TEMP_')) {
          const username = student._id || userData.username || 'unknown';
          console.log(`   - ${username}: ${userData.current?.quest || 'No current quest'}`);
        }
      });
    }
    
  } catch (error) {
    console.error(`❌ Error getting class current tasks:`, error);
  } finally {
    await client.close();
  }
}

// Main execution
const classId = process.argv[2] || '68a770b8140b9c0174c13ce7';

if (!classId) {
  console.log('❌ Please provide a class ID as an argument');
  console.log('Usage: node get-class-current-tasks.js <classId>');
  process.exit(1);
}

getClassCurrentTasks(classId)
  .then(() => {
    console.log('✅ Class current tasks analysis complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
