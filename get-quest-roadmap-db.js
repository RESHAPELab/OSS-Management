const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.URI);
        console.log('✅ Connected to MongoDB');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
};

// Import models
const Quest = require('./backend/models/QuestModel');
const Task = require('./backend/models/TaskModel');
const Group = require('./backend/models/GroupModel');
const Professor = require('./backend/models/ProfessorModel');

async function getQuestRoadmapFromDB(classId = null) {
    try {
        await connectDB();
        
        console.log('🗺️ FETCHING QUEST ROADMAP FROM DATABASE');
        console.log('========================================');
        
        if (classId) {
            console.log(`🎯 Looking for class/group ID: ${classId}`);
        } else {
            console.log('📋 Showing all classes and their quest roadmaps');
        }
        
        // 1. Get specific group or all groups
        console.log('\n1. Fetching group(s)...');
        let groups;
        if (classId) {
            groups = await Group.findById(classId).populate('questOrder');
            if (!groups) {
                console.log(`❌ Group with ID ${classId} not found`);
                return;
            }
            groups = [groups]; // Make it an array for consistent processing
        } else {
            groups = await Group.find({}).populate('questOrder');
        }
        
        console.log(`✅ Found ${groups.length} group(s)`);
        
        if (groups.length > 0) {
            console.log('\n🏫 Groups and their quest roadmaps:');
            groups.forEach((group, index) => {
                console.log(`\n   ${index + 1}. ${group.name} (ID: ${group._id})`);
                console.log(`      Class Code: ${group.classCode || 'N/A'}`);
                console.log(`      Professor: ${group.professor || 'N/A'}`);
                console.log(`      Quest order: ${group.questOrder ? group.questOrder.length : 0} quests`);
                
                if (group.questOrder && group.questOrder.length > 0) {
                    console.log(`      📋 Quest Roadmap:`);
                    group.questOrder.forEach((quest, qIndex) => {
                        const questTitle = quest.title || quest.questTitle || 'Unknown Quest';
                        const questType = quest.type || 'custom';
                        const isQ0 = quest.isQ0 ? ' (Q0 - Fixed)' : '';
                        console.log(`         ${qIndex + 1}. ${questTitle} (${questType})${isQ0}`);
                        
                        // Show prerequisites if available
                        if (quest.prerequisites && quest.prerequisites.length > 0) {
                            console.log(`            Prerequisites: ${quest.prerequisites.join(', ')}`);
                        } else {
                            console.log(`            Prerequisites: None`);
                        }

                        // Show tasks for this quest (if available)
                        if (quest.tasks && quest.tasks.length > 0) {
                            console.log(`            Tasks:`);
                            quest.tasks.forEach((task, tIndex) => {
                                // MCQ detection: if options and correctAnswer exist
                                const isMCQ = Array.isArray(task.options) && task.options.length === 4 && task.answer;
                                if (isMCQ) {
                                    console.log(`               ${tIndex + 1}. [MCQ] ${task.taskTitle}`);
                                    console.log(`                  Options:`);
                                    task.options.forEach((opt, oIdx) => {
                                        const optLabel = String.fromCharCode(65 + oIdx); // A, B, C, D
                                        console.log(`                     ${optLabel}) ${opt}`);
                                    });
                                    console.log(`                  Correct Answer: ${task.answer}`);
                                } else {
                                    console.log(`               ${tIndex + 1}. ${task.taskTitle} (${task.type || 'Task'})`);
                                }
                            });
                        }
                    });
                } else {
                    console.log(`      📋 No quests in roadmap yet`);
                }
            });
        }
        
        // 2. Get quests for the specific group's professor (if classId provided)
        if (classId && groups.length > 0) {
            const group = groups[0];
            if (group.professor) {
                console.log('\n2. Fetching quests for this class\'s professor...');
                const quests = await Quest.find({ professor: group.professor }).populate('tasks');
                console.log(`✅ Found ${quests.length} quests for professor`);
                
                if (quests.length > 0) {
                    console.log('\n📋 Available quests:');
                    quests.forEach((quest, index) => {
                        console.log(`   ${index + 1}. ${quest.questTitle} (ID: ${quest._id})`);
                        console.log(`      Tasks: ${quest.tasks.length}`);
                        console.log(`      Created: ${quest.createdAt}`);
                        console.log('');
                    });
                }
            }
        }
        
        // 3. Get all quests (if no classId specified)
        if (!classId) {
            console.log('\n3. Fetching all quests...');
            const quests = await Quest.find({}).populate('tasks');
            console.log(`✅ Total quests in database: ${quests.length}`);
            
            if (quests.length > 0) {
                console.log('\n📋 All quests:');
                quests.forEach((quest, index) => {
                    console.log(`   ${index + 1}. ${quest.questTitle} (ID: ${quest._id})`);
                    console.log(`      Tasks: ${quest.tasks.length}`);
                    console.log(`      Professor: ${quest.professor}`);
                    console.log(`      Created: ${quest.createdAt}`);
                    console.log('');
                });
            }
        }
        
        // 4. Get tasks for the specific group (if classId provided)
        if (classId && groups.length > 0) {
            const group = groups[0];
            console.log('\n4. Fetching tasks for this class...');
            const tasks = await Task.find({ group: group._id }).populate('quest');
            console.log(`✅ Found ${tasks.length} tasks for this class`);
            
            if (tasks.length > 0) {
                console.log('\n📝 Tasks in this class:');
                tasks.forEach((task, index) => {
                    console.log(`   ${index + 1}. ${task.taskTitle}`);
                    console.log(`      Quest: ${task.quest ? task.quest.questTitle : 'Unknown'}`);
                    console.log(`      Points: ${task.points}, XP: ${task.xp}`);
                    console.log(`      Answer: ${task.answer}`);
                    console.log('');
                });
            }
        }
        
        console.log('\n✅ Quest roadmap database analysis complete!');
        
        // Show usage instructions
        if (!classId) {
            console.log('\n💡 Usage:');
            console.log('   To see quest roadmap for a specific class:');
            console.log('   node get-quest-roadmap-db.js <classId>');
            console.log('');
            console.log('   Example:');
            console.log('   node get-quest-roadmap-db.js 507f1f77bcf86cd799439011');
        }
        
    } catch (error) {
        console.error('❌ Error fetching quest roadmap from database:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

// Get class ID from command line arguments
const classId = process.argv[2] || null;

// Run the script
getQuestRoadmapFromDB(classId); 