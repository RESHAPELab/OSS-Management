const fs = require('fs');
const path = require('path');
const axios = require('axios');
const QuestOrderGenerator = require('../utils/QuestOrderGenerator');

class DynamicQuestConfigGenerator {
    constructor(groupId, baseURL = 'http://localhost:8080') {
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
            // Fetch from MongoDB quests collection
            const response = await axios.get(`${this.baseURL}/api/quest/${questItem.questId}`);
            
            if (!response.data.success) {
                throw new Error(`Custom quest ${questItem.questId} not found`);
            }
            
            const customQuest = response.data.data;
            
            // Transform MongoDB format to config format
            return {
                id: questItem.questId,
                title: customQuest.questTitle,
                description: customQuest.description || '',
                type: 'custom',
                sequenceNumber: questItem.sequenceNumber,
                isQ0: questItem.isQ0,
                prerequisites: questItem.prerequisites || [],
                tasks: await this.transformCustomTasks(customQuest.tasks),
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

    async transformCustomTasks(mongoTasks) {
        if (!mongoTasks || !Array.isArray(mongoTasks)) {
            return [];
        }

        const transformedTasks = [];
        
        for (const taskRef of mongoTasks) {
            try {
                // Fetch individual task data
                const taskResponse = await axios.get(`${this.baseURL}/api/task/${taskRef}`);
                const task = taskResponse.data.data;
                
                transformedTasks.push({
                    id: task._id,
                    title: task.taskTitle,
                    description: task.desc,
                    objective: this.extractFieldFromResponse(task.responses?.accept, 'Objective'),
                    outcome: this.extractFieldFromResponse(task.responses?.accept, 'Outcome'),
                    helpText: this.extractFieldFromResponse(task.responses?.accept, 'Help'),
                    points: task.points,
                    xp: task.xp,
                    type: this.determineTaskType(task),
                    config: this.buildTaskConfig(task),
                    hints: task.hints || [],
                    responses: {
                        accept: task.responses?.accept,
                        error: task.responses?.error,
                        success: task.responses?.success
                    }
                });
            } catch (error) {
                console.error(`Error transforming task ${taskRef}:`, error);
            }
        }
        
        return transformedTasks;
    }

    determineTaskType(task) {
        if (task.answerType === 'singleAnswer' && task.answer && ['a', 'b', 'c', 'd'].includes(task.answer.toLowerCase())) {
            return 'multiple-choice';
        } else if (task.answerType === 'multipleAnswers') {
            return 'quiz';
        } else if (task.answerType === 'metric') {
            return 'github-api';
        } else {
            return 'text-input';
        }
    }

    buildTaskConfig(task) {
        const config = {};
        
        if (task.answerType === 'singleAnswer' && task.answer && ['a', 'b', 'c', 'd'].includes(task.answer.toLowerCase())) {
            // Parse options from the accept response
            const options = this.parseOptionsFromResponse(task.responses?.accept);
            
            config.correctAnswer = task.answer.toLowerCase();
            config.optionA = options[0] || '';
            config.optionB = options[1] || '';
            config.optionC = options[2] || '';
            config.optionD = options[3] || '';
            config.question = this.extractQuestionFromResponse(task.responses?.accept);
        } else if (task.answerType === 'metric') {
            config.apiCallType = task.apiCallType || 'issue-count';
            config.ossRepository = task.ossRepository || '';
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
            
            // Step 3: Create combined configuration
            const dynamicConfig = {
                metadata: {
                    generatedAt: new Date().toISOString(),
                    groupId: this.groupId,
                    totalQuests: quests.length,
                    fixedQuests: quests.filter(q => q.type === 'fixed').length,
                    customQuests: quests.filter(q => q.type === 'custom').length,
                    hasDynamicPrerequisites: true,
                    source: 'dynamic_generator'
                },
                quests: quests.sort((a, b) => a.sequenceNumber - b.sequenceNumber)
            };
            
            // Step 4: Save to file
            await this.saveConfigToFile(dynamicConfig);
            
            console.log(`✅ Dynamic config generated successfully: ${this.outputPath}`);
            return dynamicConfig;
            
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