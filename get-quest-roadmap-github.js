const axios = require('axios');
const { getGithubAppInstallationAccessToken } = require('./bot/controllers/githubAppAuth');

// Script to get quest roadmap from GitHub repositories
async function getQuestRoadmapFromGitHub(classId = null) {
    try {
        console.log('🗺️ FETCHING QUEST ROADMAP FROM GITHUB');
        console.log('=====================================');
        
        if (classId) {
            console.log(`🎯 Looking for repositories for class ID: ${classId}`);
        } else {
            console.log('📋 Showing all student repositories');
        }
        
        // Get GitHub access token
        console.log('\n1. Getting GitHub access token...');
        const githubToken = await getGithubAppInstallationAccessToken();
        console.log('✅ GitHub access token obtained');
        
        // Determine organization based on environment
        const organizationGh = process.env.NODE_ENV === 'production' 
            ? process.env.USER_AGENT_PROD 
            : process.env.USER_AGENT_DEV;
        
        console.log(`\n2. Using organization: ${organizationGh}`);
        
        // Get all repositories in the organization
        console.log('\n3. Fetching all repositories...');
        let allRepos = [];
        let page = 1;
        const perPage = 100;
        let keepFetching = true;
        
        while (keepFetching) {
        const reposResponse = await axios.get(
                `https://api.github.com/orgs/${organizationGh}/repos?per_page=${perPage}&page=${page}`,
            {
                headers: {
                    Authorization: `Bearer ${githubToken}`,
                    Accept: 'application/vnd.github.v3+json',
                }
            }
        );
        
            const fetched = reposResponse.data;
            console.log(`📄 Page ${page}: fetched ${Array.isArray(fetched) ? fetched.length : 0} repos`);
            allRepos = allRepos.concat(fetched);
            
            if (!Array.isArray(fetched) || fetched.length < perPage) {
                keepFetching = false;
            } else {
                page++;
            }
        }
        
        console.log(`✅ Total repositories: ${allRepos.length}`);
        
        // Filter student repositories (class-name-username pattern)
        let studentRepos = allRepos.filter(repo => {
            return repo.name.includes('-') && repo.name.split('-').length >= 2;
        });
        
        // If classId is provided, filter for that specific class
        if (classId) {
            // We need to get the class name from the database
            // For now, we'll show all student repos and let you identify the class
            console.log(`\n4. Filtering repositories for class ID: ${classId}`);
            console.log('   Note: To filter by class name, we would need to query the database');
            console.log('   Showing all student repositories for manual identification');
        }
        
        console.log(`✅ Student repositories: ${studentRepos.length}`);
        
        if (studentRepos.length > 0) {
            console.log('\n👥 Student repositories:');
            studentRepos.forEach((repo, index) => {
                console.log(`   ${index + 1}. ${repo.name}`);
            });
            
            // Check quest issues in the first student repository
            const sampleRepo = studentRepos[0];
            console.log(`\n5. Checking quest issues in ${sampleRepo.name}...`);
            
            try {
                const issuesResponse = await axios.get(
                    `https://api.github.com/repos/${organizationGh}/${sampleRepo.name}/issues`,
                    {
                        headers: {
                            Authorization: `Bearer ${githubToken}`,
                            Accept: 'application/vnd.github.v3+json',
                        }
                    }
                );
                
                const issues = issuesResponse.data;
                console.log(`✅ Issues in ${sampleRepo.name}: ${issues.length}`);
                
                if (issues.length > 0) {
                    console.log('\n📋 Quest issues:');
                    issues.forEach((issue, index) => {
                        console.log(`   ${index + 1}. ${issue.title} (${issue.state})`);
                        console.log(`      Labels: ${issue.labels.map(l => l.name).join(', ')}`);
                        console.log(`      Created: ${issue.created_at}`);
                        console.log('');
                    });
                }
                
                // Check for quest labels
                const questIssues = issues.filter(issue => 
                    issue.labels.some(label => label.name === 'quest')
                );
                
                console.log(`✅ Quest-labeled issues: ${questIssues.length}`);
                
                // Show quest roadmap
                if (questIssues.length > 0) {
                    console.log('\n🗺️ Quest Roadmap:');
                    questIssues.forEach((issue, index) => {
                        console.log(`   ${index + 1}. ${issue.title}`);
                        console.log(`      State: ${issue.state}`);
                        console.log(`      URL: ${issue.html_url}`);
                        console.log('');
                    });
                }
                
            } catch (error) {
                console.log('❌ Could not fetch issues:', error.message);
            }
            
            // If you want to check multiple repositories, uncomment this
            /*
            console.log('\n6. Checking quest issues in all student repositories...');
            for (const repo of studentRepos.slice(0, 3)) { // Check first 3 repos
                try {
                    const issuesResponse = await axios.get(
                        `https://api.github.com/repos/${organizationGh}/${repo.name}/issues`,
                        {
                            headers: {
                                Authorization: `Bearer ${githubToken}`,
                                Accept: 'application/vnd.github.v3+json',
                            }
                        }
                    );
                    
                    const issues = issuesResponse.data;
                    const questIssues = issues.filter(issue => 
                        issue.labels.some(label => label.name === 'quest')
                    );
                    
                    console.log(`   ${repo.name}: ${questIssues.length} quest issues`);
                } catch (error) {
                    console.log(`   ${repo.name}: Error fetching issues`);
                }
            }
            */
        }
        
        console.log('\n✅ Quest roadmap GitHub analysis complete!');
        
        // Show usage instructions
        if (!classId) {
            console.log('\n💡 Usage:');
            console.log('   To see quest roadmap for a specific class:');
            console.log('   node get-quest-roadmap-github.js <classId>');
            console.log('');
            console.log('   Example:');
            console.log('   node get-quest-roadmap-github.js 507f1f77bcf86cd799439011');
        }
        
    } catch (error) {
        console.error('❌ Error fetching quest roadmap from GitHub:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

// Get class ID from command line arguments
const classId = process.argv[2] || null;

// Run the script
getQuestRoadmapFromGitHub(classId); 