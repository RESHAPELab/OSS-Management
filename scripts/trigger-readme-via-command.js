import axios from 'axios';

const Q6_USERS = [
  'marcogerosa-cs386-software-engineering',
  'marcogerosa2-cs386-software-engineering', 
  'Misanetc-cs386-software-engineering',
  'alexaaguilar10-cs386-software-engineering',
  'EthanSNAU-cs386-software-engineering',
  'kdsnau-cs386-software-engineering',
  'loganb7869-cs386-software-engineering',
  'sjh559-cs386-software-engineering',
  'reb442-cs386-software-engineering',
  'h3nryyyyyyy-cs386-software-engineering',
  'Math1029-cs386-software-engineering',
  'idh44-tech-cs386-software-engineering',
  'LatestStream-cs386-software-engineering',
  'akg358-cs386-software-engineering',
  'REB-95-cs386-software-engineering',
  'zpt4-cs386-software-engineering',
  'lgf33-cs386-software-engineering',
  'kbb249-cs386-software-engineering',
  'rebeccasomerville-cs386-software-engineering',
  'kayleeCromwell-cs386-software-engineering',
  'CocoCrispy95-cs386-software-engineering',
  'Skitsy24-cs386-software-engineering',
  'pieceoftoast42-cs386-software-engineering',
  'akg357-cs386-software-engineering',
  'ewilli1-cs386-software-engineering',
  'jlandrew-cs386-software-engineering',
  'ard584-cs386-software-engineering',
  'im576-cs386-software-engineering',
  '8-Nate-cs386-software-engineering',
  'NoahValdez-cs386-software-engineering',
  'MunendraPC-cs386-software-engineering',
  'superfake-anna-cs386-software-engineering',
  'E-bosss-cs386-software-engineering',
  'Noahvaldezsecond-cs386-software-engineering',
  'bjones55-cs386-software-engineering',
  'Aryan9832-cs386-software-engineering',
  'JosselinR1-cs386-software-engineering',
  'njh343-cs386-software-engineering',
  'jmk658-cs386-software-engineering',
  'tg769-cs386-software-engineering',
  'peterpalmer05-cs386-software-engineering',
  'kbjvgchf-cs386-test',
  'adcadcadcadca-cs386-test',
  'NCarlisle24-cs386-software-engineering',
  'misanetc-cs386-software-engineering',
  'Stecata2004Luca-cs386-software-engineering',
  'lnjkhjvgch-cs386-software-engineering',
  'kds472-cs386-software-engineering',
  'dscdcsdcsdc-cs386-software-engineering-test',
  'Hhhhhhhhjnhhhhhjj-cs386-software-engineering',
  'ndv255-cs386-software-engineering',
  'luitenantchadlong-cs386-software-engineering',
  'iufydtsretdyfugihojhgc-cs386-software-engineering',
  'cvsfvsfvfsvfs-cs386-software-engineering',
  'wdefaedaede-cs386-software-engineering',
  'adcdacadcadcadcadcad-cs386-software-engineering',
  'scdcdcdcd-cs386-software-engineering',
  'adcadcadcadcaddac-cs386-software-engineering',
  'jkhvgcfx-cs386-software-engineering',
  'sCcDCdacdcdcadc-cs386-software-engineering',
  'adcadcadcadc-cs386-software-engineering-test',
  'dscadcadcadcdcsdc-cs386-software-engineering-test',
  'cdcdcdzczdczd-cs386-software-engineering-test',
  'cdcdcdzczdczdssxs-cs386-software-engineering-test',
  'adcadcadcadcad-cs386-software-engineering-test',
  'dacadcadcadcadcad-cs386-software-engineering-test',
  'tttutyrstrtugvcxrt-cs386-software-engineering-test',
  'itjustcameoutdcacad-cs386-software-engineering-test',
  'itjustcameodwcsautdcacad-cs386-software-engineering-test',
  'peterpalmer05-cs386-software-engineering-test',
  'peterpalmer-cs386-software-engineering-test',
  'marocgerosa-cs386-software-engineering-test'
];

async function triggerReadmeUpdateViaCommand() {
  console.log('🚀 Triggering README updates by posting /readme update command...');
  
  let successCount = 0;
  let failCount = 0;
  const errors = [];
  
  // Use the OSS-Doorway bot token 
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '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';
  
  for (let i = 0; i < Q6_USERS.length; i++) {
    const repoName = Q6_USERS[i];
    console.log(`\n[${i + 1}/72] 👤 Processing: ${repoName}`);
    
    try {
      // First, get the latest Q6 issue for this user
      const issuesResponse = await axios.get(`https://api.github.com/repos/OSS-Doorway-Dev/${repoName}/issues?state=open&per_page=20`, {
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'OSS-Doorway-Bot'
        }
      });
      
      if (issuesResponse.data && issuesResponse.data.length > 0) {
        // Find a Q6 issue or use the first open issue
        let targetIssue = issuesResponse.data.find(issue => issue.title.includes('Q6')) || issuesResponse.data[0];
        const issueNumber = targetIssue.number;
        
        // Post the /readme update command as a comment
        const commentResponse = await axios.post(`https://api.github.com/repos/OSS-Doorway-Dev/${repoName}/issues/${issueNumber}/comments`, {
          body: '/readme update'
        }, {
          headers: {
            'Authorization': `token ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'OSS-Doorway-Bot'
          }
        });
        
        if (commentResponse.status === 201) {
          console.log(`   ✅ Posted /readme update command to issue #${issueNumber} (${targetIssue.title.substring(0, 50)}...)`);
          successCount++;
        } else {
          console.log(`   ❌ Failed to post comment: HTTP ${commentResponse.status}`);
          failCount++;
          errors.push(`${repoName}: Failed to post comment - HTTP ${commentResponse.status}`);
        }
      } else {
        console.log(`   ⚠️ No open issues found in ${repoName}`);
        failCount++;
        errors.push(`${repoName}: No open issues found`);
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log(`   ❌ Repository not found: ${repoName}`);
        failCount++;
        errors.push(`${repoName}: Repository not found (404)`);
      } else if (error.response && error.response.status === 403) {
        console.log(`   ❌ Access forbidden: ${repoName} (token may need permissions)`);
        failCount++;
        errors.push(`${repoName}: Access forbidden (403)`);
      } else {
        console.log(`   ❌ Error: ${error.message}`);
        failCount++;
        errors.push(`${repoName}: ${error.message}`);
      }
    }
    
    // Add delay to respect GitHub API rate limits (5000 requests/hour = ~1.4/second)
    if (i < Q6_USERS.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
    }
  }
  
  console.log(`\n📊 Final Summary:`);
  console.log(`   ✅ Successfully posted commands: ${successCount}/72`);
  console.log(`   ❌ Failed: ${failCount}/72`);
  console.log(`   📈 Success rate: ${Math.round((successCount / 72) * 100)}%`);
  
  if (errors.length > 0) {
    console.log(`\n❌ Errors encountered:`);
    errors.slice(0, 10).forEach(error => console.log(`   - ${error}`));
    if (errors.length > 10) {
      console.log(`   ... and ${errors.length - 10} more errors`);
    }
  }
  
  console.log(`\n🎉 README update command posting completed!`);
  console.log(`💡 The OSS-Doorway bot should now process these /readme update commands and update all READMEs.`);
}

triggerReadmeUpdateViaCommand();



