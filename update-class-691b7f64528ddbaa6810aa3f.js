require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Import the Group model
const Group = require('./backend/models/GroupModel');

const MONGODB_URI = process.env.MONGODB_URI;
const CLASS_ID = '691b7f64528ddbaa6810aa3f';

async function updateClassAndStudents() {
  try {
    console.log('🔄 Updating class and all students...\n');
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB successfully!\n');

    // Read the Q1 configuration with 6 tasks
    const configPath = path.join(__dirname, 'shared-quest-configs', 'q1-github-basics-config.json');
    const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));

    console.log(`📋 Config to apply:`);
    console.log(`   Quests: ${configData.questSequence.length}`);
    if (configData.questSequence[0]) {
      const q1 = configData.questSequence[0];
      const taskCount = q1.tasks ? Object.keys(q1.tasks).length : 0;
      console.log(`   Q1: "${q1.title}" with ${taskCount} tasks\n`);
    }

    // Find the class
    const group = await Group.findById(CLASS_ID);
    
    if (!group) {
      console.log(`❌ ERROR: Class ${CLASS_ID} not found in database!`);
      return;
    }

    console.log(`✅ Found class: ${group.groupName} (ID: ${CLASS_ID})`);
    console.log(`   Students: ${group.students ? group.students.length : 0}\n`);
    
    // Update the class questJsonConfig
    console.log('📝 Updating class questJsonConfig...');
    group.questJsonConfig = configData;
    
    // Update all students' questJsonConfig
    if (group.students && group.students.length > 0) {
      console.log(`📝 Updating ${group.students.length} students...\n`);
      
      group.students.forEach((student, index) => {
        const studentName = student.username || student.githubUsername || student.email || `Student ${index + 1}`;
        student.questJsonConfig = configData;
        console.log(`   ${index + 1}. ✅ ${studentName}`);
      });
    } else {
      console.log('⚠️  No students to update\n');
    }
    
    // Save the group with all updates
    console.log('\n💾 Saving changes to database...');
    await group.save();
    
    console.log('\n✅ Successfully updated class and all students!');
    console.log(`   Class: ${group.groupName}`);
    console.log(`   Students updated: ${group.students ? group.students.length : 0}`);
    console.log(`   Quest count: ${configData.questSequence.length}`);
    
    if (configData.questSequence[0]) {
      const q1 = configData.questSequence[0];
      const taskCount = q1.tasks ? Object.keys(q1.tasks).length : 0;
      console.log(`   Q1: "${q1.title}" with ${taskCount} tasks`);
    }

  } catch (error) {
    console.error('❌ Error updating class:', error);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed.');
  }
}

updateClassAndStudents();

