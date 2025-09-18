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

async function triggerReadmeUpdateViaBotWebhook() {
  console.log('🚀 Triggering README updates by calling bot webhook with bypass command...');
  
  let successCount = 0;
  let failCount = 0;
  const errors = [];
  
  // Bot webhook endpoint
  const BOT_WEBHOOK_URL = 'http://localhost:4000/api/github/webhooks';
  
  for (let i = 0; i < Q6_USERS.length; i++) {
    const repoName = Q6_USERS[i];
    const username = repoName.split('-')[0];
    console.log(`\n[${i + 1}/72] 👤 Processing: ${repoName} (${username})`);
    
    try {
      // Create webhook payload that simulates a bypass command
      // This will complete Q6.T1 and trigger updateReadme automatically
      const webhookPayload = {
        action: 'created',
        issue: {
          number: 1,
          title: `cs386-software-engineering-Q6 T1: Student Names`,
          body: 'Student Names task',
          user: {
            login: username
          }
        },
        comment: {
          body: '/bypass Q6.T1',
          user: {
            login: 'oss-doorway-bot'
          },
          created_at: new Date().toISOString()
        },
        repository: {
          name: repoName,
          owner: {
            login: 'OSS-Doorway-Dev'
          },
          full_name: `OSS-Doorway-Dev/${repoName}`,
          html_url: `https://github.com/OSS-Doorway-Dev/${repoName}`
        },
        sender: {
          login: 'oss-doorway-bot',
          type: 'Bot'
        }
      };
      
      // Send webhook to bot
      const response = await axios.post(BOT_WEBHOOK_URL, webhookPayload, {
        headers: {
          'Content-Type': 'application/json',
          'X-GitHub-Event': 'issue_comment',
          'X-GitHub-Delivery': `readme-update-${Date.now()}-${i}`,
          'User-Agent': 'GitHub-Hookshot/abc123'
        },
        timeout: 15000 // 15 second timeout
      });
      
      if (response.status === 200) {
        console.log(`   ✅ README update triggered successfully`);
        successCount++;
      } else {
        console.log(`   ❌ Failed: HTTP ${response.status}`);
        failCount++;
        errors.push(`${repoName}: HTTP ${response.status}`);
      }
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.log(`   ❌ Bot not running: ${repoName}`);
        failCount++;
        errors.push(`${repoName}: Bot not running (connection refused)`);
      } else if (error.response) {
        console.log(`   ❌ HTTP ${error.response.status}: ${repoName}`);
        failCount++;
        errors.push(`${repoName}: HTTP ${error.response.status}`);
      } else {
        console.log(`   ❌ Error: ${error.message}`);
        failCount++;
        errors.push(`${repoName}: ${error.message}`);
      }
    }
    
    // Small delay to avoid overwhelming the bot
    if (i < Q6_USERS.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
    }
  }
  
  console.log(`\n📊 Final Summary:`);
  console.log(`   ✅ Successfully triggered: ${successCount}/72`);
  console.log(`   ❌ Failed: ${failCount}/72`);
  console.log(`   📈 Success rate: ${Math.round((successCount / 72) * 100)}%`);
  
  if (errors.length > 0) {
    console.log(`\n❌ Errors encountered:`);
    errors.slice(0, 10).forEach(error => console.log(`   - ${error}`));
    if (errors.length > 10) {
      console.log(`   ... and ${errors.length - 10} more errors`);
    }
  }
  
  console.log(`\n🎉 README update process completed!`);
  console.log(`💡 Each /bypass Q6.T1 command will:`);
  console.log(`   1. Complete Q6.T1 for the user (giving them 1 point)`);
  console.log(`   2. Automatically call updateReadme() function`);
  console.log(`   3. Update the README with current Q6 progress`);
  console.log(`   4. Close the Q6.T1 issue`);
}

triggerReadmeUpdateViaBotWebhook();
