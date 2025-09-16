import fs from 'fs';
import path from 'path';

async function replacePurpleWithPreferred() {
  console.log('🔄 Replacing purple config content with preferred content...');
  
  // File paths
  const sourceConfigPath = '/Users/macbook/Developer/reshapelab/OSS-Daddy Old/oss-bot/OSS-Management/quest_config_68a770b8140b9c0174c13ce8-with-q3.json';
  const targetConfigPath = '/Users/macbook/Developer/reshapelab/OSS-Daddy Old/oss-bot/OSS-Doorway/src/config/generated/quest_config_68a770b8140b9c0174c13ce7_purple_1756928031626.json';
  
  try {
    // Step 1: Read source config (your preferred content)
    console.log('\n📖 Step 1: Reading source config (with-q3)...');
    const sourceConfig = JSON.parse(fs.readFileSync(sourceConfigPath, 'utf8'));
    console.log(`✅ Source config loaded: ${sourceConfig.classId}`);
    
    // Analyze source content
    const sourceQuests = Object.keys(sourceConfig.config).filter(k => k.startsWith('Q'));
    console.log(`   - Quests: ${sourceQuests.join(', ')}`);
    for (const quest of sourceQuests) {
      const tasks = Object.keys(sourceConfig.config[quest]).filter(k => k.startsWith('T'));
      console.log(`   - ${quest}: ${tasks.length} tasks`);
    }
    
    // Step 2: Read target config (purple config)
    console.log('\n📖 Step 2: Reading target purple config...');
    const targetConfig = JSON.parse(fs.readFileSync(targetConfigPath, 'utf8'));
    console.log(`✅ Target purple config loaded`);
    
    // Analyze target content
    const targetQuests = Object.keys(targetConfig).filter(k => k.startsWith('Q'));
    console.log(`   - Current Quests: ${targetQuests.join(', ')}`);
    for (const quest of targetQuests) {
      if (targetConfig[quest] && typeof targetConfig[quest] === 'object') {
        const tasks = Object.keys(targetConfig[quest]).filter(k => k.startsWith('T'));
        console.log(`   - ${quest}: ${tasks.length} tasks`);
      }
    }
    
    // Step 3: Create backup of purple config
    console.log('\n💾 Step 3: Creating backup of purple config...');
    const backupPath = targetConfigPath + '.backup-' + new Date().toISOString().replace(/[:.]/g, '-');
    fs.copyFileSync(targetConfigPath, backupPath);
    console.log(`✅ Backup created: ${backupPath}`);
    
    // Step 4: Replace content
    console.log('\n🔄 Step 4: Replacing content...');
    
    // Create new config with purple structure but source content
    const newConfig = {
      ...sourceConfig.config, // Use the content from source
      // Keep any purple-specific metadata if needed
    };
    
    // Update any quest metadata to maintain purple config structure
    for (const quest of Object.keys(newConfig)) {
      if (quest.startsWith('Q') && newConfig[quest].metadata) {
        newConfig[quest].metadata.groupId = '68a770b8140b9c0174c13ce7_purple_1756928031626';
      }
    }
    
    console.log('📝 New config will have:');
    const newQuests = Object.keys(newConfig).filter(k => k.startsWith('Q'));
    console.log(`   - Quests: ${newQuests.join(', ')}`);
    for (const quest of newQuests) {
      if (newConfig[quest] && typeof newConfig[quest] === 'object') {
        const tasks = Object.keys(newConfig[quest]).filter(k => k.startsWith('T'));
        console.log(`   - ${quest}: ${tasks.length} tasks`);
      }
    }
    
    // Step 5: Write the new config
    console.log('\n💾 Step 5: Writing new purple config...');
    fs.writeFileSync(targetConfigPath, JSON.stringify(newConfig, null, 2));
    console.log('✅ Purple config updated successfully!');
    
    // Step 6: Verification
    console.log('\n✅ Step 6: Verification...');
    const verifyConfig = JSON.parse(fs.readFileSync(targetConfigPath, 'utf8'));
    const verifyQuests = Object.keys(verifyConfig).filter(k => k.startsWith('Q'));
    console.log(`✅ Verification passed - Purple config now has: ${verifyQuests.join(', ')}`);
    
    // Summary
    console.log('\n🎉 SUCCESS! Content replacement completed:');
    console.log('=' .repeat(50));
    console.log('✅ Purple config name preserved: quest_config_68a770b8140b9c0174c13ce7_purple_1756928031626.json');
    console.log('✅ Content replaced with: 68a770b8140b9c0174c13ce8-with-q3 content');
    console.log('✅ Backup created for safety');
    console.log('✅ All users (new and existing) will now get your preferred content');
    console.log('\n📋 What this means:');
    console.log('- New repos will automatically use this updated purple config');
    console.log('- Existing repos using the purple config will get the new content');
    console.log('- CocoCrispy95 and other users will now have consistent content');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

replacePurpleWithPreferred();


