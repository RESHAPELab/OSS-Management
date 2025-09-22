const mongoose = require("mongoose")

const UserStoredDataSchema = mongoose.Schema({
    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Group",
        required: true
    },
    githubUsername: {
        type: String,
        required: true,
        index: true
    },
    storedValues: {
        type: Map,
        of: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: true
})

UserStoredDataSchema.index({ group: 1, githubUsername: 1 }, { unique: true })

module.exports = mongoose.model("UserStoredData", UserStoredDataSchema) 