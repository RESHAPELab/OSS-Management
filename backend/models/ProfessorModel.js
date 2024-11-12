const mongoose = require("mongoose")

const ProfessorSchema = mongoose.Schema({
    email: { 
        type: String, 
        required: [true, "Professor needs an email"]
    },
    name: { 
        type: String,
        required: [true, "Professor needs a name"]
    },
    password: {
        type: String
    },
    verificationCode: {
        type: String
    },
    ownedGroups: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Group"
    }]
})

module.exports = mongoose.model("Professor", ProfessorSchema)