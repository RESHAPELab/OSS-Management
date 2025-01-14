const mongoose = require("mongoose")

const StudentSchema = mongoose.Schema({
    firstName: {
        type: String,
        required: [true, "Please enter your first name"]
    },
    lastName: {
        type: String,
        required: [true, "Please enter your last name"]
    },
    githubUsername: {
        type: String,
        required: [true, "Please enter your github username"]
    },
    studentEmail: {
        type: String,
        required: [true, "Please enter your student email"]
    },
    progress: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "StudentProgress"
    }]
})

module.exports = mongoose.model("Student", StudentSchema)