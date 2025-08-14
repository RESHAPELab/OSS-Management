import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Default quest configuration
let questConfig = null;
let groupQuestConfigs = new Map();

/**
 * Get the quest configuration
 * @returns {Object} Quest configuration object
 */
export function getQuestConfig() {
    if (questConfig) {
        return questConfig;
    }
    
    try {
        const configPath = path.join(__dirname, 'quest_config.json');
        const configData = fs.readFileSync(configPath, 'utf8');
        questConfig = JSON.parse(configData);
        return questConfig;
    } catch (error) {
        console.error('Error loading quest config:', error);
        return {};
    }
}

/**
 * Get quest configuration for a specific group
 * @param {string} groupId - The group ID
 * @returns {Object} Group-specific quest configuration
 */
export function getGroupQuestConfig(groupId) {
    if (groupQuestConfigs.has(groupId)) {
        return groupQuestConfigs.get(groupId);
    }
    
    try {
        // For now, return the default quest config
        // In the future, this could load group-specific configurations
        const config = getQuestConfig();
        groupQuestConfigs.set(groupId, config);
        return config;
    } catch (error) {
        console.error(`Error loading quest config for group ${groupId}:`, error);
        return {};
    }
}

/**
 * Get quest sequence
 * @returns {Array} Quest sequence array
 */
export function getQuestSequence() {
    const config = getQuestConfig();
    return config.questSequence || [];
}

/**
 * Set quest configuration
 * @param {Object} config - New quest configuration
 */
export function setQuestConfig(config) {
    questConfig = config;
}

/**
 * Set group quest configuration
 * @param {string} groupId - The group ID
 * @param {Object} config - Group-specific quest configuration
 */
export function setGroupQuestConfig(groupId, config) {
    groupQuestConfigs.set(groupId, config);
}

/**
 * Clear all cached configurations
 */
export function clearConfigCache() {
    questConfig = null;
    groupQuestConfigs.clear();
} 