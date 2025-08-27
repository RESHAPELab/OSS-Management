const mongoose = require("mongoose");

const QuestConfigSchema = mongoose.Schema({
    groupId: {
        type: String,
        required: [true, "Please provide group ID"],
        unique: true
    },
    configData: {
        type: mongoose.Schema.Types.Mixed, // Can store JSON object or string
        required: [true, "Please provide config data"]
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt field before saving
QuestConfigSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model("QuestConfig", QuestConfigSchema);
