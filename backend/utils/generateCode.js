const ProfessorCode = require("../models/ProfessorCode")
const dotenv = require("dotenv").config();
const mongoose = require("mongoose")
const connectDB = require("../config/db");
connectDB(); 

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// HOW TO USE THIS SCRIPT
// this script will generate a unique code for any email you give it 
// at the bottom of this code (line 59), you'll see the following: "run("Enter email you want to generate code for here")"
// uncomment that, and replace the text with the email you want to generate a code for
// run the script using 'node ./backend/utils/generateCode.js' in your terminal
// it should output the created code and you will see it in mongoDB as well!


function generateUniqueCode(email) {
    let hash = 0; 
    for (let i = 0; i < email.length; i++ ) {
        hash = (hash<<5) - hash + email.charCodeAt(i);
        hash &= hash; 
    }
    const code = Math.abs(hash) % 1000000
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
    console.log(`Generated new code for ${email}: ${uniqueCode}`);
    return uniqueCode; 
}


function run(email) { 
    generateAndStoreCode(email)
        .then((uniqueCode) => {
            console.log("Generated unique code:", uniqueCode);
            process.exit();  // This ensures the script stops running after completion
        })
        .catch((error) => {
            console.error("Error generating code:", error);
            process.exit(1);  // Exit with error code if something fails
        });
}

// run("Enter email you want to generate code for here")






module.exports = {generateUniqueCode, generateAndStoreCode}