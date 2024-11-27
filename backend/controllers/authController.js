const Professor = require("../models/ProfessorModel")
const ProfessorCode = require("../models/ProfessorCodeModel")
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
    let {email, name, password} = req.body; 
    try{ 
        if (!email || !name  || !password) {
            return res.status(400).send("Please fill all fields")
        }
        console.log(email, name, password)

        email = email.toLowerCase(); 

        const profExists = await Professor.findOne({email});
        if (profExists) { 
            return res.status(400).send("Professor already exists")
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const professor = new Professor({
            email, name, password:hashedPassword
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
    let {verificationCode} = req.body;
    try{ 

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

module.exports = {signup, verifyCode, login}