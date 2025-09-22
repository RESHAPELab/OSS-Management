const express = require('express');
const router = express.Router();
const DynamicQuestConfigGenerator = require('../services/DynamicQuestConfigGenerator');

// Generate dynamic quest configuration for a group
router.post('/generate/:groupId', async (req, res) => {
    try {
        const { groupId } = req.params;
        const baseURL = req.get('host') ? `https://${req.get('host')}` : 'https://oss-michael-production.up.railway.app';
        
        const generator = new DynamicQuestConfigGenerator(groupId, baseURL);
        const config = await generator.generateDynamicConfig();
        
        res.status(200).json({
            success: true,
            message: 'Dynamic quest configuration generated successfully',
            data: {
                configPath: generator.outputPath,
                questCount: config.quests.length,
                metadata: config.metadata,
                config: config
            }
        });
    } catch (error) {
        console.error('Error generating quest config:', error);
        res.status(500).json({
            success: false,
            message: 'Error generating quest configuration',
            error: error.message
        });
    }
});

// Get generated config for a group
router.get('/:groupId', async (req, res) => {
    try {
        const { groupId } = req.params;
        const baseURL = req.get('host') ? `https://${req.get('host')}` : 'https://oss-michael-production.up.railway.app';
        
        const generator = new DynamicQuestConfigGenerator(groupId, baseURL);
        const config = await generator.generateDynamicConfig();
        
        res.status(200).json({
            success: true,
            data: config
        });
    } catch (error) {
        console.error('Error fetching quest config:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching quest configuration',
            error: error.message
        });
    }
});

module.exports = router; 