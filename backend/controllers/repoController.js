/*
Maybe one day we need to implement the creation of a repo
for different organizations. Now, I am not going to 
implement the logic. Time costs :(
*/
const UserRepo = require("../models/UserRepoModel");
const Readme = require("../models/ReadmeModel");
require("dotenv").config();


const axios = require('axios');
const { sendMessageToBot } = require('../utils/botMessage');
const { recoverPassword } = require("./authController");

const createRepo = async (req, res) => {
    const { organizationGh, studentId, studentGithubUsername, groupId, groupName } = req.body;

    console.log(req.body);
    // Format class name to match repository naming convention
    const formattedClassName = groupName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')  // Replace any non-alphanumeric chars with hyphens
        .replace(/^-+|-+$/g, '');     // Remove leading/trailing hyphens

    const repoName = `${formattedClassName}-${studentGithubUsername}`;
    const repoDescription = "Gamified Repository (OSS Management)";
    const privateRepo = true;
    const role = "push";
    const org = organizationGh;
    const username = studentGithubUsername;

    const responseCreateRepo = await sendMessageToBot(
        "github/createRepo", 
        { org, repoName, repoDescription, privateRepo },
    )
    console.log('response', responseCreateRepo);
    
    const repository_url = responseCreateRepo.data.name
    const group = groupId
    const student = studentId

    let userRepo = new UserRepo({ student, group, repository_url, org });
    await userRepo.save();

    const responseAddUserToRepo = await sendMessageToBot(
        "github/addUserToRepo",
        { org, repoName, username, role },
    );

    // Add README file if available for this group
    try {
        const readme = await Readme.findOne({ group: groupId });
        if (readme && readme.content) {
            await sendMessageToBot(
                "github/commitFile",
                {
                    org: organizationGh,
                    repoName,
                    filePath: "README.md",
                    fileContent: readme.content,
                    commitMessage: "Add initial README file",
                    branch: "main"
                }
            );
        }
    } catch (error) {
        console.error("Error adding README to repository:", error);
        // Don't fail the entire operation if README creation fails
    }
    
    res.status(201).json({message: "Repository created and user added successfully"});
}

const getProductionStatus = async (req, res) => { 
    console.log(process.env.NODE_ENV);
    if (process.env.NODE_ENV === 'production') {
        res.status(200).json({organizationGh: process.env.USER_AGENT_PROD});
    } else { 
       res.status(200).json({organizationGh: process.env.USER_AGENT_DEV});
   }
}

const createMultipleRepos = async (req, res) => {
    try {
        const { organizationGh, students, className } = req.body;
        
        if (!organizationGh || !students || !Array.isArray(students) || !className) {
            return res.status(400).json({ 
                message: "Invalid request. Required: organizationGh, students array, and className" 
            });
        }

        // Format class name to be URL-safe
        const formattedClassName = className
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')  // Replace any non-alphanumeric chars with hyphens
            .replace(/^-+|-+$/g, '');     // Remove leading/trailing hyphens

        // Get the README content for this class
        const readme = await Readme.findOne({ group: req.body.groupId });
        const readmeContent = readme ? readme.content : null;

        const results = {
            successful: [],
            unsuccessful: []
        };

        for (const username of students) {
            try {
                // Create repo for each student with class-name-username format
                const repoName = `${formattedClassName}-${username}`;
                const repoDescription = "Student Repository for OSS Management";
                const privateRepo = true;
                const role = "triage";

                // Create the repository
                const responseCreateRepo = await sendMessageToBot(
                    "github/createRepo", 
                    { org: organizationGh, repoName, repoDescription, privateRepo }
                );

                // Add user as collaborator
                await sendMessageToBot(
                    "github/addUserToRepo",
                    { org: organizationGh, repoName, username, role }
                );

                // Add README file if available
                if (readmeContent) {
                    await sendMessageToBot(
                        "github/commitFile",
                        {
                            org: organizationGh,
                            repoName,
                            filePath: "README.md",
                            fileContent: readmeContent,
                            commitMessage: "Add initial README file",
                            branch: "main"
                        }
                    );
                }

                // Create initial setup issue
                await sendMessageToBot(
                    "github/createIssue",
                    {
                        org: organizationGh,
                        repoName,
                        title: "New User Setup",
                        body: "Setting up new user repository."
                    }
                );

                results.successful.push(username);
            } catch (error) {
                console.error(`Error processing user ${username}:`, error);
                results.unsuccessful.push(username);
            }
        }

        res.status(200).json({
            message: "Repository creation process completed",
            results
        });
    } catch (error) {
        console.error("Error in createMultipleRepos:", error);
        res.status(500).json({ message: "Error creating repositories", error: error.message });
    }
};

const getRepoCollaborationStatus = async (req, res) => {
    try {
        const { organizationGh, students, className } = req.body;
        
        if (!organizationGh || !students || !Array.isArray(students) || !className) {
            return res.status(400).json({ 
                message: "Invalid request. Required: organizationGh, students array, and className" 
            });
        }

        // Format class name to match repository naming convention
        const formattedClassName = className
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')  // Replace any non-alphanumeric chars with hyphens
            .replace(/^-+|-+$/g, '');     // Remove leading/trailing hyphens

        const results = {
            accepted: [],
            pending: [],
            notFound: []
        };

        for (const username of students) {
            try {
                // Use the class-name-username format for the repository name
                const repoName = `${formattedClassName}-${username}`;
                const response = await sendMessageToBot(
                    "github/checkCollaboration",
                    { org: organizationGh, repoName, username }
                );

                if (response.data.status === 'accepted') {
                    results.accepted.push(username);
                } else if (response.data.status === 'pending') {
                    results.pending.push(username);
                } else {
                    results.notFound.push(username);
                }
            } catch (error) {
                console.error(`Error checking collaboration status for ${username}:`, error);
                results.notFound.push(username);
            }
        }

        res.status(200).json({
            message: "Collaboration status check completed",
            results
        });
    } catch (error) {
        console.error("Error in getRepoCollaborationStatus:", error);
        res.status(500).json({ message: "Error checking collaboration status", error: error.message });
    }
};

const listOrganizationRepos = async (req, res) => {
    try {
        const { organizationGh } = req.query;
        
        if (!organizationGh) {
            return res.status(400).json({ message: "Invalid request. Required: organizationGh" });
        }

        const response = await sendMessageToBot(
            "github/listRepos",
            { org: organizationGh }
        );

        res.status(200).json({
            message: "Repositories retrieved successfully",
            repos: response.data
        });
    } catch (error) {
        console.error("Error in listOrganizationRepos:", error);
        res.status(500).json({ message: "Error listing repositories", error: error.message });
    }
};

module.exports = {
    createRepo,
    getProductionStatus,
    createMultipleRepos,
    getRepoCollaborationStatus,
    listOrganizationRepos
}