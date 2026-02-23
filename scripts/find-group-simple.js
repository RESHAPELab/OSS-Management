const mongoose = require('mongoose');
const GroupModel = require('../backend/models/GroupModel');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/oss-management';

async function findGroupSimple() {
    try {
        // Connect to MongoDB
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Show all groups for reference
        console.log('All groups in database:');
        const allGroups = await GroupModel.find({}).select('_id groupName createdAt').limit(50);
        allGroups.forEach(group => {
            console.log(`  - ${group._id}: ${group.groupName} (${group.createdAt})`);
        });

        // Try to find the exact group ID
        const exactId = '68c1377d73acd40854c5671a';
        console.log(`\nTrying to find exact ID: ${exactId}`);
        
        try {
            const group = await GroupModel.findById(exactId);
            if (group) {
                console.log(`✅ Found exact match: ${group._id}: ${group.groupName}`);
                console.log('Quest order:');
                group.questOrder.forEach((quest, index) => {
                    console.log(`  ${index}: ${quest.questId} - ${quest.title}`);
                    if (quest.prerequisites && quest.prerequisites.length > 0) {
                        quest.prerequisites.forEach(prereq => {
                            console.log(`    Prerequisite: ${prereq.questId}`);
                        });
                    }
                });
            } else {
                console.log('❌ Exact ID not found');
            }
        } catch (error) {
            console.log('❌ Invalid ObjectId format');
        }

    } catch (error) {
        console.error('Error finding group:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

// Run the script
findGroupSimple();



