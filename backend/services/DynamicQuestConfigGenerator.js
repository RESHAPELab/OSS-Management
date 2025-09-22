const fs = require('fs');
const path = require('path');
const axios = require('axios');
const QuestOrderGenerator = require('../utils/QuestOrderGenerator');

class DynamicQuestConfigGenerator {
    constructor(groupId, baseURL = 'https://oss-michael-production.up.railway.app') {
        this.groupId = groupId;
        this.baseURL = baseURL;
        this.baseConfigPath = path.join(__dirname, '../config/quest_config.json');
        this.outputDir = path.join(__dirname, '../../../OSS-Doorway/src/config/generated');
        this.outputPath = path.join(this.outputDir, `quest_config_${groupId}.json`);
        this.questOrderGenerator = new QuestOrderGenerator();
    }

    async getQuestOrderFromDatabase() {
        try {
            const response = await axios.get(`${this.baseURL}/api/group/${this.groupId}/quest-order`);
            return response.data.questOrder || [];
        } catch (error) {
            console.error('Error fetching quest order from database, using JSON configuration:', error);
            return this.questOrderGenerator.generateQuestOrder();
        }
    }

    getDefaultQuestOrder() {
        // Use the QuestOrderGenerator to generate quest order from JSON
        try {
            return this.questOrderGenerator.generateQuestOrder();
        } catch (error) {
            console.error('Error generating quest order from JSON:', error);
            throw error; // Let the error bubble up instead of falling back
        }
    }

    async fetchQuestData(questItem) {
        if (questItem.questType === 'fixed') {
            return await this.getFixedQuestData(questItem);
        } else {
            return await this.getCustomQuestData(questItem);
        }
    }

    async getFixedQuestData(questItem) {
        try {
            // Read from existing quest_config.json
            if (!fs.existsSync(this.baseConfigPath)) {
                console.warn(`Base config file not found: ${this.baseConfigPath}`);
                return this.createDefaultFixedQuest(questItem);
            }

            const baseConfig = JSON.parse(fs.readFileSync(this.baseConfigPath, 'utf8'));
            
            // Find the specific fixed quest
            const fixedQuest = baseConfig.quests.find(q => q.id === questItem.questId);
            
            if (!fixedQuest) {
                console.warn(`Fixed quest ${questItem.questId} not found in base config, creating default`);
                return this.createDefaultFixedQuest(questItem);
            }
            
            return {
                id: questItem.questId,
                title: questItem.title,
                description: fixedQuest.description || questItem.title,
                type: 'fixed',
                sequenceNumber: questItem.sequenceNumber,
                isQ0: questItem.isQ0,
                prerequisites: questItem.prerequisites || [],
                tasks: fixedQuest.tasks || [],
                metadata: {
                    source: 'static_config',
                    lastUpdated: new Date().toISOString()
                }
            };
        } catch (error) {
            console.error(`Error fetching fixed quest ${questItem.questId}:`, error);
            return this.createDefaultFixedQuest(questItem);
        }
    }

    createDefaultFixedQuest(questItem) {
        return {
            id: questItem.questId,
            title: questItem.title,
            description: `Default description for ${questItem.title}`,
            type: 'fixed',
            sequenceNumber: questItem.sequenceNumber,
            isQ0: questItem.isQ0,
            prerequisites: questItem.prerequisites || [],
            tasks: [],
            metadata: {
                source: 'default_generated',
                lastUpdated: new Date().toISOString()
            }
        };
    }

    async getCustomQuestData(questItem) {
        try {
            // Fetch from MongoDB quests collection - this should include populated tasks
            const response = await axios.get(`${this.baseURL}/api/quest/${questItem.questId}`);
            
            if (!response.data.success) {
                throw new Error(`Custom quest ${questItem.questId} not found`);
            }
            
            const customQuest = response.data.data;
            console.log(`[getCustomQuestData] Fetched quest data:`, {
                questId: customQuest._id,
                title: customQuest.questTitle,
                tasksCount: customQuest.tasks ? customQuest.tasks.length : 0,
                taskTypes: customQuest.tasks ? customQuest.tasks.map(t => t.type || 'unknown') : []
            });
            
            // Transform MongoDB format to config format
            return {
                id: questItem.questId,
                title: customQuest.questTitle,
                description: customQuest.description || '',
                type: 'custom',
                sequenceNumber: questItem.sequenceNumber,
                isQ0: questItem.isQ0,
                prerequisites: questItem.prerequisites || [],
                tasks: await this.transformCustomTasks(customQuest.tasks || []),
                metadata: {
                    source: 'mongodb',
                    professorId: customQuest.professor,
                    createdAt: customQuest.createdAt,
                    lastUpdated: customQuest.updatedAt
                }
            };
        } catch (error) {
            console.error(`Error fetching custom quest ${questItem.questId}:`, error);
            return null;
        }
    }

    async transformCustomTasks(tasks) {
        if (!tasks || !Array.isArray(tasks)) {
            console.warn('[transformCustomTasks] No tasks provided or not an array');
            return [];
        }

        const transformedTasks = [];
        
        for (const task of tasks) {
            try {
                // Handle case where task might be a populated object or just an ID
                let taskData = task;
                
                // If task is just an ObjectId string, we need to fetch it
                // For now, let's assume the quest API returns populated task data
                if (typeof task === 'string') {
                    console.warn(`[transformCustomTasks] Task is just an ID: ${task}, skipping...`);
                    continue;
                }
                
                console.log(`[transformCustomTasks] Processing task:`, {
                    id: taskData._id,
                    title: taskData.taskTitle,
                    type: taskData.type,
                    answerType: taskData.answerType,
                    ossRepository: taskData.ossRepository,
                    apiEndpoint: taskData.apiEndpoint,
                    responsePath: taskData.responsePath,
                    expectedAnswerType: taskData.expectedAnswerType,
                    repository: taskData.repository
                });
                
                const type = this.determineTaskType(taskData);
                const config = this.buildTaskConfig(taskData);
                
                const transformed = {
                    id: taskData._id,
                    title: taskData.taskTitle,
                    description: taskData.desc,
                    objective: taskData.objective || this.extractFieldFromResponse(taskData.responses?.accept, 'Objective'),
                    outcome: taskData.outcome || this.extractFieldFromResponse(taskData.responses?.accept, 'Outcome'),
                    helpText: taskData.helpText || this.extractFieldFromResponse(taskData.responses?.accept, 'Help'),
                    points: taskData.points,
                    xp: taskData.xp,
                    type,
                    config,
                    hints: taskData.hints || [],
                    detailedHints: taskData.detailedHints || [],
                    responses: {
                        accept: taskData.responses?.accept,
                        error: taskData.responses?.error,
                        success: taskData.responses?.success
                    }
                };
                
                // For metric tasks, also set ossRepository and issueNumber at the top level
                if (type === 'get-issue-count' || type === 'get-pr-count' || type === 'get-open-issue' || type === 'get-top-contributor') {
                    transformed.ossRepository = taskData.ossRepository || config.ossRepository || '';
                    console.log(`[transformCustomTasks] Added ossRepository for ${type}: ${transformed.ossRepository}`);
                }
                if (type === 'get-issue-title') {
                    transformed.ossRepository = taskData.ossRepository || config.ossRepository || '';
                    transformed.issueNumber = taskData.issueNumber || config.issueNumber || '';
                    console.log(`[transformCustomTasks] Added ossRepository and issueNumber for ${type}: ${transformed.ossRepository}, ${transformed.issueNumber}`);
                }
                if (type === 'custom-api-call') {
                    transformed.apiEndpoint = taskData.apiEndpoint || config.apiEndpoint || '';
                    transformed.responsePath = taskData.responsePath || config.responsePath || '';
                    transformed.expectedAnswerType = taskData.expectedAnswerType || config.expectedAnswerType || 'Number';
                    transformed.repository = taskData.repository || config.repository || '';
                    transformed.saveValidatedData = taskData.saveValidatedData || config.saveValidatedData || false;
                    transformed.savedDataName = taskData.savedDataName || config.savedDataName || '';
                    console.log(`[transformCustomTasks] Added custom-api-call fields for ${type}:`, {
                        apiEndpoint: transformed.apiEndpoint,
                        responsePath: transformed.responsePath,
                        expectedAnswerType: transformed.expectedAnswerType,
                        repository: transformed.repository,
                        saveValidatedData: transformed.saveValidatedData,
                        savedDataName: transformed.savedDataName
                    });
                }
                if (type === 'llm-text-validation') {
                    transformed.llmTextValidation = {
                        question: taskData.llmTextValidation?.question || config.llmTextValidation?.question || '',
                        validationParameters: taskData.llmTextValidation?.validationParameters || config.llmTextValidation?.validationParameters || [],
                        temperature: taskData.llmTextValidation?.temperature || config.llmTextValidation?.temperature || 0.1,
                        enableDetailedFeedback: taskData.llmTextValidation?.enableDetailedFeedback || config.llmTextValidation?.enableDetailedFeedback || false
                    };
                    console.log(`[transformCustomTasks] Added llm-text-validation fields for ${type}:`, {
                        question: transformed.llmTextValidation.question,
                        validationParameters: transformed.llmTextValidation.validationParameters,
                        temperature: transformed.llmTextValidation.temperature,
                        enableDetailedFeedback: transformed.llmTextValidation.enableDetailedFeedback
                    });
                }
                if (type === 'collect-info') {
                    transformed.saveValidatedData = taskData.saveValidatedData || config.saveValidatedData || false;
                    transformed.savedDataName = taskData.savedDataName || config.savedDataName || '';
                    transformed.question = taskData.question || config.question || '';
                    console.log(`[transformCustomTasks] Added collect-info fields for ${type}:`, {
                        saveValidatedData: transformed.saveValidatedData,
                        savedDataName: transformed.savedDataName,
                        question: transformed.question
                    });
                }
                
                transformedTasks.push(transformed);
            } catch (error) {
                console.error(`Error transforming task:`, error);
            }
        }
        
        console.log(`[transformCustomTasks] Transformed ${transformedTasks.length} tasks`);
        return transformedTasks;
    }

    determineTaskType(task) {
        // First, check if task has an explicit type field (most reliable)
        if (task.type) {
            return task.type;
        }
        
        // Fallback to answerType-based logic for legacy tasks
        if (task.answerType === 'singleAnswer' && task.answer && ['a', 'b', 'c', 'd'].includes(task.answer.toLowerCase())) {
            return 'multiple-choice';
        } else if (task.answerType === 'multipleAnswers') {
            return 'quiz';
        } else if (task.answerType === 'metric') {
            return 'get-issue-count'; // Default metric type
        } else if (task.answerType === 'llm-validation') {
            return 'llm-text-validation';
        } else if (task.answerType === 'text') {
            return 'collect-info';
        } else {
            return 'text-input';
        }
    }

    buildTaskConfig(task) {
        const config = {};
        
        // Handle based on actual task type first
        const taskType = this.determineTaskType(task);
        
        if (taskType === 'multiple-choice') {
            // Parse options from the accept response
            const options = this.parseOptionsFromResponse(task.responses?.accept);
            
            config.correctAnswer = task.answer?.toLowerCase() || 'a';
            config.optionA = options[0] || '';
            config.optionB = options[1] || '';
            config.optionC = options[2] || '';
            config.optionD = options[3] || '';
            config.question = this.extractQuestionFromResponse(task.responses?.accept);
        } else if (taskType === 'get-issue-count' || taskType === 'get-pr-count' || 
                   taskType === 'get-open-issue' || taskType === 'get-top-contributor' || 
                   taskType === 'get-issue-title') {
            // Metric tasks
            config.ossRepository = task.ossRepository || '';
            if (taskType === 'get-issue-title') {
                config.issueNumber = task.issueNumber || '';
            }
        } else if (taskType === 'text-input') {
            config.expectedAnswer = task.expectedAnswer || '';
        } else if (taskType === 'quiz') {
            config.questionCount = task.questionCount || 5;
            config.correctAnswers = task.correctAnswers || '';
        } else if (taskType === 'custom-api-call') {
            console.log(`[buildTaskConfig] Building custom-api-call config for task:`, {
                apiEndpoint: task.apiEndpoint,
                responsePath: task.responsePath,
                expectedAnswerType: task.expectedAnswerType,
                repository: task.repository,
                saveValidatedData: task.saveValidatedData,
                savedDataName: task.savedDataName
            });
            config.apiEndpoint = task.apiEndpoint || '';
            config.responsePath = task.responsePath || '';
            config.expectedAnswerType = task.expectedAnswerType || 'Number';
            config.repository = task.repository || '';
            // New fields for per-user storage
            if (typeof task.saveValidatedData !== 'undefined') {
                config.saveValidatedData = !!task.saveValidatedData;
            }
            if (typeof task.savedDataName !== 'undefined') {
                config.savedDataName = task.savedDataName;
            }
            console.log(`[buildTaskConfig] Final config:`, config);
        } else if (taskType === 'llm-text-validation') {
            console.log(`[buildTaskConfig] Building llm-text-validation config for task:`, {
                question: task.llmTextValidation?.question,
                validationParameters: task.llmTextValidation?.validationParameters,
                temperature: task.llmTextValidation?.temperature,
                enableDetailedFeedback: task.llmTextValidation?.enableDetailedFeedback
            });
            config.llmTextValidation = {
                question: task.llmTextValidation?.question || '',
                validationParameters: task.llmTextValidation?.validationParameters || [],
                temperature: task.llmTextValidation?.temperature || 0.1,
                enableDetailedFeedback: task.llmTextValidation?.enableDetailedFeedback || false
            };
            console.log(`[buildTaskConfig] Final config:`, config);
        } else if (taskType === 'collect-info') {
            console.log(`[buildTaskConfig] Building collect-info config for task:`, {
                saveValidatedData: task.saveValidatedData,
                savedDataName: task.savedDataName,
                question: task.question
            });
            // New fields for per-user storage
            if (typeof task.saveValidatedData !== 'undefined') {
                config.saveValidatedData = !!task.saveValidatedData;
            }
            if (typeof task.savedDataName !== 'undefined') {
                config.savedDataName = task.savedDataName;
            }
            config.question = task.question || '';
            console.log(`[buildTaskConfig] Final config:`, config);
        }
        
        return config;
    }

    parseOptionsFromResponse(acceptResponse) {
        const options = [];
        if (!acceptResponse) return options;
        
        const lines = acceptResponse.split('\n');
        for (const line of lines) {
            if (line.trim().match(/^[A-D]\)/)) {
                const option = line.trim().substring(2).trim();
                options.push(option);
            }
        }
        
        return options;
    }

    extractQuestionFromResponse(acceptResponse) {
        if (!acceptResponse) return '';
        
        const lines = acceptResponse.split('\n');
        for (const line of lines) {
            if (line.includes('Choose the option that')) {
                return line.trim();
            }
        }
        
        return '';
    }

    extractFieldFromResponse(acceptResponse, fieldName) {
        if (!acceptResponse) return '';
        
        const lines = acceptResponse.split('\n');
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line.startsWith(`**${fieldName}:**`)) {
                return line.substring(fieldName.length + 4).trim();
            }
        }
        return '';
    }

    async generateDynamicConfig() {
        try {
            console.log(`Generating dynamic config for group ${this.groupId}...`);
            
            // Step 1: Get quest order from MongoDB
            const questOrder = await this.getQuestOrderFromDatabase();
            console.log('Quest order:', questOrder);
            
            // Step 2: Fetch data for each quest
            const quests = [];
            for (const questItem of questOrder) {
                const questData = await this.fetchQuestData(questItem);
                if (questData) {
                    quests.push(questData);
                }
            }
            
            // Step 3: Create legacy format configuration that the bot expects
            const legacyConfig = {
                map_repo_link: "https://raw.githubusercontent.com/caiton1/OSS-Doorway/main/map"
            };
            
            // Convert each quest to legacy format where quest ID is a direct property
            for (const quest of quests.sort((a, b) => a.sequenceNumber - b.sequenceNumber)) {
                const questId = quest.id;
                
                // Create quest object in legacy format
                legacyConfig[questId] = {
                metadata: {
                        title: quest.title,
                        description: quest.description,
                        prerequisite: quest.prerequisites && quest.prerequisites.length > 0 ? quest.prerequisites[0] : null,
                        type: quest.type
                    }
                };
                
                // Add tasks in legacy format (T1, T2, etc.)
                if (quest.tasks && Array.isArray(quest.tasks)) {
                    quest.tasks.forEach((task, index) => {
                        const taskId = `T${index + 1}`;
                        
                        // Create base task object
                        const legacyTask = {
                            desc: task.description || task.title,
                            points: task.points || 100,
                            xp: task.xp || task.points || 100,
                            type: task.type || 'general'
                        };
                        
                        // For metric tasks, add ossRepository and issueNumber at task level
                        if (task.type === 'get-issue-count' || task.type === 'get-pr-count' || 
                            task.type === 'get-open-issue' || task.type === 'get-top-contributor') {
                            legacyTask.ossRepository = task.ossRepository || task.config?.ossRepository || '';
                            legacyTask.type = task.type; // Ensure the exact type is preserved
                            // Persist per-user save controls for issue-count
                            if (task.type === 'get-issue-count') {
                                legacyTask.saveValidatedData = task.config?.saveValidatedData || false;
                                legacyTask.savedDataName = task.config?.savedDataName || '';
                            }
                        }
                        
                        if (task.type === 'get-issue-title') {
                            legacyTask.ossRepository = task.ossRepository || task.config?.ossRepository || '';
                            legacyTask.issueNumber = task.issueNumber || task.config?.issueNumber || '';
                            legacyTask.type = task.type;
                        }
                        
                        if (task.type === 'issue-no') {
                            legacyTask.repository = task.repository || task.config?.repository || '';
                            legacyTask.type = task.type;
                            legacyTask.saveValidatedData = task.config?.saveValidatedData || false;
                            legacyTask.savedDataName = task.config?.savedDataName || '';
                        }
                        
                        // For MCQ tasks, add options and answer
                        if (task.type === 'multiple-choice' || task.type === 'mcq') {
                            legacyTask.correctAnswer = task.config?.correctAnswer || 'a';
                            legacyTask.options = [
                                task.config?.optionA || '',
                                task.config?.optionB || '',
                                task.config?.optionC || '',
                                task.config?.optionD || ''
                            ];
                            legacyTask.answer = task.config?.correctAnswer || 'a';
                            legacyTask.type = 'multiple-choice';
                        }
                        
                        // For text input tasks
                        if (task.type === 'text-input') {
                            legacyTask.expectedAnswer = task.config?.expectedAnswer || '';
                        }
                        
                        // For quiz tasks
                        if (task.type === 'quiz') {
                            legacyTask.questionCount = task.config?.questionCount || 5;
                            legacyTask.correctAnswers = task.config?.correctAnswers || '';
                        }

                        // For custom-api-call tasks
                        if (task.type === 'custom-api-call') {
                            legacyTask.saveValidatedData = task.config?.saveValidatedData || false;
                            legacyTask.savedDataName = task.config?.savedDataName || '';
                        }
                        
                        // For collect-info tasks
                        if (task.type === 'collect-info') {
                            legacyTask.saveValidatedData = task.config?.saveValidatedData || false;
                            legacyTask.savedDataName = task.config?.savedDataName || '';
                            legacyTask.question = task.config?.question || '';
                        }
                        
                        legacyConfig[questId][taskId] = legacyTask;
                    });
                }
            }
            
            // Step 4: Save to file
            await this.saveConfigToFile(legacyConfig);
            
            console.log(`✅ Dynamic config generated successfully in legacy format: ${this.outputPath}`);
            console.log(`Generated quest IDs: ${Object.keys(legacyConfig).filter(k => k !== 'map_repo_link')}`);
            
            // Return metadata for API response (but save legacy format to file)
            const metadata = {
                    generatedAt: new Date().toISOString(),
                    groupId: this.groupId,
                    totalQuests: quests.length,
                    fixedQuests: quests.filter(q => q.type === 'fixed').length,
                    customQuests: quests.filter(q => q.type === 'custom').length,
                    hasDynamicPrerequisites: true,
                source: 'dynamic_generator',
                format: 'legacy_compatible'
            };
            
            return { ...legacyConfig, metadata };
            
        } catch (error) {
            console.error('❌ Error generating dynamic config:', error);
            throw error;
        }
    }

    async saveConfigToFile(config) {
        try {
            // Ensure output directory exists
            if (!fs.existsSync(this.outputDir)) {
                fs.mkdirSync(this.outputDir, { recursive: true });
            }
            
            // Write config to file
            fs.writeFileSync(this.outputPath, JSON.stringify(config, null, 2));
            
            // Also save a timestamped backup
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupPath = `${this.outputPath}.${timestamp}`;
            fs.writeFileSync(backupPath, JSON.stringify(config, null, 2));
            
            console.log(`Config saved to: ${this.outputPath}`);
            console.log(`Backup saved to: ${backupPath}`);
            
        } catch (error) {
            console.error('Error saving config to file:', error);
            throw error;
        }
    }
}

module.exports = DynamicQuestConfigGenerator; 