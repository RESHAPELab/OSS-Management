const { MongoClient } = require('mongodb');

// MongoDB connection details
const OSS_DOORWAY_URI = process.env.OSS_DOORWAY_DB_URI || 'mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/?retryWrites=true&w=majority&appName=gamification';
const OSS_DOORWAY_DB_NAME = process.env.OSS_DOORWAY_DB_NAME || 'test';

async function updateDatabaseImageValidation() {
  const client = new MongoClient(OSS_DOORWAY_URI);
  
  try {
    console.log('🔍 [update-database-image-validation] Connecting to database...');
    await client.connect();
    console.log('✅ [update-database-image-validation] Connected to MongoDB');
    
    const db = client.db(OSS_DOORWAY_DB_NAME);
    
    // Find the quest configuration for the test student
    const questConfig = await db.collection('questconfigs').findOne({
      configId: '68accc656847fdb7c19b1f0a-test'
    });
    
    if (!questConfig) {
      console.log('❌ [update-database-image-validation] Quest config not found in database');
      return;
    }
    
    console.log('✅ [update-database-image-validation] Found quest config:', questConfig.configId);
    
    // Update the configuration with the new validation parameters
    const updatedConfig = { ...questConfig };
    
    // Tasks that need image validation fixes (T4-T13)
    const imageTasks = ['T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12', 'T13'];
    
    let updatedCount = 0;
    
    // Update each task's llmTextValidation
    imageTasks.forEach(taskId => {
      if (updatedConfig.config.TEMP_1756847144814 && updatedConfig.config.TEMP_1756847144814[taskId]) {
        const task = updatedConfig.config.TEMP_1756847144814[taskId];
        
        if (task.llmTextValidation) {
          // Update the validation parameters to accept both formats
          task.llmTextValidation.question = "The student should provide an image URL in the format ![Image](url) or an HTML img tag. Validate that the response contains an image URL.";
          task.llmTextValidation.validationParameters = [
            "Must contain image URL in ![Image](url) format OR HTML img tag",
            "Must include valid URL link",
            "Accept both Markdown and HTML image formats"
          ];
          
          console.log(`✅ [update-database-image-validation] Updated ${taskId} validation parameters`);
          updatedCount++;
        }
      }
    });
    
    if (updatedCount === 0) {
      console.log('⚠️ [update-database-image-validation] No tasks were updated');
      return;
    }
    
    // Update the database
    const result = await db.collection('questconfigs').updateOne(
      { _id: questConfig._id },
      { 
        $set: { 
          config: updatedConfig.config,
          updatedAt: new Date()
        } 
      }
    );
    
    if (result.modifiedCount > 0) {
      console.log(`✅ [update-database-image-validation] Successfully updated ${updatedCount} tasks in database`);
      console.log(`📊 [update-database-image-validation] Modified ${result.modifiedCount} document(s)`);
    } else {
      console.log('⚠️ [update-database-image-validation] No documents were modified');
    }
    
  } catch (error) {
    console.error('❌ [update-database-image-validation] Error:', error);
  } finally {
    await client.close();
    console.log('🔌 [update-database-image-validation] Database connection closed');
  }
}

updateDatabaseImageValidation();
