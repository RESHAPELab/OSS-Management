const mongoose = require('mongoose');
const GroupModel = require('../backend/models/GroupModel');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/oss-management';

async function listAllClasses() {
    try {
        // Connect to MongoDB
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Get all groups
        const groups = await GroupModel.find({}).select('_id groupName classCode createdAt').sort({ createdAt: -1 });
        
        console.log(`\n📋 Found ${groups.length} classes:`);
        console.log('=====================================');
        
        groups.forEach((group, index) => {
            console.log(`${index + 1}. ID: ${group._id}`);
            console.log(`   Name: ${group.groupName}`);
            console.log(`   Code: ${group.classCode}`);
            console.log(`   Created: ${group.createdAt}`);
            console.log('');
        });
        
        // Check if any groups have quest configurations
        console.log('🔍 Checking for quest configurations...');
        const groupsWithQuests = await GroupModel.find({ 
            $or: [
                { questJsonConfig: { $exists: true, $ne: null } },
                { questOrder: { $exists: true, $not: { $size: 0 } } }
            ]
        }).select('_id groupName questJsonConfig questOrder');
        
        console.log(`\n📊 ${groupsWithQuests.length} classes with quest configurations:`);
        groupsWithQuests.forEach(group => {
            const questCount = group.questOrder?.length || 0;
            const hasJsonConfig = !!group.questJsonConfig;
            console.log(`  - ${group._id}: ${group.groupName} (${questCount} quests, JSON: ${hasJsonConfig})`);
        });
        
    } catch (error) {
        console.error('Error listing classes:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

// Run the script
listAllClasses();
