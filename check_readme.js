const axios = require('axios');
require('dotenv').config();

// Configuration
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';
const ORG = 'OSS-Doorway';
const REPO_NAME = 'cs-101-intro-to-cs-misanatnau';

async function checkReadmeExists() {
    try {
        console.log(`🔍 Checking if README exists in ${ORG}/${REPO_NAME}...`);
        
        const response = await axios.post(`${BACKEND_URL}/api/repo/checkReadme`, {
            organizationGh: ORG,
            repoName: REPO_NAME
        });

        const result = response.data.result;
        
        if (result.exists) {
            console.log('✅ README.md exists in the repository!');
            console.log(`📄 File size: ${result.size} bytes`);
            console.log(`🔗 GitHub URL: ${result.url}`);
            console.log(`🔑 SHA: ${result.sha}`);
        } else {
            console.log('❌ README.md does not exist in the repository.');
        }
        
        return result;
    } catch (error) {
        console.error('❌ Error checking README:', error.response?.data || error.message);
        if (error.response?.status === 404) {
            console.log('📝 Repository might not exist or be accessible');
        }
        throw error;
    }
}

// Run the check
checkReadmeExists()
    .then(result => {
        console.log('\n📊 Final result:', result);
    })
    .catch(error => {
        console.error('\n💥 Script failed:', error.message);
        process.exit(1);
    }); 