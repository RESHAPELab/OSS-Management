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
    // this will be the way to go when student progress is synced with github
    // progress: [{
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: "StudentProgress"
    // }]
    // until then, this will be a temporary solution: 
    progress: [{
        type: mongoose.Schema.Types.Mixed
    }]
})

module.exports = mongoose.model("Student", StudentSchema)