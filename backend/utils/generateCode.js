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
    const code = combined % 1000000;
    const final_code = code.toString().padStart(6, '0');

    try {
        await sendEmail(email, final_code)
        //console.log(`Email sent to ${email} with code ${final_code}`)
    } catch(error) { 
        //console.debug(`Error in generateAndSendCode function: ${error}`)
        return res.status(500).json({error})
    }

    return final_code;
}

module.exports = {generateAndSendCode}