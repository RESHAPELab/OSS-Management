const mongoose = require("mongoose")

const RecoveringPasswordSchema = new mongoose.Schema({ 
    email: { 
        type: String, 
        required: [true, "Must provide an email"]
    },
    code: { 
        type: String,
        required: [true, "Must provide a code"]
    },
    createdAt: { 
        type: Date,
        default: Date.now,
        expires: 60 * 30
    },
    status: {
        type: String,
        default: "Active"
    },
    totalTrials: {
        type: Number,
        default: 0
    }
})

module.exports = mongoose.model("recoveringpassword", RecoveringPasswordSchema)