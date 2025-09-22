const fs = require('fs');

const config = JSON.parse(fs.readFileSync('quest_config_68a770b8140b9c0174c13ce7.json', 'utf8'));

console.log('=== QUEST CONFIG VALIDATION ===');
console.log('All questConfig keys:', Object.keys(config.questConfig));
console.log('Quest keys only:', Object.keys(config.questConfig).filter(key => key.startsWith('Q')));
console.log('Q1 exists:', !!config.questConfig.Q1);
console.log('Q2 exists:', !!config.questConfig.Q2);

if (config.questConfig.Q2) {
  console.log('\n=== Q2 DETAILS ===');
  console.log('Q2 metadata:', config.questConfig.Q2.metadata);
  console.log('Q2 task count:', Object.keys(config.questConfig.Q2).filter(key => key.startsWith('T')).length);
} else {
  console.log('\n❌ Q2 NOT FOUND in local file!');
}


