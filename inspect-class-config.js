require('dotenv').config();
const mongoose = require('mongoose');

// Import the Group model
const Group = require('./backend/models/GroupModel');

const MONGODB_URI = process.env.MONGODB_URI;
const CLASS_ID = '68a770b8140b9c0174c13ce7';

async function inspectClassConfig() {
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
    
    // Check questJsonConfig structure
    console.log('\n--- questJsonConfig structure ---');
    if (group.questJsonConfig) {
      console.log('questJsonConfig exists');
      console.log('Top level keys:', Object.keys(group.questJsonConfig));
      
      // Check if it's an array directly
      if (Array.isArray(group.questJsonConfig)) {
        console.log(`\n✓ questJsonConfig is an array with ${group.questJsonConfig.length} items`);
        console.log('\nFirst 3 items:');
        group.questJsonConfig.slice(0, 3).forEach((item, index) => {
          console.log(`  ${index + 1}. Keys:`, Object.keys(item).slice(0, 5));
          if (item.questId) console.log(`     Quest ID: ${item.questId}`);
          if (item.title) console.log(`     Title: ${item.title}`);
        });
      } else if (typeof group.questJsonConfig === 'object') {
        console.log('\nquestJsonConfig is an object');
        
        // Try different possible structures
        if (group.questJsonConfig.quests) {
          console.log(`✓ Has 'quests' property with ${group.questJsonConfig.quests.length} quests`);
        }
        
        // Show sample of the data
        console.log('\nSample data (first 1000 chars):');
        console.log(JSON.stringify(group.questJsonConfig, null, 2).substring(0, 1000));
      }
    } else {
      console.log('✗ No questJsonConfig found');
    }

  } catch (error) {
    console.error('Error inspecting class:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed.');
  }
}

inspectClassConfig();

