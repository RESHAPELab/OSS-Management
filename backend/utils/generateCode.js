const ProfessorCode = require("../models/ProfessorCode")
const dotenv = require("dotenv").config();
const mongoose = require("mongoose"); 
const {sendEmail} = require("./emailController");
const connectDB = require("../config/db");
connectDB(); 

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// HOW TO USE THIS SCRIPT
// this script will generate and send a unique code for any email you provide it with
// at the bottom of this code (line 59), you'll see the following: "run("Enter email you want to generate code for here")"
// uncomment that, and replace the text with the email you want to generate a code for
// run the script using 'node ./backend/utils/generateCode.js' in your terminal
// it should output the created code and you will see it stored mongoDB as well (under professorCodes!
// then, it will send an email to the one provided with their unique code 
// and prompt them to use it to register to our site!


function generateUniqueCode(email) {
    let hash = 0; 
    for (let i = 0; i < email.length; i++ ) {
        hash = (hash<<5) - hash + email.charCodeAt(i);
        hash &= hash; 
    }
    const randomFactor = Math.floor(Math.random() * 1000);
    const combined = Math.abs(hash + randomFactor); 
    const code = combined % 1000000;
    return code.toString().padStart(6, '0');
}

async function generateAndStoreCode(email) { 
    const uniqueCode = generateUniqueCode(email); 
    const codeExists = await ProfessorCode.findOne({email});
    if (codeExists) { 
        console.log(`A code was already made for ${email}: ${uniqueCode}`)
    }

    // set expiration time = 
    
    const newCode = new ProfessorCode({
        email, 
        uniqueCode,
        status: "unused"
    })

    await newCode.save();
    return uniqueCode; 
}


function run(email) { 
    generateAndStoreCode(email)
        .then((uniqueCode) => {
            console.log("Generated unique code:", uniqueCode);
            sendEmail(email, uniqueCode)
                .then(() => {
                    console.log(`Email sent to ${email} with code: ${uniqueCode}`);
                    process.exit();  
                })
                .catch((error) => {
                    console.error("Error sending email:", error);
                    process.exit(1);  
                }); 
        })
        .catch((error) => {
            console.error("Error generating code:", error);
            process.exit(1); 
        });
}

run("Enter email you want to generate code for here")


module.exports = {generateUniqueCode, generateAndStoreCode}