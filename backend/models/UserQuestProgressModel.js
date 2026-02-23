const mongoose = require("mongoose")

const UserQuestProgressSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student"
    },
    quest: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Quest"
    },
    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Group"
    },
    status: {
        type: String
    }
})

module.exports = mongoose.model("UserQuestProgress", UserQuestProgressSchema);