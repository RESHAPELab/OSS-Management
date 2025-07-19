const axios = require('axios');

// Debug script to check repository visibility issues
async function debugRepositories() {
    const baseURL = 'http://localhost:8080';
    
    try {
        console.log('🔍 DEBUGGING REPOSITORY VISIBILITY ISSUES');
        console.log('==========================================');
        
        // 1. Check organization name
        console.log('\n1. Checking organization name...');
        const orgResponse = await axios.get(`${baseURL}/api/repo/prodStatus`);
        const organizationGh = orgResponse.data.organizationGh;
        console.log(`✅ Organization: ${organizationGh}`);
        
        // 2. List all repositories in the organization
        console.log('\n2. Listing all repositories in organization...');
        const reposResponse = await axios.get(`${baseURL}/api/repo/listRepos`, {
            params: { organizationGh }
        });
        
        const allRepos = reposResponse.data.repos || [];
        console.log(`✅ Total repositories found: ${allRepos.length}`);
        
        if (allRepos.length > 0) {
            console.log('\n📋 All repositories:');
            allRepos.forEach((repo, index) => {
                console.log(`   ${index + 1}. ${repo.name} (${repo.private ? 'private' : 'public'})`);
            });
        } else {
            console.log('❌ No repositories found in organization');
        }
        
        // 3. Check if there are any class-specific repositories
        console.log('\n3. Looking for class-specific repositories...');
        const classRepos = allRepos.filter(repo => repo.name.includes('-'));
        console.log(`✅ Repositories with hyphens (potential class repos): ${classRepos.length}`);
        
        if (classRepos.length > 0) {
            console.log('\n📋 Class-specific repositories:');
            classRepos.forEach((repo, index) => {
                console.log(`   ${index + 1}. ${repo.name}`);
            });
        }
        
        // 4. Test with a sample class name
        console.log('\n4. Testing with sample class name...');
        const sampleClassName = 'Test Class 101';
        const formattedClassName = sampleClassName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
        
        console.log(`Sample class name: "${sampleClassName}"`);
        console.log(`Formatted class name: "${formattedClassName}"`);
        
        const matchingRepos = allRepos.filter(repo => repo.name.startsWith(`${formattedClassName}-`));
        console.log(`Repositories matching pattern "${formattedClassName}-*": ${matchingRepos.length}`);
        
        if (matchingRepos.length > 0) {
            console.log('\n📋 Matching repositories:');
            matchingRepos.forEach((repo, index) => {
                console.log(`   ${index + 1}. ${repo.name}`);
            });
        }
        
        // 5. Check environment
        console.log('\n5. Environment information:');
        console.log(`NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
        console.log(`USER_AGENT_PROD: ${process.env.USER_AGENT_PROD || 'not set'}`);
        console.log(`USER_AGENT_DEV: ${process.env.USER_AGENT_DEV || 'not set'}`);
        
        console.log('\n✅ Debugging complete!');
        
    } catch (error) {
        console.error('❌ Error during debugging:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

// Run the debug script
debugRepositories(); 