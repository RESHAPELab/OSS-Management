const fs = require('fs');
const path = require('path');

// Read the original quest configuration file
const configPath = path.join(__dirname, '..', 'quest_config_68accc656847fdb7c19b1f0a-test.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

console.log('🔍 [fix-image-validation-original] Starting to fix image validation parameters...');

// Tasks that need image validation fixes (T4-T13)
const imageTasks = ['T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12', 'T13'];

let updatedCount = 0;

// Update each task's llmTextValidation
imageTasks.forEach(taskId => {
  if (config.config.TEMP_1756847144814 && config.config.TEMP_1756847144814[taskId]) {
    const task = config.config.TEMP_1756847144814[taskId];
    
    if (task.llmTextValidation) {
      // Update the validation parameters to accept both formats
      task.llmTextValidation.question = "The student should provide an image URL in the format ![Image](url) or an HTML img tag. Validate that the response contains an image URL.";
      task.llmTextValidation.validationParameters = [
        "Must contain image URL in ![Image](url) format OR HTML img tag",
        "Must include valid URL link",
        "Accept both Markdown and HTML image formats"
      ];
      
      console.log(`✅ [fix-image-validation-original] Updated ${taskId} validation parameters`);
      updatedCount++;
    }
  }
});

// Save the updated configuration
fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

console.log(`✅ [fix-image-validation-original] Successfully updated ${updatedCount} tasks`);
console.log(`📁 [fix-image-validation-original] Updated file: ${configPath}`);

// Also create a backup
const backupPath = path.join(__dirname, '..', `quest_config_68accc656847fdb7c19b1f0a-test_fixed_${Date.now()}.json`);
fs.writeFileSync(backupPath, JSON.stringify(config, null, 2));
console.log(`💾 [fix-image-validation-original] Backup created: ${backupPath}`);
