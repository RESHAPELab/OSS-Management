import fs from 'fs';
import path from 'path';

async function determineCS386Config() {
  console.log('🔍 Determining what quest config CS386 repos would use...');
  
  // Based on the system logic we've seen, let's check what configs are available
  console.log('\n📋 Checking available CS386 configs...');
  
  const configPaths = [
    '/Users/macbook/Developer/reshapelab/OSS-Daddy Old/oss-bot/OSS-Doorway/src/config/generated/quest_config_68a770b8140b9c0174c13ce7.json',
    '/Users/macbook/Developer/reshapelab/OSS-Daddy Old/oss-bot/OSS-Doorway/src/config/generated/quest_config_68a770b8140b9c0174c13ce7_purple_1756928031626.json',
    '/Users/macbook/Developer/reshapelab/OSS-Daddy Old/oss-bot/OSS-Management/quest_config_68a770b8140b9c0174c13ce8-with-q3.json',
    '/Users/macbook/Developer/reshapelab/OSS-Daddy Old/oss-bot/OSS-Management/quest_config_68a770b8140b9c0174c13ce7.json'
  ];
  
  for (const configPath of configPaths) {
    if (fs.existsSync(configPath)) {
      console.log(`✅ Found: ${path.basename(configPath)}`);
      
      try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        
        // Determine config content
        let questConfig;
        if (config.config) {
          questConfig = config.config;
        } else {
          questConfig = config;
        }
        
        const quests = Object.keys(questConfig).filter(k => k.startsWith('Q'));
        console.log(`   - Quests: ${quests.join(', ')}`);
        
        for (const quest of quests) {
          if (questConfig[quest] && typeof questConfig[quest] === 'object') {
            const tasks = Object.keys(questConfig[quest]).filter(k => k.startsWith('T'));
            console.log(`   - ${quest}: ${tasks.length} tasks`);
          }
        }
        
        // Identify what type of config this is
        const fileName = path.basename(configPath);
        if (fileName.includes('purple')) {
          console.log('   🟣 PURPLE CONFIG - Used by new repos automatically');
        } else if (fileName.includes('with-q3')) {
          console.log('   ✅ WITH-Q3 CONFIG - Your preferred content');
        } else if (fileName.includes('68a770b8140b9c0174c13ce7.json')) {
          console.log('   📋 BASE CONFIG - Original class config');
        }
        
      } catch (error) {
        console.log(`   ❌ Error reading config: ${error.message}`);
      }
    } else {
      console.log(`❌ Not found: ${path.basename(configPath)}`);
    }
  }
  
  console.log('\n🎯 Based on the system logic:');
  console.log('=' .repeat(50));
  
  // Check if purple config exists (highest priority for new repos)
  const purpleConfigPath = '/Users/macbook/Developer/reshapelab/OSS-Daddy Old/oss-bot/OSS-Doorway/src/config/generated/quest_config_68a770b8140b9c0174c13ce7_purple_1756928031626.json';
  
  if (fs.existsSync(purpleConfigPath)) {
    console.log('✅ NEW REPOS (like jmk658) would use: PURPLE CONFIG');
    console.log('   - Config ID: 68a770b8140b9c0174c13ce7_purple_1756928031626');
    console.log('   - Location: OSS-Doorway/src/config/generated/');
    console.log('   - Content: Updated with your preferred Q1, Q2, Q3 content');
    console.log('   - Reason: Purple configs are auto-selected for new repo creation');
  } else {
    console.log('❌ Purple config not found - new repos would use base config');
  }
  
  console.log('\n📝 For jmk658-cs386-software-engineering specifically:');
  console.log('Since the user is not in the database, this is likely a new or test repo.');
  console.log('It would use the PURPLE config with your preferred content.');
  
  // Let's also check what the actual repo structure looks like by examining similar repos
  console.log('\n🔍 Checking for similar CS386 repo patterns...');
  
  const cs386Files = [
    '/Users/macbook/Developer/reshapelab/OSS-Daddy Old/oss-bot/OSS-Management/quest_config_kds472-cs386-software-engineering_68a770b8140b9c0174c13ce7.json'
  ];
  
  for (const filePath of cs386Files) {
    if (fs.existsSync(filePath)) {
      console.log(`✅ Found similar repo config: ${path.basename(filePath)}`);
      
      try {
        const config = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        console.log(`   - Config ID: ${config.classId || config.configId || 'N/A'}`);
        console.log(`   - Group ID: ${config.groupId || 'N/A'}`);
        
        if (config.config) {
          const quests = Object.keys(config.config).filter(k => k.startsWith('Q'));
          console.log(`   - Quests: ${quests.join(', ')}`);
        }
        
      } catch (error) {
        console.log(`   ❌ Error reading: ${error.message}`);
      }
    }
  }
}

determineCS386Config();



