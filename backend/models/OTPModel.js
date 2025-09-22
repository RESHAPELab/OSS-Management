const mongoose = require("mongoose")

const otpSchema = new mongoose.Schema({ 
    email: { 
        type: String, 
        required: [true, "Must provide an email for OTP"]
    },
    code: { 
        type: String,
        required: [true, "Must provide a OTP code"]
    },
    createdAt: { 
        type: Date,
        default: Date.now,
        expires: 60 * 30
    }
})

module.exports = mongoose.model("OTP", otpSchema)