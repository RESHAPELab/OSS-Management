const mongoose = require("mongoose")

const HintSchema = mongoose.Schema({
    task:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Task"
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