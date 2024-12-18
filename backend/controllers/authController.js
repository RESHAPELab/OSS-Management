const Professor = require("../models/ProfessorModel")
const ProfessorCode = require("../models/ProfessorCodeModel")
const RecoveringPassword = require("../models/RecoveringPasswordModel")
const bcrypt = require("bcrypt");
const generateTokenSetCookie = require("../utils/generateToken");
const Student = require("../models/StudentModel")
const Group = require("../models/GroupModel");
const generateTokenSetCookie = require("../utils/generateToken");
const {generateAndSendCode} = require("../utils/generateCode")

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// this script is responsible for verifying a given invitation code
// and creating account information for verified professors

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

    } catch(error) { 
        console.debug(`Error in login function: ${error}`)
        return res.status(500).json({error})
    }
}

const logout = async (req, res) => {

}

const generatePasswordRecoveringCode = async (req, res) => {
    const {email} = req.body;
    const requiredFields = {email: "No email provided"};

    for (const [key, errorMessage] of Object.entries(requiredFields)) {
        if (!req.body[key]) {
            return res.status(400).send(errorMessage);
        }
    }

    try {
        const existingRecord = await RecoveringPassword.findOne({
            email,
            createdAt: { $gt: new Date(Date.now() - 30 * 60 * 1000) }, 
            status: "active",
        });

        const profExists = await Professor.findOne({email});
        
        if (!profExists) { 
            return res.status(400).send("Professor account doesn't exists")
        }

        if (existingRecord) {
            existingRecord.status = "expired";
            await existingRecord.save();
        }

        const newCode = await generateCode.generateAndSendCode(email);
        
        const newRecord = new RecoveringPassword({
            email,
            code: newCode,
            status: "active",
            totalTrials: 0,
        });

        await newRecord.save();

        console.debug(`New code generated for ${email}: ${newCode}`);
        return res.status(200).send("Recovering code has been generated and sent to your email");
    } 
    
    catch (error) {
        console.debug(`Error in recoverPassword function: ${error}`);
        return res.status(500).json({ error });
    }
}

const recoverPassword = async (req, res) => {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword ) {
        return res.status(400).send("Email, recovering code, and password are required");
    }

    try {
        const existingRecord = await RecoveringPassword.findOne({
            email,
            status: "active",
            createdAt: { $gt: new Date(Date.now() - 30 * 60 * 1000) }
        });

        if (!existingRecord) {
            return res.status(400).send("No active recovery request found for this email");
        }

        if (existingRecord.code !== code) {
            existingRecord.totalTrials += 1;

            if (existingRecord.totalTrials > 3) {
                existingRecord.status = "blocked";
                await existingRecord.save();
                return res.status(400).send("Too many failed attempts. The recovery code is now blocked.");
            }

            await existingRecord.save();
            return res.status(400).send("Invalid code. Please try again.");
        }

        const professor = await Professor.findOne({ email });
            
        if (!professor) {
            return res.status(404).send("Professor not found.");
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        professor.password = hashedPassword;
        existingRecord.status = "expired"; 

        await professor.save();
        await existingRecord.save();

        console.debug(`Password updated successfully for ${email}`);
        return res.status(200).send("Password has been successfully updated.");

    } catch (error) {
        console.debug(`Error in recoverPassword function: ${error}`);
        return res.status(500).json({ error: `An error occurred during the recovery process ${error}`});
    }
};

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

module.exports = {signup, login, generatePasswordRecoveringCode, recoverPassword, registerStudent, verifyEmail}
