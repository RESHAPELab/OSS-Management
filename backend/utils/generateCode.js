const ProfessorCode = require("../models/ProfessorCodeModel")
const dotenv = require("dotenv").config();
const {sendEmail} = require("./emailController");

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
        // Continue even if email fails, but surface error to caller
        throw error; // Let the calling function handle the error
    }

    // Upsert the code in the database (create or replace for this email)
    try {
        const ProfessorCode = require("../models/ProfessorCodeModel");
        await ProfessorCode.findOneAndUpdate(
            { email: email.toLowerCase() },
            { email: email.toLowerCase(), uniqueCode: final_code, status: 'unused' },
            { upsert: true, new: true }
        );
    } catch (dbError) {
        // If DB write fails, propagate; verification would fail later anyway
        throw dbError;
    }

    return final_code;
}

module.exports = {generateAndSendCode}