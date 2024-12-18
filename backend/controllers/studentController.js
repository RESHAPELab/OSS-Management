const Professor = require("../models/ProfessorModel");
const Group = require("../models/GroupModel");
const Student = require('../models/StudentModel')

const getStudents = async(req, res) => {
    const {groupID} = req.params; 
    try{
        const group = await Group.findById(groupID).populate('students')
        if (!group) { 
            return res.status(400).json({error: `Group with ID ${groupID} not found`})
        }
        const students = group.students

        return res.status(200).json({students})
    } catch(error) { 
        console.debug(`Error in addStudentToGroup function: ${error}`)
        return res.status(500).json({error})
    }
}

module.exports = {
    getStudents
}