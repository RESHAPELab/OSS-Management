// clear-bot-cache.js
// Clear the bot cache to force reload of updated purple config

const axios = require('axios');
const { MongoClient } = require('mongodb');

async function getGithubAppInstallationAccessToken() {
  const ossDoorwayUri = process.env.OSS_DOORWAY_DB_URI || 'mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/?retryWrites=true&w=majority&appName=gamification';
  const ossDoorwayDbName = process.env.OSS_DOORWAY_DB_NAME || 'test';

  let client;
  try {
    client = new MongoClient(ossDoorwayUri);
    await client.connect();
    const db = client.db(ossDoorwayDbName);
    
    const githubAppsCollection = db.collection('github_apps');
    const githubApp = await githubAppsCollection.findOne({});
    
    if (!githubApp || !githubApp.access_token) {
      throw new Error('GitHub App access token not found in database');
    }
    
    return githubApp.access_token;
  } finally {
    if (client) await client.close();
  }
}

async function main() {
  try {
    console.log('🔄 CLEARING BOT CACHE');
    console.log('=' .repeat(40));

    // Get GitHub access token
    console.log('🔑 Getting GitHub access token...');
    const accessToken = await getGithubAppInstallationAccessToken();
    console.log('✅ Access token obtained');

    // Find a repository to post the cache clear command
    const testRepo = 'marcogerosa-cs386-software-engineering'; // Using one from the logs
    
    // Get the repository to find an issue
    console.log(`🔍 Getting repository: ${testRepo}`);
    const repoResponse = await axios.get(`https://api.github.com/repos/OSS-Doorway-Dev/${testRepo}`, {
      headers: {
        'Authorization': `token ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    
    console.log('✅ Repository found');

    // Get issues from the repository
    console.log('🔍 Getting repository issues...');
    const issuesResponse = await axios.get(`https://api.github.com/repos/OSS-Doorway-Dev/${testRepo}/issues`, {
      headers: {
        'Authorization': `token ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json'
      },
      params: {
        state: 'open',
        per_page: 1
      }
    });

    if (issuesResponse.data.length === 0) {
      console.log('⚠️ No open issues found, trying closed issues...');
      const closedIssuesResponse = await axios.get(`https://api.github.com/repos/OSS-Doorway-Dev/${testRepo}/issues`, {
        headers: {
          'Authorization': `token ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json'
        },
        params: {
          state: 'closed',
          per_page: 1
        }
      });
      
      if (closedIssuesResponse.data.length === 0) {
        throw new Error('No issues found in repository');
      }
      
      var targetIssue = closedIssuesResponse.data[0];
    } else {
      var targetIssue = issuesResponse.data[0];
    }

    console.log(`✅ Found issue #${targetIssue.number}: ${targetIssue.title}`);

    // Post cache clear command
    console.log('💬 Posting cache clear command...');
    const commentResponse = await axios.post(`https://api.github.com/repos/OSS-Doorway-Dev/${testRepo}/issues/${targetIssue.number}/comments`, {
      body: '/cache clear-all'
    }, {
      headers: {
        'Authorization': `token ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Cache clear command posted successfully');
    console.log(`📝 Comment ID: ${commentResponse.data.id}`);
    console.log(`🔗 Comment URL: ${commentResponse.data.html_url}`);

    console.log('\n🎉 Bot cache should be cleared!');
    console.log('The bot should now load the updated purple config with Q1, Q2, Q3');

  } catch (error) {
    console.error('❌ Error clearing cache:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

main();
