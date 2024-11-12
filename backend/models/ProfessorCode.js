const mongoose = require("mongoose")


const ProfessorCodeSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
    },
    uniqueCode: {
        type: String,
        required: true,
        unique: true,
    },
    status: {
        type: String,
        enum: ['unused', 'used', 'expired'],
        default: 'unused',
    },
    // expiration_time: {
    //     type: Date,
    //     required: true,
    // },
});

module.exports = mongoose.model("ProfessorCode", ProfessorCodeSchema)