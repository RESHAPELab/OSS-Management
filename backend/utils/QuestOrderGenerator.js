const fs = require('fs');
const path = require('path');

class QuestOrderGenerator {
    constructor(configPath = null) {
        this.configPath = configPath || path.join(__dirname, '../config/quest-sequence.json');
    }

    /**
     * Reads the quest sequence from JSON file
     * @returns {Object} Parsed JSON configuration
     */
    readQuestSequence() {
        try {
            if (!fs.existsSync(this.configPath)) {
                throw new Error(`Quest sequence config not found: ${this.configPath}`);
            }
            
            const configData = fs.readFileSync(this.configPath, 'utf8');
            return JSON.parse(configData);
        } catch (error) {
            console.error('Error reading quest sequence:', error);
            throw error;
        }
    }

    /**
     * Generates prerequisites for a quest based on its position in sequence
     * @param {Array} questSequence - Array of quests in order
     * @param {number} currentIndex - Index of current quest
     * @returns {Array} Array of prerequisite objects
     */
    generatePrerequisites(questSequence, currentIndex) {
        const prerequisites = [];
        
        // Q0 has no prerequisites
        if (currentIndex === 0) {
            return prerequisites;
        }
        
        // Get the previous quest as prerequisite
        const previousQuest = questSequence[currentIndex - 1];
        
        prerequisites.push({
            questId: previousQuest.questId,
            type: 'completion',
            required: true,
            description: `Complete ${previousQuest.title} first`,
            minScore: 0
        });
        
        return prerequisites;
    }

    /**
     * Transforms quest sequence into the format expected by DynamicQuestConfigGenerator
     * @param {Array} questSequence - Array of quests from JSON
     * @returns {Array} Formatted quest order with prerequisites
     */
    transformQuestSequence(questSequence) {
        return questSequence.map((quest, index) => {
            const prerequisites = this.generatePrerequisites(questSequence, index);
            
            return {
                questId: quest.questId,
                questType: quest.questType || 'fixed',
                sequenceNumber: index,
                title: quest.title,
                isQ0: quest.isQ0 || false,
                prerequisites: prerequisites
            };
        });
    }

    /**
     * Generates the complete quest order with prerequisites
     * @returns {Array} Complete quest order array
     */
    generateQuestOrder() {
        try {
            const config = this.readQuestSequence();
            const questSequence = config.questSequence;
            
            if (!Array.isArray(questSequence)) {
                throw new Error('Invalid quest sequence format');
            }
            
            const transformedOrder = this.transformQuestSequence(questSequence);
            
            console.log('✅ Quest order generated successfully');
            console.log(`📋 Generated ${transformedOrder.length} quests with prerequisites`);
            
            return transformedOrder;
        } catch (error) {
            console.error('❌ Error generating quest order:', error);
            throw error;
        }
    }

    /**
     * Validates the generated quest order
     * @param {Array} questOrder - Generated quest order
     * @returns {boolean} True if valid
     */
    validateQuestOrder(questOrder) {
        try {
            // Check if Q0 exists and is first
            if (questOrder[0].questId !== 'Q0' || !questOrder[0].isQ0) {
                throw new Error('Q0 must be the first quest and marked as isQ0: true');
            }
            
            // Check if all quests have proper prerequisites
            for (let i = 1; i < questOrder.length; i++) {
                const quest = questOrder[i];
                const previousQuest = questOrder[i - 1];
                
                if (quest.prerequisites.length === 0) {
                    throw new Error(`Quest ${quest.questId} should have prerequisites`);
                }
                
                if (quest.prerequisites[0].questId !== previousQuest.questId) {
                    throw new Error(`Quest ${quest.questId} should have ${previousQuest.questId} as prerequisite`);
                }
            }
            
            console.log('✅ Quest order validation passed');
            return true;
        } catch (error) {
            console.error('❌ Quest order validation failed:', error.message);
            return false;
        }
    }

    /**
     * Updates the JSON configuration file
     * @param {Array} newQuestSequence - New quest sequence array
     */
    updateQuestSequence(newQuestSequence) {
        try {
            const config = this.readQuestSequence();
            config.questSequence = newQuestSequence;
            config.metadata.lastUpdated = new Date().toISOString();
            
            fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
            console.log('✅ Quest sequence updated successfully');
        } catch (error) {
            console.error('❌ Error updating quest sequence:', error);
            throw error;
        }
    }

    /**
     * Generates JavaScript code for getDefaultQuestOrder()
     * @returns {string} JavaScript code string
     */
    generateJavaScriptCode() {
        const questOrder = this.generateQuestOrder();
        
        let code = '    getDefaultQuestOrder() {\n';
        code += '        return [\n';
        
        questOrder.forEach((quest, index) => {
            code += '            {\n';
            code += `                questId: '${quest.questId}',\n`;
            code += `                questType: '${quest.questType}',\n`;
            code += `                sequenceNumber: ${quest.sequenceNumber},\n`;
            code += `                title: '${quest.title}',\n`;
            code += `                isQ0: ${quest.isQ0},\n`;
            
            if (quest.prerequisites.length > 0) {
                code += '                prerequisites: [{\n';
                const prereq = quest.prerequisites[0];
                code += `                    questId: '${prereq.questId}',\n`;
                code += `                    type: '${prereq.type}',\n`;
                code += `                    required: ${prereq.required},\n`;
                code += `                    description: '${prereq.description}',\n`;
                code += `                    minScore: ${prereq.minScore}\n`;
                code += '                }]\n';
            } else {
                code += '                prerequisites: []\n';
            }
            
            code += '            }';
            if (index < questOrder.length - 1) {
                code += ',';
            }
            code += '\n';
        });
        
        code += '        ];\n';
        code += '    }\n';
        
        return code;
    }
}

module.exports = QuestOrderGenerator; 