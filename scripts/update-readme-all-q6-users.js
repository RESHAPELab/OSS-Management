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

## 🎯 Current Quest: Q6 - A-4.2 Use Cases

**Status**: ✅ Active  
**Description**: Learn about employing use cases to specify software requirements.

### 📋 Quest Tasks:
- **T1**: Student Names
- **T2**: Actors and Use Cases  
- **T3**: Actors for Systems
- **T4**: Use Cases
- **T5**: Restaurant Management System Requirements
- **T6**: Use Case Diagrams
- **T7**: System Boundaries
- **T8**: Use Case Relationships
- **T9**: Use Case Scenarios
- **T10**: Use Case Specifications
- **T11**: Use Case Validation
- **T12**: Use Case Testing
- **T13**: Use Case Documentation
- **T14**: Use Case Review
- **T15**: Use Case Implementation
- **T16**: Use Case Reflection

### 🔗 Prerequisites:
- ✅ Q5: A-4.1 - SW Requirements Concepts (Completed)

### 📚 Learning Objectives:
- Understand use case modeling techniques
- Learn to identify actors and their interactions
- Master use case diagram creation
- Apply use cases to real-world systems

---

## 🏆 Quest Progress Overview

| Quest | Title | Status |
|-------|-------|--------|
| Q1 | A-0.1 - Intro to the Course | ✅ Complete |
| Q2 | A-1.1 | ✅ Complete |
| Q3 | A-2.1 - Software Engineering Tools | ✅ Complete |
| Q4 | A-3.1 - Software Interception | ✅ Complete |
| Q5 | A-4.1 - SW Requirements Concepts | ✅ Complete |
| **Q6** | **A-4.2 Use Cases** | 🎯 **Active** |

---

*📅 README updated automatically when Q6 was deployed - ${new Date().toLocaleDateString()}*
*🤖 OSS-Doorway Bot - CS386 Software Engineering Course*`;

async function updateReadmeForAllQ6Users() {
  console.log('🚀 Updating README for all 72 Q6 users...');
  
  let successCount = 0;
  let failCount = 0;
  const errors = [];
  
  for (let i = 0; i < Q6_USERS.length; i++) {
    const username = Q6_USERS[i];
    console.log(`\n[${i + 1}/72] 👤 Processing: ${username}`);
    
    try {
      const response = await axios.post('https://oss-michael-production.up.railway.app/api/group/68a770b8140b9c0174c13ce7/readme/batch-update', {
        usernames: [username],
        readmeContent: README_CONTENT
      });
      
      if (response.data.success) {
        console.log(`   ✅ README updated successfully`);
        successCount++;
      } else {
        console.log(`   ❌ Failed: ${response.data.message}`);
        failCount++;
        errors.push(`${username}: ${response.data.message}`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      failCount++;
      errors.push(`${username}: ${error.message}`);
    }
    
    // Add small delay to avoid overwhelming the API
    if (i < Q6_USERS.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
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



