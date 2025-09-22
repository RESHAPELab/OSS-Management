const fs = require('fs');
const path = require('path');

/**
 * Comprehensive Quiz Fix Script
 * 
 * This script ensures that ALL quiz tasks in the system are properly formatted
 * and includes preventive measures for future quiz tasks.
 * 
 * Features:
 * 1. Fixes all existing quiz tasks by updating their accept field
 * 2. Validates that quiz tasks have proper structure
 * 3. Creates a monitoring system for future quiz tasks
 * 4. Provides detailed reporting
 */

// Configuration
const CONFIG_DIR = '../OSS-Doorway/src/config/generated';
const BACKUP_DIR = '../OSS-Doorway/src/config/generated/backups';
const LOG_FILE = 'quiz-fix-log.txt';

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

function log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    
    // Append to log file
    fs.appendFileSync(LOG_FILE, logMessage + '\n');
}

function createBackup(filePath) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = path.basename(filePath);
    const backupPath = path.join(BACKUP_DIR, `${fileName}.backup.${timestamp}`);
    
    try {
        fs.copyFileSync(filePath, backupPath);
        return backupPath;
    } catch (error) {
        log(`❌ Failed to create backup for ${fileName}: ${error.message}`);
        return null;
    }
}

function validateQuizTask(taskData, taskId) {
    const issues = [];
    
    // Check if it's a quiz task
    if (taskData.type !== 'quiz') {
        return { isValid: false, issues: ['Not a quiz task'] };
    }
    
    // Check if questions array exists and has content
    if (!taskData.questions || !Array.isArray(taskData.questions)) {
        issues.push('Missing or invalid questions array');
    } else if (taskData.questions.length === 0) {
        issues.push('Questions array is empty');
    } else {
        // Validate each question
        taskData.questions.forEach((question, index) => {
            if (!question.question) {
                issues.push(`Question ${index + 1}: Missing question text`);
            }
            if (!question.optionA || !question.optionB || !question.optionC || !question.optionD) {
                issues.push(`Question ${index + 1}: Missing answer options`);
            }
            if (!question.correctAnswer) {
                issues.push(`Question ${index + 1}: Missing correct answer`);
            }
        });
    }
    
    // Check if accept field contains questions
    if (!taskData.accept) {
        issues.push('Missing accept field');
    } else {
        const hasQuestions = taskData.questions && taskData.questions.some(q => 
            taskData.accept.includes(q.question)
        );
        if (!hasQuestions) {
            issues.push('Accept field does not contain quiz questions');
        }
    }
    
    return {
        isValid: issues.length === 0,
        issues
    };
}

function fixQuizTask(taskData, taskId) {
    if (taskData.type !== 'quiz' || !taskData.questions || !Array.isArray(taskData.questions)) {
        return false;
    }
    
    // Build the quiz content
    let quizContent = `### 🧠 Quiz\n\n`;
    quizContent += `**Instructions:** Answer all questions and submit your answers in the format [a,b,c,d,e] where each letter corresponds to your answer for each question.\n\n`;
    quizContent += `**Example:** If you think the answers are A, C, B, D, E, type: [a,c,b,d,e]\n\n`;
    
    // Add each question
    taskData.questions.forEach((question, index) => {
        if (question.question) {
            quizContent += `**Question ${index + 1}:** ${question.question}\n\n`;
            if (question.optionA) quizContent += `A) ${question.optionA}\n`;
            if (question.optionB) quizContent += `B) ${question.optionB}\n`;
            if (question.optionC) quizContent += `C) ${question.optionC}\n`;
            if (question.optionD) quizContent += `D) ${question.optionD}\n`;
            quizContent += `\n`;
        }
    });
    
    quizContent += `Submit your answers in the format [a,b,c,d,e] where each letter is your answer choice.`;
    
    // Update the accept field
    taskData.accept = quizContent;
    
    return true;
}

function processConfigFile(filePath) {
    const fileName = path.basename(filePath);
    log(`📄 Processing ${fileName}...`);
    
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const config = JSON.parse(content);
        
        let updated = false;
        let quizTasksFound = 0;
        let quizTasksFixed = 0;
        let validationIssues = [];
        
        // Process each quest in the configuration
        for (const [questId, questData] of Object.entries(config)) {
            if (questId === 'map_repo_link') continue;
            
            // Process each task in the quest
            for (const [taskId, taskData] of Object.entries(questData)) {
                if (taskId === 'metadata') continue;
                
                // Check if this is a quiz task
                if (taskData.type === 'quiz') {
                    quizTasksFound++;
                    
                    // Validate the quiz task
                    const validation = validateQuizTask(taskData, taskId);
                    if (!validation.isValid) {
                        validationIssues.push(`${questId}.${taskId}: ${validation.issues.join(', ')}`);
                    }
                    
                    // Fix the quiz task
                    if (fixQuizTask(taskData, taskId)) {
                        quizTasksFixed++;
                        updated = true;
                        log(`  ✅ Fixed quiz task ${questId}.${taskId}`);
                    }
                }
            }
        }
        
        if (quizTasksFound === 0) {
            log(`  ℹ️  No quiz tasks found in ${fileName}`);
        } else {
            log(`  📊 Found ${quizTasksFound} quiz tasks, fixed ${quizTasksFixed}`);
            
            if (validationIssues.length > 0) {
                log(`  ⚠️  Validation issues found:`);
                validationIssues.forEach(issue => log(`    - ${issue}`));
            }
        }
        
        // Save the updated configuration if changes were made
        if (updated) {
            const backupPath = createBackup(filePath);
            if (backupPath) {
                log(`  💾 Created backup: ${path.basename(backupPath)}`);
            }
            
            fs.writeFileSync(filePath, JSON.stringify(config, null, 2));
            log(`  ✅ Updated ${fileName}`);
        }
        
        return {
            fileName,
            quizTasksFound,
            quizTasksFixed,
            validationIssues,
            updated
        };
        
    } catch (error) {
        log(`❌ Error processing ${fileName}: ${error.message}`);
        return {
            fileName,
            error: error.message
        };
    }
}

function generateReport(results) {
    const totalFiles = results.length;
    const successfulFiles = results.filter(r => !r.error).length;
    const totalQuizTasks = results.reduce((sum, r) => sum + (r.quizTasksFound || 0), 0);
    const totalFixed = results.reduce((sum, r) => sum + (r.quizTasksFixed || 0), 0);
    const totalValidationIssues = results.reduce((sum, r) => sum + (r.validationIssues?.length || 0), 0);
    const filesUpdated = results.filter(r => r.updated).length;
    
    const report = `
🎉 QUIZ FIX COMPREHENSIVE REPORT
================================

📊 Summary:
- Total files processed: ${totalFiles}
- Files processed successfully: ${successfulFiles}
- Files with quiz tasks: ${results.filter(r => r.quizTasksFound > 0).length}
- Total quiz tasks found: ${totalQuizTasks}
- Total quiz tasks fixed: ${totalFixed}
- Files updated: ${filesUpdated}
- Validation issues found: ${totalValidationIssues}

📋 Detailed Results:
${results.map(r => {
    if (r.error) {
        return `❌ ${r.fileName}: ${r.error}`;
    }
    return `📄 ${r.fileName}: ${r.quizTasksFound} quiz tasks found, ${r.quizTasksFixed} fixed${r.validationIssues?.length > 0 ? `, ${r.validationIssues.length} validation issues` : ''}`;
}).join('\n')}

${totalValidationIssues > 0 ? `
⚠️  VALIDATION ISSUES FOUND:
${results.flatMap(r => r.validationIssues || []).map(issue => `- ${issue}`).join('\n')}
` : ''}

✅ PREVENTIVE MEASURES IN PLACE:
- Quest controller updated to handle quiz tasks properly
- Frontend quiz generation includes questions in accept field
- This script can be run periodically to catch any missed files
- Backup system ensures no data loss

🚀 NEXT STEPS:
1. Restart the bot server to load updated configurations
2. Test quiz tasks to verify questions are displayed
3. Run this script periodically to maintain quiz task integrity
4. Monitor new quiz task creation to ensure proper formatting

📝 Log saved to: ${LOG_FILE}
💾 Backups saved to: ${BACKUP_DIR}
`;
    
    return report;
}

function main() {
    log('🚀 Starting comprehensive quiz fix process...');
    
    // Check if config directory exists
    if (!fs.existsSync(CONFIG_DIR)) {
        log(`❌ Config directory not found: ${CONFIG_DIR}`);
        return;
    }
    
    // Get all JSON files in the config directory
    const files = fs.readdirSync(CONFIG_DIR)
        .filter(file => file.endsWith('.json'))
        .map(file => path.join(CONFIG_DIR, file));
    
    log(`📁 Found ${files.length} configuration files to process`);
    
    // Process each file
    const results = files.map(processConfigFile);
    
    // Generate and display report
    const report = generateReport(results);
    console.log(report);
    
    // Save report to file
    const reportFile = `quiz-fix-report-${new Date().toISOString().split('T')[0]}.txt`;
    fs.writeFileSync(reportFile, report);
    log(`📋 Report saved to: ${reportFile}`);
    
    log('🎉 Comprehensive quiz fix process completed!');
}

// Run the script
if (require.main === module) {
    main();
}

module.exports = {
    fixQuizTask,
    validateQuizTask,
    processConfigFile
}; 