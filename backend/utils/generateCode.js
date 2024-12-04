const ProfessorCode = require("../models/ProfessorCodeModel")
const dotenv = require("dotenv").config();
const {sendEmail} = require("./emailController");
const connectDB = require("../config/db");
connectDB(); 

async function generateAndSendCode (email) {
    let hash = 0; 
    for (let i = 0; i < email.length; i++ ) {
        hash = (hash<<5) - hash + email.charCodeAt(i);
        hash &= hash; 
    }
    const randomFactor = Math.floor(Math.random() * 1000);
    const combined = Math.abs(hash + randomFactor); 
    let code = combined % 1000000;
    code = code.toString().padStart(6, '0');

    try {
        await sendEmail(email, code)
        console.log(`Email sent to ${email} with code ${code}`)
    } catch(error) { 
        console.debug(`Error in generateAndSendCode function: ${error}`)
        return res.status(500).json({error})
    }

    return code;
}

module.exports = {generateAndSendCode}