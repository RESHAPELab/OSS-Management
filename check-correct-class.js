require('dotenv').config();
const mongoose = require('mongoose');

// Import the Group model
const Group = require('./backend/models/GroupModel');

const MONGODB_URI = process.env.MONGODB_URI;
const CORRECT_CLASS_ID = '692735b4668a78a28bcf7c3e';

async function checkCorrectClass() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB successfully!\n');

    // Find the correct class
    const group = await Group.findById(CORRECT_CLASS_ID);
    
    if (!group) {
      console.log(`ERROR: Class ${CORRECT_CLASS_ID} not found in database!`);
      return;
    }

    console.log(`Class: ${group.groupName} (ID: ${CORRECT_CLASS_ID})`);
    console.log(`Number of students: ${group.students ? group.students.length : 0}\n`);
    
    // Check class quest config
    if (group.questJsonConfig) {
      if (group.questJsonConfig.questSequence) {
        console.log(`Class has ${group.questJsonConfig.questSequence.length} quests in questSequence`);
      } else if (group.questJsonConfig.quests) {
        console.log(`Class has ${group.questJsonConfig.quests.length} quests`);
      } else {
        console.log('Class quest config keys:', Object.keys(group.questJsonConfig));
      }
    }
    
    // Find the student misanetc
    console.log('\n--- Looking for student: misanetc ---');
    if (group.students && group.students.length > 0) {
      const misanetcStudent = group.students.find(s => 
        s.username === 'misanetc' || 
        s.githubUsername === 'misanetc' ||
        s.email?.includes('misanetc')
      );
      
      if (misanetcStudent) {
        console.log('✓ Found student misanetc');
        console.log('Student data keys:', Object.keys(misanetcStudent));
        
        if (misanetcStudent.questJsonConfig) {
          if (misanetcStudent.questJsonConfig.questSequence) {
            console.log(`Student has ${misanetcStudent.questJsonConfig.questSequence.length} quests`);
          } else if (misanetcStudent.questJsonConfig.quests) {
            console.log(`Student has ${misanetcStudent.questJsonConfig.quests.length} quests`);
            
            // Check Q1
            const q1 = misanetcStudent.questJsonConfig.quests.find(q => q.questId === 'Q1' || q.id === 'Q1');
            if (q1) {
              const taskCount = q1.tasks ? Object.keys(q1.tasks).length : 0;
              console.log(`\nQ1 found: "${q1.title}"`);
              console.log(`Q1 has ${taskCount} tasks`);
            }
          } else {
            console.log('Student quest config keys:', Object.keys(misanetcStudent.questJsonConfig));
          }
        } else {
          console.log('✗ Student has no questJsonConfig');
        }
      } else {
        console.log('✗ Student misanetc not found');
        console.log('\nAll students:');
        group.students.forEach((s, i) => {
          console.log(`  ${i + 1}. ${s.username || s.githubUsername || s.email || 'Unknown'}`);
        });
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed.');
  }
}

checkCorrectClass();

