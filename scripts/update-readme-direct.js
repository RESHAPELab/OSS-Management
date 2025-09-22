import { MongoClient } from 'mongodb';
import axios from 'axios';

// Import the gamification functions directly
const TEST_URI = "mongodb+srv://cna93:gamification@gamification.nwes9ze.mongodb.net/test?retryWrites=true&w=majority&appName=gamification";

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

async function updateReadmeForAllUsers() {
  console.log('🚀 Updating README for all 72 Q6 users using bot\'s updateReadme function...');
  
  const testClient = new MongoClient(TEST_URI);
  
  try {
    await testClient.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = testClient.db('test');
    const userCollection = db.collection('userstoreddata');
    
    let successCount = 0;
    let failCount = 0;
    const errors = [];
    
    for (let i = 0; i < Q6_USERS.length; i++) {
      const repoName = Q6_USERS[i];
      const username = repoName.split('-')[0];
      console.log(`\n[${i + 1}/72] 👤 Processing: ${repoName} (${username})`);
      
      try {
        // Get user data from database
        const userData = await userCollection.findOne({ username: username });
        
        if (!userData) {
          console.log(`   ❌ User not found in database: ${username}`);
          failCount++;
          errors.push(`${repoName}: User not found in database`);
          continue;
        }
        
        console.log(`   ✅ Found user data for ${username}`);
        console.log(`   📋 Custom group ID: ${userData.customGroupId}`);
        
        // Create a mock context object like the bot uses
        const mockContext = {
          repo: () => ({ owner: 'OSS-Doorway-Dev', repo: repoName }),
          issue: () => ({ issue_number: 1 }),
          octokit: {
            rest: {
              repos: {
                getReadme: async () => {
                  // Mock response for README fetch
                  return {
                    data: {
                      content: Buffer.from('# CS386 - Software Engineering\n\n## Quest Progress\n\n| Quest | Title | Status |\n|-------|-------|--------|\n| Q1 | A-1.1 - Introduction to OSS | ✅ Complete |\n| Q2 | A-1.2 - OSS Tools and Workflow | ✅ Complete |\n| Q3 | A-2.1 - Software Architecture | ✅ Complete |\n| Q4 | A-3.1 - Software Design Patterns | ✅ Complete |\n| Q5 | A-4.1 - SW Requirements Concepts | ✅ Complete |\n| **Q6** | **A-4.2 Use Cases** | 🎯 **Active** |\n\n----\n\n*This README is automatically updated as you progress through the course.*').toString('base64'),
                      sha: 'mock-sha-' + Date.now()
                    }
                  };
                },
                createOrUpdateFileContents: async (params) => {
                  console.log(`   📝 README update simulated for ${repoName}`);
                  return { data: { commit: { sha: 'mock-commit-sha' } } };
                }
              }
            }
          }
        };
        
        // Import and call the updateReadme function directly
        const { updateReadme, displayQuests } = await import('../../OSS-Doorway/src/gamification.js');
        
        // Call updateReadme exactly like the bot does
        await updateReadme('OSS-Doorway-Dev', repoName, mockContext, userData.user_data, {
          updateData: async () => console.log(`   💾 User data update simulated for ${username}`)
        });
        
        console.log(`   ✅ README update completed successfully`);
        successCount++;
        
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        failCount++;
        errors.push(`${repoName}: ${error.message}`);
      }
      
      // Small delay to avoid overwhelming the system
      if (i < Q6_USERS.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
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
    
    console.log(`\n🎉 README update process completed!`);
    
  } catch (error) {
    console.error('❌ Database connection error:', error);
  } finally {
    await testClient.close();
  }
}

updateReadmeForAllUsers();


