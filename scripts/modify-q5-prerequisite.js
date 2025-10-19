const mongoose = require('mongoose');
const GroupModel = require('../backend/models/GroupModel');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/oss-management';

async function modifyQ5Prerequisite() {
    try {
        // Connect to MongoDB
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const groupId = '68c1377d73acd40854c5671a';
        
        // Find the group
        const group = await GroupModel.findById(groupId);
        if (!group) {
            console.error(`Group with ID ${groupId} not found`);
            return;
        }

        console.log(`Found group: ${group.groupName}`);
        console.log('Current quest order:');
        group.questOrder.forEach((quest, index) => {
            console.log(`${index}: ${quest.questId} - ${quest.title}`);
            if (quest.prerequisites && quest.prerequisites.length > 0) {
                quest.prerequisites.forEach(prereq => {
                    console.log(`  Prerequisite: ${prereq.questId}`);
                });
            }
        });

        // Find Q5 in the quest order
        const q5Index = group.questOrder.findIndex(quest => quest.questId === 'Q5');
        if (q5Index === -1) {
            console.error('Q5 not found in quest order');
            return;
        }

        console.log(`\nFound Q5 at index ${q5Index}`);
        console.log('Current Q5 prerequisites:', group.questOrder[q5Index].prerequisites);

        // Update Q5's prerequisite to Q3
        group.questOrder[q5Index].prerequisites = [{
            questId: 'Q3',
            type: 'completion',
            required: true,
            description: 'Complete Q3 first',
            minScore: 0
        }];

        console.log('Updated Q5 prerequisites to:', group.questOrder[q5Index].prerequisites);

        // Save the changes
        await group.save();
        console.log('\n✅ Successfully updated Q5 prerequisite to Q3');

        // Display final quest order
        console.log('\nFinal quest order:');
        group.questOrder.forEach((quest, index) => {
            console.log(`${index}: ${quest.questId} - ${quest.title}`);
            if (quest.prerequisites && quest.prerequisites.length > 0) {
                quest.prerequisites.forEach(prereq => {
                    console.log(`  Prerequisite: ${prereq.questId}`);
                });
            }
        });

    } catch (error) {
        console.error('Error modifying Q5 prerequisite:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

// Run the script
modifyQ5Prerequisite();



