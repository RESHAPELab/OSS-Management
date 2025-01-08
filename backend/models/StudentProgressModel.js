const mongoose = require("mongoose");

const StudentProgressSchema = mongoose.Schema({
    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Group",
        required: true
    },
    xp: {
        type: Number,
        default: 0
    },
    points: {
        type: Number,
        default: 0
    },
    completion: {
        type: Number,  // Percentage (0-100) of completion
        default: 0
    },
    streakCount: {
        type: Number,
        default: 0
    },
    currentStreak: {
        type: Number,
        default: 0
    },
    completed:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: "QuestCompletion"
    }],
    accepted: QuestCompletionSchema,
    current: {
        quest: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Quest"
        },
        task:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Task"
        }
    }
});

export default mongoose.model("StudentProgress", StudentProgressSchema)