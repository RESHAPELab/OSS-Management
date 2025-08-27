const { MongoClient } = require('mongodb');

const ossDoorwayURI = 'mongodb+srv://cna93:gamification@gamification.nwes9ze.mongodb.net/?retryWrites=true&w=majority&appName=gamification';
const ossDoorwayDBName = 'test';

async function getDetailedClassProgress(classId) {
  console.log(`🔍 [DETAILED-PROGRESS] Analyzing detailed progress for class: ${classId}`);
  
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
    console.log(`   groupId: ${questConfig.groupId || 'N/A'}`);
    console.log(`   configId: ${questConfig.configId || 'N/A'}`);
    console.log(`   classId: ${questConfig.classId || 'N/A'}`);
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
        
        // Extract quest titles
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
    
    let totalAccepted = 0;
    let totalCompleted = 0;
    let studentsOnQ1 = 0;
    let studentsOnQ2 = 0;
    let studentsOnOther = 0;
    
    for (const student of students) {
      const username = student._id || student.user_data?.username || 'unknown';
      const userData = student.user_data || {};
      
      console.log(`👤 ${username}`);
      
      // Show current quest
      if (userData.current?.quest) {
        const currentQuest = userData.current.quest;
        console.log(`   🎯 Current Quest: ${currentQuest}`);
        
        // Count students by current quest
        if (currentQuest === 'Q1') {
          studentsOnQ1++;
        } else if (currentQuest === 'Q2') {
          studentsOnQ2++;
        } else {
          studentsOnOther++;
        }
      } else {
        console.log(`   🎯 Current Quest: None`);
      }
      
      // Show accepted quests with details
      const acceptedQuests = userData.accepted || {};
      const acceptedCount = Object.keys(acceptedQuests).length;
      totalAccepted += acceptedCount;
      
      if (acceptedCount > 0) {
        console.log(`   ✅ Accepted Quests (${acceptedCount}):`);
        Object.entries(acceptedQuests).forEach(([questId, questData]) => {
          const title = questTitles[questId] || questData.title || 'No title';
          const acceptedAt = questData.acceptedAt ? new Date(questData.acceptedAt).toLocaleDateString() : 'Unknown';
          console.log(`      - ${questId}: ${title} (Accepted: ${acceptedAt})`);
        });
      } else {
        console.log(`   ✅ Accepted Quests: None`);
      }
      
      // Show completed quests with details
      const completedQuests = userData.completed || {};
      const completedCount = Object.keys(completedQuests).length;
      totalCompleted += completedCount;
      
      if (completedCount > 0) {
        console.log(`   🏆 Completed Quests (${completedCount}):`);
        Object.entries(completedQuests).forEach(([questId, questData]) => {
          const title = questTitles[questId] || questData.title || 'No title';
          const completedAt = questData.completedAt ? new Date(questData.completedAt).toLocaleDateString() : 'Unknown';
          const points = questData.points || 0;
          const xp = questData.xp || 0;
          console.log(`      - ${questId}: ${title} (Completed: ${completedAt}, Points: ${points}, XP: ${xp})`);
        });
      } else {
        console.log(`   🏆 Completed Quests: None`);
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
    console.log(`📊 CLASS PROGRESS SUMMARY:`);
    console.log(`   Total Students: ${students.length}`);
    console.log(`   Students on Q1: ${studentsOnQ1}`);
    console.log(`   Students on Q2: ${studentsOnQ2}`);
    console.log(`   Students on Other: ${studentsOnOther}`);
    console.log(`   Total Quests Accepted: ${totalAccepted}`);
    console.log(`   Total Quests Completed: ${totalCompleted}`);
    console.log(`   Average Quests per Student: ${(totalAccepted / students.length).toFixed(1)} accepted, ${(totalCompleted / students.length).toFixed(1)} completed`);
    
    if (questSequence.length > 0) {
      console.log(`   Quest Sequence: ${questSequence.map(q => q.questId).join(' → ')}`);
      
      // Show progress by quest
      console.log(`   Progress by Quest:`);
      questSequence.forEach(quest => {
        const questId = quest.questId;
        const title = questTitles[questId] || questId;
        const acceptedCount = students.filter(s => s.user_data?.accepted?.[questId]).length;
        const completedCount = students.filter(s => s.user_data?.completed?.[questId]).length;
        const acceptanceRate = ((acceptedCount / students.length) * 100).toFixed(1);
        const completionRate = ((completedCount / students.length) * 100).toFixed(1);
        
        console.log(`      ${questId} (${title}): ${acceptedCount}/${students.length} accepted (${acceptanceRate}%), ${completedCount}/${students.length} completed (${completionRate}%)`);
      });
    }
    
  } catch (error) {
    console.error(`❌ Error getting detailed class progress:`, error);
  } finally {
    await client.close();
  }
}

// Main execution
const classId = process.argv[2] || '68ab703e6ceb965e0759df11';

if (!classId) {
  console.log('❌ Please provide a class ID as an argument');
  console.log('Usage: node get-detailed-class-progress.js <classId>');
  process.exit(1);
}

getDetailedClassProgress(classId)
  .then(() => {
    console.log('✅ Detailed class progress analysis complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
