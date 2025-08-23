const axios = require('axios');

// Centralized configuration - automatically switches between local and production
const getBaseURL = () => {
  // Check if we're in a production environment
  const isProduction = process.env.NODE_ENV === 'production' || 
                      process.env.RAILWAY_ENVIRONMENT || 
                      !process.env.NODE_ENV;
  
  if (isProduction) {
    return 'https://oss-michael-production.up.railway.app';
  } else {
    return 'http://localhost:8080';
  }
};

async function debugRepoIssue() {
  const baseURL = getBaseURL();
  
  try {
    console.log('🔍 DEBUGGING REPOSITORY ISSUE');
    console.log('==============================');
    console.log(`🌐 Using base URL: ${baseURL}`);
    
    // 1. Check organization name
    console.log('\n1. Getting organization name...');
    const orgResponse = await axios.get(`${baseURL}/api/repo/prodStatus`);
    const organizationGh = orgResponse.data.organizationGh;
    console.log(`✅ Organization: ${organizationGh}`);
    
    // 2. Test repository listing
    console.log('\n2. Testing repository listing...');
    try {
      const reposResponse = await axios.get(`${baseURL}/api/repo/listRepos`, {
        params: { organizationGh }
      });
      
      console.log('✅ Repository listing successful');
      console.log('Response structure:', {
        hasMessage: !!reposResponse.data.message,
        hasRepos: !!reposResponse.data.repos,
        reposType: typeof reposResponse.data.repos,
        reposLength: Array.isArray(reposResponse.data.repos) ? reposResponse.data.repos.length : 'not an array'
      });
      
      if (reposResponse.data.repos && Array.isArray(reposResponse.data.repos)) {
        console.log('\n📋 Found repositories:');
        reposResponse.data.repos.forEach((repo, index) => {
          console.log(`   ${index + 1}. ${repo.name} (${repo.private ? 'private' : 'public'})`);
        });
        
        // 3. Test class name formatting
        console.log('\n3. Testing class name formatting...');
        const className = 'OSS-Intro-2';
        const formattedClassName = className
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
        
        console.log(`Original: "${className}"`);
        console.log(`Formatted: "${formattedClassName}"`);
        
        // 4. Test repository filtering with both patterns
        console.log('\n4. Testing repository filtering...');
        
        // Old pattern: classname-username
        const oldPatternRepos = reposResponse.data.repos.filter(repo => 
          repo.name.startsWith(`${formattedClassName}-`)
        );
        console.log(`Old pattern (${formattedClassName}-*): ${oldPatternRepos.length} repositories`);
        oldPatternRepos.forEach(repo => console.log(`   - ${repo.name}`));
        
        // New pattern: username-classname
        const newPatternRepos = reposResponse.data.repos.filter(repo => 
          repo.name.endsWith(`-${formattedClassName}`)
        );
        console.log(`New pattern (*-${formattedClassName}): ${newPatternRepos.length} repositories`);
        newPatternRepos.forEach(repo => console.log(`   - ${repo.name}`));
        
        // 5. Test collaboration status if we have repositories
        if (newPatternRepos.length > 0) {
          console.log('\n5. Testing collaboration status...');
          const testRepo = newPatternRepos[0];
          const username = testRepo.name.replace(`-${formattedClassName}`, '');
          
          console.log(`Testing with repo: ${testRepo.name}, username: ${username}`);
          
          try {
            const statusResponse = await axios.post(`${baseURL}/api/repo/collaborationStatus`, {
              organizationGh,
              students: [username],
              className: className
            });
            
            console.log('✅ Collaboration status check successful');
            console.log('Status results:', statusResponse.data.results);
          } catch (error) {
            console.error('❌ Collaboration status check failed:', error.message);
            if (error.response) {
              console.error('Response:', error.response.data);
            }
          }
        }
        
      } else {
        console.log('❌ No repositories found or invalid response structure');
      }
      
    } catch (error) {
      console.error('❌ Repository listing failed:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
    }
    
  } catch (error) {
    console.error('❌ Debug script failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the debug script
debugRepoIssue();