const mongoose = require("mongoose");

const QuestSchema = mongoose.Schema({
    questTitle: {
        type: String,
        required: [true, "Please provide quest name"]
    },
    group: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: "Group",
    },
    professor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Professor"
    },
    tasks: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Task"
    }],
    finalQuiz: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Quiz"
    },
    sequenceNumber: {
        type: Number
    }
})

module.exports = mongoose.model("Quest", QuestSchema)