const Professor = require("../models/ProfessorModel")
const ProfessorCode = require("../models/ProfessorCodeModel")
const RecoveringPassword = require("../models/RecoveringPasswordModel")
const bcrypt = require("bcrypt");
const generateTokenSetCookie = require("../utils/generateToken");
const Student = require("../models/StudentModel")
const Group = require("../models/GroupModel");
const {generateAndSendCode} = require("../utils/generateCode")

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// this script is responsible for verifying a given invitation code
// and creating account information for verified professors
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
    let {email, name, password, githubUsername} = req.body; 
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
        console.log(`[signup] Generated verification code for ${email.toLowerCase()}: ${verificationCode} (type: ${typeof verificationCode})`);

        let professor = new Professor({
            email: email.toLowerCase(), name, password:hashedPassword, verificationCode,
            githubUsername: githubUsername || undefined,
            isAdmin: githubUsername ? true : false
        })

        await professor.save();
        console.log(`[signup] Saved professor with email: ${professor.email}, verificationCode: ${professor.verificationCode} (type: ${typeof professor.verificationCode})`);

        generateTokenSetCookie(professor._id, res);

        res.status(201).json({
            _id: professor.id,
            name: professor.name,
            email: professor.email
        })

    } catch(error) { 
        console.debug(`Error in signup function: ${error}`)
        return res.status(500).json({error})
    }
}

const verifyEmail = async (req, res) => {
    const {verificationCode, email} = req.body;
    console.log(`[verifyEmail] Attempting verification for email: ${email}, code: ${verificationCode}`);
    
    try{ 
        // Ensure case-insensitive email lookup
        const professor = await Professor.findOne({email: email.toLowerCase()});
        if (!professor) { 
            console.log(`[verifyEmail] Professor not found for email: ${email}`);
            return res.status(400).json({error: "Invalid email"})
        }

        console.log(`[verifyEmail] Professor found. Stored code: ${professor.verificationCode}, Provided code: ${verificationCode}`);
        console.log(`[verifyEmail] Code types - Stored: ${typeof professor.verificationCode}, Provided: ${typeof verificationCode}`);

        // Convert both codes to strings for comparison
        if (professor.verificationCode.toString() === verificationCode.toString()) {
            professor.verified = true; 
            await professor.save();
            console.log(`[verifyEmail] Email successfully verified for: ${email}`);
        } else { 
            console.log(`[verifyEmail] Code mismatch for ${email}. Expected: ${professor.verificationCode}, Got: ${verificationCode}`);
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

    const emailNorm = String(email).toLowerCase();

    try {
        const existingRecord = await RecoveringPassword.findOne({
            email: emailNorm,
            createdAt: { $gt: new Date(Date.now() - 30 * 60 * 1000) }, 
            status: "active",
        });

        const profExists = await Professor.findOne({ email: emailNorm });
        
        if (!profExists) { 
            return res.status(400).send("Professor account doesn't exists")
        }

        if (existingRecord) {
            existingRecord.status = "expired";
            await existingRecord.save();
        }

        const newCode = await generateAndSendCode(emailNorm);
        
        const newRecord = new RecoveringPassword({
            email: emailNorm,
            code: newCode,
            status: "active",
            totalTrials: 0,
        });

        await newRecord.save();

        console.debug(`New code generated for ${emailNorm}: ${newCode}`);
        return res.status(200).send("Recovering code has been generated and sent to your email");
    } 
    
    catch (error) {
        console.error("Error in generatePasswordRecoveringCode:", error);
        return res.status(500).json({
            error: error?.message || "Failed to send recovery code",
        });
    }
}

const recoverPassword = async (req, res) => {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword ) {
        return res.status(400).send("Email, recovering code, and password are required");
    }

    const emailNorm = String(email).toLowerCase();

    try {
        const existingRecord = await RecoveringPassword.findOne({
            email: emailNorm,
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

        const professor = await Professor.findOne({ email: emailNorm });
            
        if (!professor) {
            return res.status(404).send("Professor not found.");
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

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

        if (group.students.length === 0 || !group.students.includes(student._id)) { 
            group.students.push(student._id) 
            await group.save()
        }

        return res.status(200).json(student) 

    } catch(error) { 
        console.debug(`Error in registerStudent function: ${error}`)
        return res.status(500).json({error})
    }
}

const debugProfessor = async (req, res) => {
    const { email } = req.query;
    console.log(`[debugProfessor] Looking up professor with email: ${email}`);
    
    try {
        // Try exact match first
        const exactMatch = await Professor.findOne({ email: email });
        console.log(`[debugProfessor] Exact match result:`, exactMatch ? 'FOUND' : 'NOT FOUND');
        
        // Try lowercase match
        const lowercaseMatch = await Professor.findOne({ email: email.toLowerCase() });
        console.log(`[debugProfessor] Lowercase match result:`, lowercaseMatch ? 'FOUND' : 'NOT FOUND');
        
        // Find all professors with similar emails
        const similarEmails = await Professor.find({ 
            email: { $regex: email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' }
        });
        
        const debugInfo = {
            searchEmail: email,
            searchEmailLower: email.toLowerCase(),
            exactMatch: exactMatch ? {
                _id: exactMatch._id,
                email: exactMatch.email,
                verificationCode: exactMatch.verificationCode,
                verified: exactMatch.verified
            } : null,
            lowercaseMatch: lowercaseMatch ? {
                _id: lowercaseMatch._id,
                email: lowercaseMatch.email,
                verificationCode: lowercaseMatch.verificationCode,
                verified: lowercaseMatch.verified
            } : null,
            similarEmails: similarEmails.map(prof => ({
                _id: prof._id,
                email: prof.email,
                verificationCode: prof.verificationCode,
                verified: prof.verified
            })),
            totalProfessors: await Professor.countDocuments()
        };
        
        console.log(`[debugProfessor] Debug info:`, JSON.stringify(debugInfo, null, 2));
        res.status(200).json(debugInfo);
        
    } catch (error) {
        console.error(`[debugProfessor] Error:`, error);
        res.status(500).json({ error: error.message });
    }
};

// Update professor GitHub usernames
const updateProfessorGitHubUsernames = async (req, res) => {
    const githubMappings = [
        { email: 'marco.gerosa@nau.edu', githubUsername: 'marcogerosa' },
        { email: 'seo@fake.com', githubUsername: 'misanetc' },
        { email: 'misanetchie17@gmail.com', githubUsername: 'misanetc' },
        { email: 'mpe45@nau.edu', githubUsername: 'misanetc' },
        { email: 'prm85@nau.edu', githubUsername: 'peterpalmer05' }
    ];

    try {
        console.log('📋 Updating professor GitHub usernames...');
        const results = [];
        
        for (const mapping of githubMappings) {
            console.log(`🔍 Looking for professor with email: ${mapping.email}`);
            
            const professor = await Professor.findOne({ email: mapping.email.toLowerCase() });
            
            if (professor) {
                console.log(`✅ Found professor: ${professor.name} (${professor.email})`);
                
                // Update the GitHub username
                professor.githubUsername = mapping.githubUsername;
                await professor.save();
                
                console.log(`✅ Updated GitHub username to: ${mapping.githubUsername}`);
                results.push({
                    email: mapping.email,
                    name: professor.name,
                    githubUsername: mapping.githubUsername,
                    status: 'updated'
                });
            } else {
                console.log(`❌ Professor not found with email: ${mapping.email}`);
                results.push({
                    email: mapping.email,
                    status: 'not_found'
                });
            }
        }

        console.log('📊 Final verification - All professors with GitHub usernames:');
        const allProfessors = await Professor.find({ githubUsername: { $exists: true, $ne: null } });
        allProfessors.forEach(prof => {
            console.log(`   - ${prof.name} (${prof.email}) → ${prof.githubUsername}`);
        });

        res.status(200).json({
            message: 'Update completed successfully!',
            results: results,
            professorsWithGithub: allProfessors.map(p => ({
                name: p.name,
                email: p.email,
                githubUsername: p.githubUsername
            }))
        });
        
    } catch (error) {
        console.error('❌ Error updating professor GitHub usernames:', error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {signup, verifyCode, login, generatePasswordRecoveringCode, recoverPassword, registerStudent, verifyEmail, debugProfessor, updateProfessorGitHubUsernames}
