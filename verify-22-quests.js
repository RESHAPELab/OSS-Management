require('dotenv').config();
const mongoose = require('mongoose');

// Import the Group model
const Group = require('./backend/models/GroupModel');

const MONGODB_URI = process.env.MONGODB_URI;
const CLASS_ID = '68a770b8140b9c0174c13ce7';

async function verify22Quests() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB successfully!\n');

    // Find the specific class
    const group = await Group.findById(CLASS_ID);
    
    if (!group) {
      console.log(`ERROR: Class ${CLASS_ID} not found in database!`);
      return;
    }

    console.log(`Class: ${group.groupName} (ID: ${CLASS_ID})`);
    console.log(`Number of students: ${group.students ? group.students.length : 0}\n`);
    
    // Check questJsonConfig
    if (group.questJsonConfig && group.questJsonConfig.questSequence) {
      const quests = group.questJsonConfig.questSequence;
      console.log(`✓ CLASS QUEST CONFIG: ${quests.length} quests found\n`);
      
      console.log('Quest list:');
      quests.forEach((quest, index) => {
        const taskCount = quest.tasks ? Object.keys(quest.tasks).length : 0;
        console.log(`  ${index + 1}. ${quest.questId}: ${quest.title} (${taskCount} tasks)`);
      });
      
      if (quests.length === 22) {
        console.log('\n✅ CONFIRMED: Class has exactly 22 quests!');
      } else {
        console.log(`\n⚠️  WARNING: Expected 22 quests but found ${quests.length}`);
      }
    } else {
      console.log('✗ No questSequence found in questJsonConfig');
    }
    
    console.log('\n--- Checking ALL students in this class ---');
    if (group.students && group.students.length > 0) {
      console.log(`Total students to check: ${group.students.length}\n`);
      
      let studentsWithCorrectConfig = 0;
      let studentsWithWrongConfig = 0;
      let studentsWithNoConfig = 0;
      
      group.students.forEach((student, index) => {
        const studentName = student.username || student.email || `Student ${index + 1}`;
        
        if (student.questJsonConfig && student.questJsonConfig.questSequence) {
          const questCount = student.questJsonConfig.questSequence.length;
          if (questCount === 22) {
            studentsWithCorrectConfig++;
            console.log(`  ✓ ${studentName}: ${questCount} quests`);
          } else {
            studentsWithWrongConfig++;
            console.log(`  ⚠️  ${studentName}: ${questCount} quests (expected 22)`);
          }
        } else {
          studentsWithNoConfig++;
          console.log(`  ✗ ${studentName}: No quest config`);
        }
      });
      
      console.log('\n--- SUMMARY ---');
      console.log(`Students with 22 quests: ${studentsWithCorrectConfig}`);
      console.log(`Students with wrong quest count: ${studentsWithWrongConfig}`);
      console.log(`Students with no config: ${studentsWithNoConfig}`);
      
      if (studentsWithCorrectConfig === group.students.length) {
        console.log('\n✅ ALL STUDENTS HAVE 22 QUESTS!');
      }
    } else {
      console.log('No students in this class');
    }

  } catch (error) {
    console.error('Error verifying quests:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed.');
  }
}

verify22Quests();

