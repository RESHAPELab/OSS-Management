const mongoose = require("mongoose");

const UserRepoSchema = mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student"
    },
    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Group"
    },
    repository_url: {
        type: String,
        required: [true, "Please provide a task title"]
    },
    org: {
        type: String,
        required: [true, "Please provide the organization in Github"]
    },
    
})

module.exports = mongoose.model("UserRepo", UserRepoSchema)