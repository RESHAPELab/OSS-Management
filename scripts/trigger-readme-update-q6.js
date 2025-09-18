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

async function triggerReadmeUpdateForAllQ6Users() {
  console.log('🚀 Triggering README updates for all 72 Q6 users using bot webhook...');
  
  let successCount = 0;
  let failCount = 0;
  const errors = [];
  
  for (let i = 0; i < Q6_USERS.length; i++) {
    const repoName = Q6_USERS[i];
    console.log(`\n[${i + 1}/72] 👤 Processing: ${repoName}`);
    
    try {
      // Send a comment to trigger README update - using the same mechanism as task completion
      const response = await axios.post('http://localhost:4000/api/github/webhooks', {
        action: 'created',
        issue: {
          number: 1, // Use issue #1 as a safe default
          title: 'Trigger README update',
          body: '/update readme'
        },
        comment: {
          body: '/update readme',
          user: {
            login: 'oss-doorway-bot'
          }
        },
        repository: {
          name: repoName,
          owner: {
            login: 'OSS-Doorway-Dev'
          },
          full_name: `OSS-Doorway-Dev/${repoName}`
        },
        sender: {
          login: 'oss-doorway-bot'
        }
      }, {
        headers: {
          'Content-Type': 'application/json',
          'X-GitHub-Event': 'issue_comment'
        }
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
      console.log(`   ❌ Error: ${error.message}`);
      failCount++;
      errors.push(`${repoName}: ${error.message}`);
    }
    
    // Add small delay to avoid overwhelming the bot
    if (i < Q6_USERS.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 200));
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
  
  console.log(`\n🎉 Q6 README update trigger process completed!`);
}

triggerReadmeUpdateForAllQ6Users();
