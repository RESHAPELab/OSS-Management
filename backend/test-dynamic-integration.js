const axios = require('axios');
const fs = require('fs');
const path = require('path');

const baseURL = 'http://localhost:8080';

async function testDynamicQuestIntegration() {
    console.log('🧪 Testing Dynamic Quest Integration...\n');
    
    try {
        // Step 1: Test class ID lookup from repository name
        console.log('1️⃣ Testing class ID lookup...');
        const testRepoName = 'cs-277-oss-in-theory-testuser';
        const classResponse = await axios.get(`${baseURL}/api/group/repo/${testRepoName}/class`);
        
        if (classResponse.data.success) {
            console.log('✅ Class ID lookup successful');
            console.log(`   Class ID: ${classResponse.data.data.classId}`);
            console.log(`   Class Code: ${classResponse.data.data.classCode}`);
        } else {
            console.log('❌ Class ID lookup failed');
            return;
        }
        
        const classId = classResponse.data.data.classId;
        
        // Step 2: Test dynamic config generation
        console.log('\n2️⃣ Testing dynamic config generation...');
        const configResponse = await axios.post(`${baseURL}/api/quest-config/generate/${classId}`);
        
        if (configResponse.data.success) {
            console.log('✅ Dynamic config generation successful');
            console.log(`   Config Path: ${configResponse.data.data.configPath}`);
            console.log(`   Quest Count: ${configResponse.data.data.questCount}`);
        } else {
            console.log('❌ Dynamic config generation failed');
            return;
        }
        
        // Step 3: Verify config file exists
        console.log('\n3️⃣ Verifying config file exists...');
        const configPath = configResponse.data.data.configPath;
        if (fs.existsSync(configPath)) {
            console.log('✅ Config file exists');
            
            // Read and display config structure
            const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            console.log(`   Total Quests: ${config.quests.length}`);
            console.log(`   Fixed Quests: ${config.quests.filter(q => q.type === 'fixed').length}`);
            console.log(`   Custom Quests: ${config.quests.filter(q => q.type === 'custom').length}`);
            
            // Display quest order
            console.log('\n   Quest Order:');
            config.quests.forEach((quest, index) => {
                console.log(`   ${index + 1}. ${quest.id} - ${quest.title} (${quest.type})`);
                if (quest.prerequisites && quest.prerequisites.length > 0) {
                    console.log(`      Prerequisites: ${quest.prerequisites.map(p => p.questId).join(', ')}`);
                }
            });
        } else {
            console.log('❌ Config file not found');
            return;
        }
        
        // Step 4: Test bot config loading simulation
        console.log('\n4️⃣ Testing bot config loading simulation...');
        const botConfigPath = path.join(__dirname, '../OSS-Doorway/src/config/generated', `quest_config_${classId}.json`);
        
        if (fs.existsSync(botConfigPath)) {
            console.log('✅ Bot can access config file');
            
            // Simulate bot loading
            const botConfig = JSON.parse(fs.readFileSync(botConfigPath, 'utf8'));
            console.log(`   Bot loaded ${botConfig.quests.length} quests`);
            
            // Test quest structure
            const firstQuest = botConfig.quests[0];
            console.log(`   First quest: ${firstQuest.id} - ${firstQuest.title}`);
            console.log(`   Tasks: ${firstQuest.tasks ? firstQuest.tasks.length : 0}`);
        } else {
            console.log('❌ Bot cannot access config file');
            return;
        }
        
        console.log('\n🎉 All tests passed! Dynamic quest integration is working.');
        console.log('\n📋 Summary:');
        console.log('   ✅ Class ID lookup from repository name');
        console.log('   ✅ Dynamic config generation');
        console.log('   ✅ Config file creation');
        console.log('   ✅ Bot config accessibility');
        console.log('\n🚀 The bot is ready to use custom quest roadmaps!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
        console.log('\n🔧 Troubleshooting:');
        console.log('   1. Ensure the management backend is running on port 8080');
        console.log('   2. Ensure the bot can access the generated config directory');
        console.log('   3. Check that a class exists with the test repository pattern');
        console.log('   4. Verify quest order and custom quests are saved in the database');
    }
}

// Run the test
testDynamicQuestIntegration(); 