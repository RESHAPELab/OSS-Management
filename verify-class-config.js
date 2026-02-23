require('dotenv').config();
const mongoose = require('mongoose');

// Import the Group model
const Group = require('./backend/models/GroupModel');

const MONGODB_URI = process.env.MONGODB_URI;
const CLASS_ID = '68a770b8140b9c0174c13ce7';

async function verifyClassConfig() {
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
    if (group.questJsonConfig && group.questJsonConfig.quests) {
      const quests = group.questJsonConfig.quests;
      console.log(`✓ questJsonConfig has ${quests.length} quests`);
      console.log('\nQuest titles:');
      quests.forEach((quest, index) => {
        console.log(`  ${index + 1}. ${quest.questId || quest.id || 'No ID'}: ${quest.title}`);
      });
    } else {
      console.log('✗ No questJsonConfig.quests found');
    }
    
    console.log('\n--- Checking student quest configs ---');
    if (group.students && group.students.length > 0) {
      console.log(`Total students: ${group.students.length}`);
      
      // Sample first student to verify their config
      const firstStudent = group.students[0];
      console.log(`\nFirst student: ${firstStudent.username || firstStudent.email || 'Unknown'}`);
      
      if (firstStudent.questJsonConfig && firstStudent.questJsonConfig.quests) {
        console.log(`  ✓ Student has ${firstStudent.questJsonConfig.quests.length} quests`);
      } else {
        console.log(`  ✗ Student has no questJsonConfig.quests`);
      }
    } else {
      console.log('No students in this class');
    }

  } catch (error) {
    console.error('Error verifying class:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed.');
  }
}

verifyClassConfig();

