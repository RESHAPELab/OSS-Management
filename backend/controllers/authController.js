const Professor = require("../models/ProfessorModel")
const Student = require("../models/StudentModel")
const Group = require("../models/GroupModel");
// const ProfessorCode = require("../models/ProfessorCodeModel")
const bcrypt = require("bcrypt");
const generateTokenSetCookie = require("../utils/generateToken");
const {generateAndSendCode} = require("../utils/generateCode")

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// this script is responsible for verifying a given invitation code
// and creating account information for verified professors

// this function verifies a given invitation code by checking that it is 
// found in our database (under professorCodes)
// const verifyCode = async(req, res) => {
//     const {inviteCode} = req.body;
//     if (!inviteCode) { 
//         return res.status(400).send("No invite code provided")
//     }
//     try{ 
//         const codeExists = await ProfessorCode.findOne({classCode: inviteCode});
//         if (!codeExists) {
//             return res.status(400).send("Invalid invite code")
//         }
//         if (codeExists.status != "unused") {
//             return res.status(400).send("This code has already been used")
//         }

//         codeExists.status = "used"; 
//         await codeExists.save(); 
//         return res.status(200).send("Code successfully verified"); 
//     }catch(error){ 
//         console.log("Error in verify code function", error);
//         return res.status(500).send("Error verifying code")
//     }
// }

// this function allows a professor to create an acc with their email, name, and password
// it first checks that the email associated with the invite code is the same as the one they attempt to register with
// and then it hashes their password
// and then it saves their info to our database under professors
const signup = async (req, res) => { 
    let {email, name, password} = req.body; 
    try{ 
        if (!email || !name  || !password) {
            return res.status(400).send("Please fill all fields")
        }

        const profExists = await Professor.findOne({email: email.toLowerCase()});
        if (profExists) { 
            return res.status(400).send("Professor already exists")
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        let verificationCode = await generateAndSendCode(email)

        let professor = new Professor({
            email, name, password:hashedPassword, verificationCode
        })

        await professor.save();
        console.log("created professor: ", professor)
        generateTokenSetCookie(professor._id, res);

        res.status(201).json({
            _id: professor.id,
            name: professor.name,
            email: professor.email
        })
    }catch(error) { 
        console.debug(`Error in signup function: ${error}`)
        return res.status(500).json({error})
    }
}

const verifyEmail = async (req, res) => {
    const {verificationCode, email} = req.body;
    try{ 
        const professor = await Professor.findOne({email})
        if (!professor) { 
            return res.status(400).json({error: "Invalid email"})
        }

        if (professor.verificationCode === verificationCode) {
            professor.verified = true; 
            await professor.save();
        } else { 
            return res.status(400).send("Professor email and code do not match")
        }
        return res.status(200).json(professor)
    } catch (error) { 
        console.debug(`Error in verifyEmail function: ${error}`)
        return res.status(500).json({error})
    }
}


const login = async (req, res) => { 
    let {email, password} = req.body; 
    try{ 
        email = email.toLowerCase(); 
        const prof = await Professor.findOne({ email });
        const passwordCorrect = await bcrypt.compare(password, prof?.password || "");
        
        if (!prof ) { 
            return res.status(400).json({error: "Invalid email"})
        }
        if (!passwordCorrect) {
            return res.status(400).json({error: "Invalid password"})
        }

        generateTokenSetCookie(prof._id, res); 

        res.status(200).json({
            _id: prof._id,
        })
    }catch(error) { 
        console.debug(`Error in login function: ${error}`)
        return res.status(500).json({error})
    }
}

const logout = async (req, res) => {

}

const registerStudent = async (req, res) => {
    const {firstName, lastName, githubUsername, studentEmail, classCode} = req.body
    console.log(firstName, lastName, githubUsername, studentEmail, classCode)
    try{
        if (!firstName || !lastName || !githubUsername || !studentEmail || !classCode) {
            return res.status(400).send("Please fill all fields")
        }

        let student = await Student.findOne({studentEmail})
        if (!student) { 
            student = new Student({
                firstName,
                lastName, 
                githubUsername,
                studentEmail,
                groups: []
            })

            await student.save(); 
            console.log('new student created', student)
        }

        const group = await Group.findOne({classCode})
        if (!group) { 
            return res.status(404).send(`Group not found with the code : ${classCode}`)
        }
        
        if(!student.groups.includes(group._id)) { 
            student.groups.push(group._id)
            await student.save() 
        }

        if (!group.students.includes(student._id)) { 
            group.students.push(student._id) 
            await group.save()
        }

        return res.status(200).json(student) 
    } catch(error) { 
        console.debug(`Error in registerStudent function: ${error}`)
        return res.status(500).json({error})
    }
}


module.exports = {signup, login, registerStudent, verifyEmail}