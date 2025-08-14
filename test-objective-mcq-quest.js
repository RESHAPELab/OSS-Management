const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

// Test to get data for the "objective mcq" quest
async function testObjectiveMCQQuest() {
    try {
        console.log('🔍 [TEST] Getting data for "objective mcq" quest...\n');
        
        const baseURL = 'http://localhost:8080';
        const questId = '687d23c0a735237593ee3665'; // "objective mcq" quest ID
        const professorId = '682b47e28fbdb969977ce8aa'; // Professor who created the quest
        
        console.log('📊 [TEST] Quest Details:');
        console.log(`   🎯 Quest ID: ${questId}`);
        console.log(`   👨‍🏫 Professor ID: ${professorId}\n`);
        
        // Connect to database for direct access
        console.log('🔌 [DB] Connecting to database...');
        const mongoURI = process.env.URI;
        await mongoose.connect(mongoURI);
        console.log('✅ [DB] Connected to database\n');
        
        const db = mongoose.connection.db;
        
        // Step 1: Get the specific quest directly from database
        console.log('📋 [STEP 1] Fetching quest from database...');
        const quest = await db.collection('quests').findOne({ _id: new mongoose.Types.ObjectId(questId) });
        
        if (quest) {
            console.log(`✅ [STEP 1] Found quest: "${quest.questTitle}"`);
            console.log(`   📌 Quest ID: ${quest._id}`);
            console.log(`   👨‍🏫 Professor: ${quest.professor}`);
            console.log(`   📅 Created: ${new Date(quest.createdAt).toLocaleDateString()}`);
            console.log(`   📋 Tasks: ${quest.tasks ? quest.tasks.length : 0}`);
            
            if (quest.tasks && quest.tasks.length > 0) {
                console.log(`\n   📋 [TASK DETAILS]:`);
                quest.tasks.forEach((task, taskIndex) => {
                    console.log(`      🎯 Task ${taskIndex + 1}:`);
                    console.log(`         📝 Task Title: ${task.taskTitle || 'N/A'}`);
                    console.log(`         📄 Description: "${task.desc || 'N/A'}"`);
                    console.log(`         🎯 Points: ${task.points || 'N/A'}`);
                    console.log(`         💎 XP: ${task.xp || 'N/A'}`);
                    console.log(`         ✅ Answer: "${task.answer || 'N/A'}"`);
                    console.log(`         📋 Answer Type: ${task.answerType || 'N/A'}`);
                    
                    // Check for response data
                    if (task.responses) {
                        console.log(`         📨 Has Accept Response: ${!!task.responses.accept}`);
                        console.log(`         ✅ Has Success Response: ${!!task.responses.success}`);
                        console.log(`         ❌ Has Error Response: ${!!task.responses.error}`);
                        
                        if (task.responses.accept) {
                            const acceptPreview = task.responses.accept.substring(0, 300);
                            console.log(`         📨 Accept Response: "${acceptPreview}..."`);
                        }
                        
                        if (task.responses.success) {
                            const successPreview = task.responses.success.substring(0, 200);
                            console.log(`         ✅ Success Response: "${successPreview}..."`);
                        }
                        
                        if (task.responses.error) {
                            const errorPreview = task.responses.error.substring(0, 200);
                            console.log(`         ❌ Error Response: "${errorPreview}..."`);
                        }
                    }
                    
                    // Check hints
                    if (task.hints && task.hints.length > 0) {
                        console.log(`         💡 Hints: ${task.hints.length}`);
                        task.hints.forEach((hint, hintIndex) => {
                            console.log(`            💡 Hint ${hintIndex + 1}: "${hint.content || 'N/A'}" (penalty: ${hint.penalty || 'N/A'})`);
                        });
                    }
                    
                    console.log('');
                });
            } else {
                console.log(`   ⚠️ No tasks found for this quest`);
            }
        } else {
            console.log('❌ [STEP 1] Quest not found in database');
        }
        
        console.log('\n');
        
        // Step 2: Test the API endpoint
        console.log('📋 [STEP 2] Testing quest API...');
        try {
            const response = await axios.get(`${baseURL}/api/quest/professor/${professorId}`);
            
            if (response.data.success) {
                const objectiveMCQ = response.data.data.find(q => q._id === questId);
                
                if (objectiveMCQ) {
                    console.log(`✅ [STEP 2] Found quest via API: "${objectiveMCQ.questTitle}"`);
                    console.log(`   📋 Tasks: ${objectiveMCQ.tasks ? objectiveMCQ.tasks.length : 0}`);
                    
                    if (objectiveMCQ.tasks && objectiveMCQ.tasks.length > 0) {
                        console.log(`   📋 [API TASK DETAILS]:`);
                        objectiveMCQ.tasks.forEach((task, taskIndex) => {
                            console.log(`      🎯 Task ${taskIndex + 1}:`);
                            console.log(`         📝 Task Title: ${task.taskTitle || 'N/A'}`);
                            console.log(`         📄 Description: "${task.desc || 'N/A'}"`);
                            console.log(`         🎯 Points: ${task.points || 'N/A'}`);
                            console.log(`         💎 XP: ${task.xp || 'N/A'}`);
                            console.log(`         ✅ Answer: "${task.answer || 'N/A'}"`);
                            console.log(`         📋 Answer Type: ${task.answerType || 'N/A'}`);
                            
                            if (task.responses) {
                                console.log(`         📨 Has Responses: accept=${!!task.responses.accept}, success=${!!task.responses.success}, error=${!!task.responses.error}`);
                            }
                        });
                    }
                } else {
                    console.log('❌ [STEP 2] Quest not found via API');
                }
            } else {
                console.log('❌ [STEP 2] API failed:', response.data.message);
            }
        } catch (error) {
            console.log('❌ [STEP 2] API error:', error.response?.status, error.response?.data);
        }
        
        console.log('\n');
        
        // Step 3: Test quest configuration generation
        console.log('📋 [STEP 3] Testing quest configuration generation...');
        
        if (quest && quest.tasks && quest.tasks.length > 0) {
            console.log('🎯 [STEP 3] Simulating quest configuration for bot...');
            
            // Transform the quest like the frontend does
            const transformedTasks = {};
            quest.tasks.forEach((task, taskIndex) => {
                const taskKey = `T${taskIndex + 1}`;
                
                // Enhanced task data extraction
                let taskDesc = 'Task description';
                let taskPoints = 100;
                let taskXp = 100;
                let taskType = 'multiple-choice';
                let taskAnswer = 'a';
                let acceptResponse = task.responses?.accept || task.accept || 'Complete this task';
                
                // Try to extract description from various possible field names
                if (task.desc && task.desc !== 'N/A') taskDesc = task.desc;
                else if (task.description && task.description !== 'N/A') taskDesc = task.description;
                else if (task.taskTitle && task.taskTitle !== 'N/A') taskDesc = task.taskTitle;
                else if (task.title && task.title !== 'N/A') taskDesc = task.title;
                
                // Extract other task properties
                if (task.points && task.points !== 'N/A') taskPoints = task.points;
                if (task.xp && task.xp !== 'N/A') taskXp = task.xp;
                else if (task.points && task.points !== 'N/A') taskXp = task.points;
                if (task.answerType === 'singleAnswer') taskType = 'multiple-choice';
                else if (task.type && task.type !== 'N/A') taskType = task.type;
                if (task.answer && task.answer !== 'N/A') taskAnswer = task.answer;
                
                // Enhanced response data extraction
                const successResponse = task.responses?.success || task.success || 'Task completed successfully!';
                const errorResponse = task.responses?.error || task.error || 'Incorrect answer, please try again.';
                
                transformedTasks[taskKey] = {
                    desc: taskDesc,
                    points: taskPoints,
                    xp: taskXp,
                    type: taskType,
                    accept: acceptResponse,
                    success: successResponse,
                    error: errorResponse,
                    answer: taskAnswer,
                    hints: task.hints || [],
                    acceptResponse // <-- Add this field for clarity
                };
                
                console.log(`   📋 [TRANSFORMED-${taskKey}] Bot will receive:`, {
                    desc: transformedTasks[taskKey].desc,
                    points: transformedTasks[taskKey].points,
                    xp: transformedTasks[taskKey].xp,
                    type: transformedTasks[taskKey].type,
                    answer: transformedTasks[taskKey].answer,
                    acceptResponse: acceptResponse,
                    hasAccept: acceptResponse.length > 20,
                    hasSuccess: successResponse.length > 20,
                    hasError: errorResponse.length > 20
                });
            });
            
            // Create the quest configuration entry
            const questConfigEntry = {
                questId: quest._id,
                title: quest.questTitle,
                isQ0: false,
                questType: 'custom',
                sequenceNumber: 4, // After Q0, Q1, Q2, Q3
                metadata: {
                    title: quest.questTitle,
                    description: quest.questTitle,
                    prerequisite: "Q3",
                    type: "custom"
                },
                tasks: transformedTasks
            };
            
            // Print the acceptResponse for the first task for clarity
            if (transformedTasks.T1 && transformedTasks.T1.acceptResponse) {
                console.log('\n📝 [ACCEPT RESPONSE] For T1:');
                console.log(transformedTasks.T1.acceptResponse);
            }
            
            console.log('\n🎯 [FINAL-CONFIG] Quest configuration entry for bot:');
            console.log(JSON.stringify(questConfigEntry, null, 2));
            
            console.log('\n📊 [COMPARISON] Expected vs Actual:');
            console.log(`   ✅ Quest Title: "${questConfigEntry.title}"`);
            console.log(`   ✅ Task Description: "${questConfigEntry.tasks.T1.desc}"`);
            console.log(`   ✅ Task Points: ${questConfigEntry.tasks.T1.points}`);
            console.log(`   ✅ Task Answer: "${questConfigEntry.tasks.T1.answer}"`);
            console.log(`   ✅ Task Type: "${questConfigEntry.tasks.T1.type}"`);
            
            console.log('\n🎮 [SUCCESS] This is the data that will be sent to the bot!');
        }
        
        console.log('\n✅ [COMPLETE] "objective mcq" quest data test completed!');
        
    } catch (error) {
        console.error('❌ [ERROR] Test failed:', error.message);
        console.error('📄 [ERROR] Stack:', error.stack);
    } finally {
        if (mongoose.connection.readyState === 1) {
            await mongoose.disconnect();
            console.log('🔌 [DB] Disconnected from database');
        }
    }
}

// Run the test
testObjectiveMCQQuest(); 