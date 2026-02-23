require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Import the Group model
const Group = require('./backend/models/GroupModel');

const MONGODB_URI = process.env.MONGODB_URI;
const CLASS_ID = '68a770b8140b9c0174c13ce7';

async function revertSpecificClass() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB successfully!');

    // Read the revert configuration
    const configPath = path.join(__dirname, 'shared-quest-configs', 'revert-class-config-68a770b8140b9c0174c13ce7.json');
    const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));

    console.log(`\nReverting class ${CLASS_ID}...`);
    
    // Find and update the specific class
    const group = await Group.findById(CLASS_ID);
    
    if (!group) {
      console.log(`ERROR: Class ${CLASS_ID} not found in database!`);
      return;
    }

    console.log(`Found class: ${group.groupName}`);
    
    // Update the questJsonConfig
    group.questJsonConfig = configData;
    await group.save();
    
    console.log(`✓ Successfully reverted class ${CLASS_ID} (${group.groupName})`);
    console.log(`  Quest count: ${configData.quests.length}`);

  } catch (error) {
    console.error('Error reverting class:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed.');
  }
}

revertSpecificClass();

