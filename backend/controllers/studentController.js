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
        console.debug(`Error in getStudents function: ${error}`)
        return res.status(500).json({error})
    }
}

const getStudent = async (req, res) => {
    const {studentID} = req.params;
    try{ 
        console.log
        const student = await Student.findById(studentID);
        if (!student) {
            return res.status(401).json({error: `No student with id ${studentID} found`})
        }

        console.log('######################################################################')
        console.log('student backend', student); 
        return res.status(200).json({
            _id: student._id,
            firstName: student.firstName,
            lastName: student.lastName,
            githubUsername: student.githubUsername,
            studentEmail: student.studentEmail,
            progress: student.progress
        })

    } catch (error) { 
        console.debug(`Error in getStudent function: ${error}`)
        return res.status(500).json({error})
    }
}

module.exports = {
    getStudents, getStudent
}

