const mongoose = require("mongoose")

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// this model describes how a saved professor will look on the database!
// their unique code is generated in ./utils/generateCode.js
// and you can see a model for that in the ProfessorCode.js file

const ProfessorSchema = mongoose.Schema({
    email: { 
        type: String, 
        required: [true, "Please enter an email"]
    },
    name: { 
        type: String,
        required: [true, "Please enter a name"]
    },
    password: {
        type: String,
        required: [true, "Please enter a password"]
    },
    verificationCode: {
        type: String
    },
    ownedGroups: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Group"
    }],
    quests: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Quest"
    }],
    verified: { 
        type: Boolean,
        default: false
    }
})

module.exports = mongoose.model("Professor", ProfessorSchema)