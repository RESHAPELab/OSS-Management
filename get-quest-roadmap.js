const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Script to get quest roadmap from the database
async function getQuestRoadmap() {
    const baseURL = 'http://localhost:8080';
    
    try {
        console.log('🗺️ FETCHING QUEST ROADMAP');
        console.log('==========================');
        
        // 1. Get production status to see which organization is being used
        console.log('\n1. Checking organization configuration...');
        const orgResponse = await axios.get(`${baseURL}/api/repo/prodStatus`);
        const organizationGh = orgResponse.data.organizationGh;
        console.log(`✅ Organization: ${organizationGh}`);
        
        // 2. List all repositories to see student repos
        console.log('\n2. Listing all repositories...');
        const reposResponse = await axios.get(`${baseURL}/api/repo/listRepos`, {
            params: { organizationGh }
        });
        
        const allRepos = reposResponse.data.repos || [];
        console.log(`✅ Total repositories: ${allRepos.length}`);
        
        if (allRepos.length > 0) {
            console.log('\n📋 All repositories:');
            allRepos.forEach((repo, index) => {
                console.log(`   ${index + 1}. ${repo.name} (${repo.private ? 'private' : 'public'})`);
            });
        }
        
        // 3. Check for student repositories (class-name-username pattern)
        console.log('\n3. Analyzing student repositories...');
        const studentRepos = allRepos.filter(repo => {
            // Look for repositories that follow the class-name-username pattern
            return repo.name.includes('-') && repo.name.split('-').length >= 2;
        });
        
        console.log(`✅ Student repositories found: ${studentRepos.length}`);
        
        if (studentRepos.length > 0) {
            console.log('\n👥 Student repositories:');
            studentRepos.forEach((repo, index) => {
                console.log(`   ${index + 1}. ${repo.name}`);
            });
            
            // 4. Check quest issues in the first student repository
            if (studentRepos.length > 0) {
                const sampleRepo = studentRepos[0];
                console.log(`\n4. Checking quest issues in ${sampleRepo.name}...`);
                
                try {
                    // This would require GitHub API access to check issues
                    console.log(`🔍 To check quest issues, you would need to access: https://github.com/${organizationGh}/${sampleRepo.name}/issues`);
                    
                    // Dynamically read quest sequence from JSON
                    const questSequencePath = path.join(__dirname, 'backend/config/quest-sequence.json');
                    let questList = 'Q0, Q4, Q5, Q1, Q2, Q3, custom quests'; // fallback
                    
                    if (fs.existsSync(questSequencePath)) {
                        const questConfig = JSON.parse(fs.readFileSync(questSequencePath, 'utf8'));
                        const questIds = questConfig.questSequence.map(quest => quest.questId);
                        questList = questIds.join(', ') + ', custom quests';
                    }
                    
                    console.log(`📋 This would show all quest issues (${questList})`);
                } catch (error) {
                    console.log('❌ Could not check quest issues (requires GitHub API access)');
                }
            }
        }
        
        // 5. Check database for quest data
        console.log('\n5. Checking database for quest data...');
        try {
            // You would need to add an API endpoint to get quest data
            console.log('📊 To get quest data from database, you would need:');
            console.log('   - API endpoint to fetch quests by professor');
            console.log('   - API endpoint to fetch quest order');
            console.log('   - API endpoint to fetch dynamic config');
        } catch (error) {
            console.log('❌ Could not check database (no API endpoint available)');
        }
        
        console.log('\n✅ Quest roadmap analysis complete!');
        
    } catch (error) {
        console.error('❌ Error fetching quest roadmap:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

// Run the script
getQuestRoadmap(); 