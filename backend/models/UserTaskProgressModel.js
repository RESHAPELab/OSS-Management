const mongoose = require("moongose")

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
        type: Number,
        required: [true, "Please provide the number of hints already used"]
    }],
    status: {
        type: String
    },
    xp: {
        type: Number
    }
})

module.exports = mongoose.model("UserTaskProgress", UserTaskProgressSchema);