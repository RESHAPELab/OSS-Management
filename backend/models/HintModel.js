const mongoose = require("mongoose")

const HintSchema = mongoose.Schema({
    quest:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Quest"
    },
    task:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Task"
    },
    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Group"
    },
    professor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Professor"
    },
    temporaryID: {
        //example = "Q1T1"
        type: String
    },
    sequence:{
        type: Number,
        required: [true, "Please provide a sequence for the hint"]
    },
    penalty: {
        type: Number,
        default: 0
    },
    content: {
        type: String,
        required: [true, "Please provide content for the hint"]
    }
})

module.exports = mongoose.model("Hint", HintSchema)