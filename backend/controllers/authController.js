const Professor = require("../models/ProfessorModel")
const ProfessorCode = require("../models/ProfessorCode")
const bcrypt = require("bcrypt");
const generateTokenSetCookie = require("../utils/generateToken");

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// this script is responsible for verifying a given invitation code
// and creating account information for verified professors

// this function verifies a given invitation code by checking that it is 
// found in our database (under professorCodes)
const verifyCode = async(req, res) => {
    const {inviteCode} = req.body;
    if (!inviteCode) { 
        return res.status(400).send("No invite code provided")
    }
    try{ 
        const codeExists = await ProfessorCode.findOne({uniqueCode: inviteCode});
        if (!codeExists) {
            return res.status(400).send("Invalid invite code")
        }
        if (codeExists.status != "unused") {
            return res.status(400).send("This code has already been used")
        }

        codeExists.status = "used"; 
        await codeExists.save(); 
        return res.status(200).send("Code successfully verified"); 
    }catch(error){ 
        console.log("Error in verify code function", error);
        return res.status(500).send("Error verifying code")
    }
}

// this function allows a professor to create an acc with their email, name, and password
// it first checks that the email associated with the invite code is the same as the one they attempt to register with
// and then it hashes their password
// and then it saves their info to our database under professors
const signup = async (req, res) => { 
    const {inviteCode, email, name, password} = req.body; 
    try{ 
        if (!inviteCode || !email || !name  || !password) {
            return res.status(400).send("Please fill all fields")
        }

        const inviteCodeAssociatedEmail = await ProfessorCode.findOne({uniqueCode:inviteCode});

        if (inviteCodeAssociatedEmail.email !== email) { 
            return res.status(400).send("This email is not associated with this invite code!")
        }

        const profExists = await Professor.findOne({email});
        if (profExists) { 
            return res.status(400).send("Professor already exists")
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const professor = new Professor({
            verificationCode: inviteCode, email, name, password:hashedPassword
        })

        await professor.save();

        generateTokenSetCookie(professor._id, res);

        res.status(201).json({
            _id: professor.id,
            name: professor.name,
            email: professor.email
        })
    }catch(error) { 
        console.log(error); 
        res.status(400).send(error)
    }
}

module.exports = {signup, verifyCode}