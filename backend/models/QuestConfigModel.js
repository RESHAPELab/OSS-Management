const mongoose = require('mongoose');

const QuestConfigSchema = new mongoose.Schema({
    // Unique identifier for the quest config (matches the filename pattern)
    configId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    
    // The actual quest configuration data
    config: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    
    // Metadata
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    },
    
    updatedAt: {
        type: Date,
        default: Date.now
    },
    
    // Optional: link to the group/class this config belongs to
    classId: {
        type: String,
        index: true
    },
    
    // Optional: user who created this config
    createdBy: {
        type: String
    },
    
    // File path for backward compatibility
    originalFilePath: {
        type: String
    },
    
    // Version for config updates
    version: {
        type: Number,
        default: 1
    }
}, {
    timestamps: true
});

// Index for efficient lookups
QuestConfigSchema.index({ configId: 1 });
QuestConfigSchema.index({ classId: 1, createdAt: -1 });

// Update the updatedAt field on save
QuestConfigSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

// Static method to find config by ID
QuestConfigSchema.statics.findByConfigId = function(configId) {
    return this.findOne({ configId });
};

// Static method to save or update config
QuestConfigSchema.statics.saveConfig = async function(configId, config, metadata = {}) {
    const updateData = {
        config,
        updatedAt: new Date(),
        ...metadata
    };
    
    const result = await this.findOneAndUpdate(
        { configId },
        { $set: updateData },
        { 
            upsert: true, 
            new: true,
            setDefaultsOnInsert: true 
        }
    );
    
    return result;
};

module.exports = mongoose.model('QuestConfig', QuestConfigSchema);
