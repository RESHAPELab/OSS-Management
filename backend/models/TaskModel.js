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
    
    /*
    An answer can have a dynamic answer, like:
        - How many issues are open in repo X?
        - How many members does repo X have?
    
    For answering this, we are going to save a reference for a specific function
    like, "numberOfIssues". 
    
    Allowing professors to incentive students to discover other open source 
    projects, we can save the reference for a repo (link). Using this we can request 
    for the bot the metric in real time for any repo.

    So, we can support different cases. 

    1. Answers using different repos
    {
        answer: numberOfMembers,
        answerType: metric,
        answerRepoReference: https://github.com/meta-llama/llama3,
    }

    2. Answers for Quizzes
    {
        answer: [A, B, C, C, D],
        answerType: multipleAnswers,
        answersRepoReference: null,
    }

    3. Simple Answers
    {
        answer: 4,
        answerType: singleAnswer,
        answersRepoReference: null,
    }
    */

    answer: {
        type: String,
        required: [true, "Please provide an answer for the task"]
    },
    answerType: {
        type: String, // singleAnswer, multipleAnswers, metric
        required: [true, "Please provide the type of answer"]
    },
    answerRepoReference: {
        type: String,
    },
    prerequisite: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Task",
        default: null
    }],
})

module.exports = mongoose.model("Task", TaskSchema)
