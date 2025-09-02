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
        required: [false, "Please provide an answer for the task"],
        validate: {
            validator: function(value) {
                // Only require answer for MCQ and quiz types
                if (this.answerType === 'singleAnswer' || this.answerType === 'multipleAnswers') {
                    return value !== undefined && value !== null && value !== '';
                }
                // For metric and other types, answer can be empty
                return true;
            },
            message: "Please provide an answer for the task"
        }
    },
    answerType: {
        type: String, // singleAnswer, multipleAnswers, metric
        required: [true, "Please provide the type of answer"]
    },
    answerRepoReference: {
        type: String,
    },
    // Multiple choice question fields
    question: {
        type: String,
        required: false
    },
    correctAnswer: {
        type: String,
        required: false
    },
    options: [{
        label: {
            type: String,
            required: true
        },
        value: {
            type: String,
            required: true
        }
    }],
    // Custom API call fields
    apiEndpoint: {
        type: String,
    },
    responsePath: {
        type: String,
    },
    expectedAnswerType: {
        type: String,
        enum: ['Number', 'Text'],
        default: 'Number'
    },
    // Save validated data per user (for custom-api-call)
    saveValidatedData: {
        type: Boolean,
        default: false
    },
    savedDataName: {
        type: String,
        default: ''
    },
    // Tolerance fields for number answers
    enableTolerance: {
        type: Boolean,
        default: false
    },
    toleranceRange: {
        type: Number,
        default: 10,
        min: 0,
        max: 1000
    },
    repository: {
        type: String,
    },
    // LLM Text Validation fields
    llmTextValidation: {
        question: {
            type: String,
            required: function() { return this.type === 'llm-text-validation'; }
        },
        validationParameters: [{
            type: String,
            required: function() { return this.type === 'llm-text-validation'; }
        }],
        temperature: {
            type: Number,
            default: 0.1,
            min: 0,
            max: 1
        },
        enableDetailedFeedback: {
            type: Boolean,
            default: false,
            description: 'Whether to provide detailed feedback (0, 1) instead of just (0, 1)'
        }
    },
    prerequisite: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Task",
        default: null
    }],
})

module.exports = mongoose.model("Task", TaskSchema)
