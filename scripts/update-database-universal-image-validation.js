const { MongoClient } = require('mongodb');

// MongoDB connection details
const OSS_DOORWAY_URI = process.env.OSS_DOORWAY_DB_URI || 'mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/?retryWrites=true&w=majority&appName=gamification';
const OSS_DOORWAY_DB_NAME = process.env.OSS_DOORWAY_DB_NAME || 'test';

async function updateDatabaseUniversalImageValidation() {
  const client = new MongoClient(OSS_DOORWAY_URI);
  
  try {
    console.log('🔍 [update-database-universal-image] Connecting to database...');
    await client.connect();
    console.log('✅ [update-database-universal-image] Connected to MongoDB');
    
    const db = client.db(OSS_DOORWAY_DB_NAME);
    
    // Find the quest configuration for the test student
    const questConfig = await db.collection('questconfigs').findOne({
      configId: '68accc656847fdb7c19b1f0a-test'
    });
    
    if (!questConfig) {
      console.log('❌ [update-database-universal-image] Quest config not found in database');
      return;
    }
    
    console.log('✅ [update-database-universal-image] Found quest config:', questConfig.configId);
    
    // Update the configuration with universal image validation parameters
    const updatedConfig = { ...questConfig };
    
    // Tasks that need image validation fixes (T4-T13)
    const imageTasks = ['T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12', 'T13'];
    
    let updatedCount = 0;
    
    // Update each task's llmTextValidation with universal image acceptance
    imageTasks.forEach(taskId => {
      if (updatedConfig.config.TEMP_1756847144814 && updatedConfig.config.TEMP_1756847144814[taskId]) {
        const task = updatedConfig.config.TEMP_1756847144814[taskId];
        
        if (task.llmTextValidation) {
          // Update with universal image validation that accepts ALL formats
          task.llmTextValidation.question = "The student should provide an image. Accept ANY format that contains an image - this includes Markdown ![Image](url), HTML img tags, direct image URLs, GitHub attachments, or any other image format. The key is that there must be an image present.";
          task.llmTextValidation.validationParameters = [
            "Accept ANY image format (Markdown, HTML, direct URLs, GitHub attachments, etc.)",
            "Must contain an image reference or URL",
            "Be very lenient - accept any reasonable image submission",
            "Focus on presence of image, not specific format"
          ];
          
          console.log(`✅ [update-database-universal-image] Updated ${taskId} with universal image validation`);
          updatedCount++;
        }
      }
    });
    
    if (updatedCount === 0) {
      console.log('⚠️ [update-database-universal-image] No tasks were updated');
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
      console.log(`✅ [update-database-universal-image] Successfully updated ${updatedCount} tasks in database`);
      console.log(`📊 [update-database-universal-image] Modified ${result.modifiedCount} document(s)`);
      console.log('🎯 [update-database-universal-image] Now accepts ALL image formats!');
    } else {
      console.log('⚠️ [update-database-universal-image] No documents were modified');
    }
    
  } catch (error) {
    console.error('❌ [update-database-universal-image] Error:', error);
  } finally {
    await client.close();
    console.log('🔌 [update-database-universal-image] Database connection closed');
  }
}

updateDatabaseUniversalImageValidation();
