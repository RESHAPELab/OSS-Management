const mongoose = require("mongoose")

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// this model describes how a generated code for a professor will look 
// once generated in the ./utils/generateCode.js file, 
// this code is emailed to invited professors
// and then they will be prompted to enter it on our site to register their account!

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