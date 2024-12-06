const ProfessorCode = require("../models/ProfessorCodeModel")
const dotenv = require("dotenv").config();
const mongoose = require("mongoose"); 
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

    return final_code;
}

async function generateAndStoreCode(email) { 
    const uniqueCode = generateUniqueCode(email); 
    const codeExists = await ProfessorCode.findOne({email});
    if (codeExists) { 
        console.log(`A code was already made for ${email}: ${uniqueCode}`)
    }
    
    const newCode = new ProfessorCode({
        email, 
        uniqueCode,
        status: "unused"
    })

    await newCode.save();
    return uniqueCode; 
}


// function run(email) { 
//     generateAndStoreCode(email)
//         .then((uniqueCode) => {
//             console.log("Generated unique code:", uniqueCode);
//             sendEmail(email, uniqueCode)
//                 .then(() => {
//                     console.log(`Email sent to ${email} with code: ${uniqueCode}`);
//                     process.exit();  
//                 })
//                 .catch((error) => {
//                     console.error("Error sending email:", error);
//                     process.exit(1);  
//                 }); 
//         })
//         .catch((error) => {
//             console.error("Error generating code:", error);
//             process.exit(1); 
//         });
// }

// run("jlc2243@nau.edu")


module.exports = {generateAndSendCode, generateAndStoreCode}