require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Import the Group model
const Group = require('./backend/models/GroupModel');

const MONGODB_URI = process.env.MONGODB_URI;
const AT_LAST_CLASS_ID = '692735b4668a78a28bcf7c3e';

async function updateAtLastClass() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB successfully!\n');

    // Read the Q1 configuration with 6 tasks
    const configPath = path.join(__dirname, 'shared-quest-configs', 'q1-github-basics-config.json');
    const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));

    console.log(`Updating class ${AT_LAST_CLASS_ID}...`);
    
    // Find and update the specific class
    const group = await Group.findById(AT_LAST_CLASS_ID);
    
    if (!group) {
      console.log(`ERROR: Class ${AT_LAST_CLASS_ID} not found in database!`);
      return;
    }

    console.log(`Found class: ${group.groupName}`);
    console.log(`Current quest count: ${group.questJsonConfig?.questSequence?.length || 0}`);
    
    // Update the questJsonConfig
    group.questJsonConfig = configData;
    await group.save();
    
    console.log(`\n✓ Successfully updated class ${AT_LAST_CLASS_ID} (${group.groupName})`);
    console.log(`  New quest count: ${configData.questSequence.length}`);
    
    if (configData.questSequence[0]) {
      const q1 = configData.questSequence[0];
      const taskCount = q1.tasks ? Object.keys(q1.tasks).length : 0;
      console.log(`  Q1: "${q1.title}" with ${taskCount} tasks`);
    }

  } catch (error) {
    console.error('Error updating class:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed.');
  }
}

updateAtLastClass();

