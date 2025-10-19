const mongoose = require('mongoose');
const GroupModel = require('../backend/models/GroupModel');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/oss-management';

async function findGroup() {
    try {
        // Connect to MongoDB
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Search for groups that might contain the partial ID
        const searchTerm = '68c1377d73acd40854c5671a';
        console.log(`Searching for groups containing: ${searchTerm}`);
        
        // Try different search patterns
        const patterns = [
            searchTerm,
            searchTerm.substring(0, 10), // First 10 chars
            searchTerm.substring(0, 15), // First 15 chars
            searchTerm.substring(0, 20), // First 20 chars
        ];

        for (const pattern of patterns) {
            console.log(`\nSearching for pattern: ${pattern}`);
            
            // Search by _id
            let groups = await GroupModel.find({ _id: { $regex: pattern } });
            if (groups.length > 0) {
                console.log(`Found ${groups.length} groups by _id:`);
                groups.forEach(group => {
                    console.log(`  - ${group._id}: ${group.groupName}`);
                });
            }

            // Search by groupName
            groups = await GroupModel.find({ groupName: { $regex: pattern, $options: 'i' } });
            if (groups.length > 0) {
                console.log(`Found ${groups.length} groups by groupName:`);
                groups.forEach(group => {
                    console.log(`  - ${group._id}: ${group.groupName}`);
                });
            }
        }

        // Also show all groups for reference
        console.log('\nAll groups in database:');
        const allGroups = await GroupModel.find({}).select('_id groupName').limit(20);
        allGroups.forEach(group => {
            console.log(`  - ${group._id}: ${group.groupName}`);
        });

    } catch (error) {
        console.error('Error finding group:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

// Run the script
findGroup();



