const mongoose = require('mongoose');
const Task = require('./backend/models/TaskModel');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/oss-management', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

async function testCustomApiCallFields() {
    try {
        console.log('🔍 Testing Custom API Call Fields...');
        
        // Find all tasks with type 'custom-api-call'
        const customApiTasks = await Task.find({ type: 'custom-api-call' });
        
        console.log(`📊 Found ${customApiTasks.length} custom-api-call tasks`);
        
        if (customApiTasks.length === 0) {
            console.log('❌ No custom-api-call tasks found in database');
            console.log('💡 You need to create a quest with custom-api-call task type first');
            return;
        }
        
        // Check each task
        customApiTasks.forEach((task, index) => {
            console.log(`\n📋 Task ${index + 1}:`);
            console.log(`   ID: ${task._id}`);
            console.log(`   Title: ${task.taskTitle}`);
            console.log(`   Type: ${task.type}`);
            console.log(`   Answer Type: ${task.answerType}`);
            console.log(`   API Endpoint: ${task.apiEndpoint || '❌ MISSING'}`);
            console.log(`   Response Path: ${task.responsePath || '❌ MISSING'}`);
            console.log(`   Expected Answer Type: ${task.expectedAnswerType || '❌ MISSING'}`);
            console.log(`   Repository: ${task.repository || '❌ MISSING'}`);
            console.log(`   OSS Repository: ${task.ossRepository || '❌ MISSING'}`);
        });
        
        // Also check all tasks to see what types exist
        const allTasks = await Task.find({});
        const taskTypes = {};
        allTasks.forEach(task => {
            const type = task.type || 'unknown';
            taskTypes[type] = (taskTypes[type] || 0) + 1;
        });
        
        console.log('\n📈 All Task Types in Database:');
        Object.entries(taskTypes).forEach(([type, count]) => {
            console.log(`   ${type}: ${count} tasks`);
        });
        
    } catch (error) {
        console.error('❌ Error testing custom API call fields:', error);
    } finally {
        mongoose.connection.close();
    }
}

testCustomApiCallFields(); 