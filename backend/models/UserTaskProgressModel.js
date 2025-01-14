const mongoose = require("mongoose")

const UserTaskProgressSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student"
    },
    task: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Task"
    },
    githubUrl: {
        type: String,
        required: [true, "Please provide the reference to Github issue"]
    },
    hintsUsed: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Hint"
    }],
    status: {
        type: String
    },
    xp: {
        type: Number
    }
})

module.exports = mongoose.model("UserTaskProgress", UserTaskProgressSchema);