const mongoose = require("mongoose")


const TaskSchema = mongoose.Schema({
    taskTitle: {
        type: String,
        required: [true, "Please provide a task title"]
    },
    quest: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Quest"
    },
    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Group"
    },
    professor: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: "Professor"
    },
    desc:{
        type: String,
        required: [true, "Please provide a description for the task"]
    },
    points:{
        type: Number,
        required: [true, "Please provide the number of points for this task"]
    },
    xp:{
        type: Number,
        required: [true, "Please provide the xp for this task"]
    },
    hints: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Hint"
    }],
    responses: {
        accept: {
            type: String,
            required: [true, "Response must include 'accept' case"]
        },
        error: {
            type: String,
            required: [true, "Response must include 'error' case"],
        },
        success: {
            type: String,
            required: [true, "Response must include 'success' case"]
        }
    },
    answer: {
        type: String,
        required: [true, "Please provide an answer for the task"]
    }
})

module.exports = mongoose.model("Task", TaskSchema)
