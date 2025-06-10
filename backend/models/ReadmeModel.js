const mongoose = require("mongoose");

const ReadmeSchema = mongoose.Schema({
    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Group"
    },
    content: {
        type: String,
        required: [true, "Please provide the file content"]
    },
    fileName: {
        type: String,
        default: "README.md"
    },
    dynamicContent: [{
        type: String
    }]
})

module.exports = mongoose.model("Readme", ReadmeSchema)