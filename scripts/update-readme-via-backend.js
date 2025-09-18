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

const README_CONTENT = `# CS386 - Software Engineering

## Quest Progress

| Quest | Title | Status |
|-------|-------|--------|
| Q1 | A-1.1 - Introduction to OSS | ✅ Complete |
| Q2 | A-1.2 - OSS Tools and Workflow | ✅ Complete |
| Q3 | A-2.1 - Software Architecture | ✅ Complete |
| Q4 | A-3.1 - Software Design Patterns | ✅ Complete |
| Q5 | A-4.1 - SW Requirements Concepts | ✅ Complete |
| **Q6** | **A-4.2 Use Cases** | 🎯 **Active** |

---

*📅 README updated automatically when Q6 was deployed - ${new Date().toLocaleDateString()}*
*🤖 OSS-Doorway Bot - CS386 Software Engineering Course*`;

async function updateReadmeForAllQ6Users() {
  console.log('🚀 Updating README for all 72 Q6 users using OSS-Management backend...');
  
  let successCount = 0;
  let failCount = 0;
  const errors = [];
  
  // Use the OSS-Management backend's batch update endpoint
  const BACKEND_URL = 'https://oss-michael-production.up.railway.app';
  const CLASS_ID = '68a770b8140b9c0174c13ce7';
  
  for (let i = 0; i < Q6_USERS.length; i++) {
    const username = Q6_USERS[i];
    console.log(`\n[${i + 1}/72] 👤 Processing: ${username}`);
    
    try {
      const response = await axios.post(`${BACKEND_URL}/api/group/${CLASS_ID}/readme/batch-update`, {
        content: README_CONTENT,
        fileName: 'README.md',
        pushToRepos: true
      }, {
        timeout: 30000, // 30 second timeout
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data && response.data.batchUpdate && response.data.batchUpdate.results) {
        const results = response.data.batchUpdate.results;
        const userResult = results.successful.find(r => r.username === username.split('-')[0]) || 
                         results.failed.find(r => r.username === username.split('-')[0]);
        
        if (userResult && results.successful.includes(userResult)) {
          console.log(`   ✅ README updated successfully`);
          successCount++;
        } else if (userResult && results.failed.includes(userResult)) {
          console.log(`   ❌ Failed: ${userResult.error || 'Unknown error'}`);
          failCount++;
          errors.push(`${username}: ${userResult.error || 'Unknown error'}`);
        } else {
          console.log(`   ⚠️ User not found in results`);
          failCount++;
          errors.push(`${username}: User not found in batch results`);
        }
      } else {
        console.log(`   ❌ Invalid response format`);
        failCount++;
        errors.push(`${username}: Invalid response format`);
      }
    } catch (error) {
      if (error.response) {
        console.log(`   ❌ HTTP ${error.response.status}: ${error.response.data?.message || error.message}`);
        failCount++;
        errors.push(`${username}: HTTP ${error.response.status} - ${error.response.data?.message || error.message}`);
      } else {
        console.log(`   ❌ Error: ${error.message}`);
        failCount++;
        errors.push(`${username}: ${error.message}`);
      }
    }
    
    // Add delay to avoid overwhelming the backend
    if (i < Q6_USERS.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
    }
  }
  
  console.log(`\n📊 Final Summary:`);
  console.log(`   ✅ Successfully updated: ${successCount}/72`);
  console.log(`   ❌ Failed: ${failCount}/72`);
  console.log(`   📈 Success rate: ${Math.round((successCount / 72) * 100)}%`);
  
  if (errors.length > 0) {
    console.log(`\n❌ Errors encountered:`);
    errors.slice(0, 10).forEach(error => console.log(`   - ${error}`));
    if (errors.length > 10) {
      console.log(`   ... and ${errors.length - 10} more errors`);
    }
  }
  
  console.log(`\n🎉 Q6 README update process completed!`);
}

updateReadmeForAllQ6Users();
