const mongoose = require("mongoose")

const GroupSchema = mongoose.Schema({
    groupName:{
        type: String,
        required: [true, "Group has no name"]
    },
    members:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student"
    }],
    admin:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student"
    }],
    professor:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Professor"
    },
    quests:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Quest"
    }],
    classCode: {
        type: String,
        required: true,
        unique: true
    },
    students: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student"
    }],
    active: { 
        type: Boolean,
        default: true
    },
    questOrder: [{
        questId: {
            type: String, // Can be "Q0", "Q1", etc. for fixed quests or ObjectId for custom quests
            required: true
        },
        questType: {
            type: String,
            enum: ['fixed', 'custom'],
            default: 'custom'
        },
        sequenceNumber: {
            type: Number,
            required: true
        },
        title: {
            type: String,
            required: true
        },
        isQ0: {
            type: Boolean,
            default: false
        },
        prerequisites: [{
            questId: {
                type: String,
                required: true
            },
            type: {
                type: String,
                enum: ['completion', 'score', 'custom'],
                default: 'completion'
            },
            required: {
                type: Boolean,
                default: true
            },
            description: {
                type: String,
                default: ''
            },
            minScore: {
                type: Number,
                default: 0
            }
        }]
    }],
    questOrderLastUpdated: {
        type: Date,
        default: Date.now
    },
    repositoryPattern: {
        type: String,
        default: 'cs-{classCode}-{username}',
        description: 'Pattern for generating repository names. Use {classCode} and {username} as placeholders.'
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
})

module.exports = mongoose.model("Group", GroupSchema)