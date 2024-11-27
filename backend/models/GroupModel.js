const mongoose = require("mongoose")

const GroupSchema = mongoose.Schema({
    groupName:{
        type: String,
        required: [true, "Group has no name"]
    },
    members:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student"
    }],
    admin:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student"
    }],
    professor:{
        //describes teacher/professor/organization/etc...
        type: mongoose.Schema.Types.ObjectId,
        ref: "GroupOrganizer"
    },
    quests:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Quest"
    }],
    uniqueCode: {
        type: String
    }
})

module.exports = mongoose.model("Group", GroupSchema)