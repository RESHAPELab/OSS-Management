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
const fs = require('fs');
const path = require('path');

function generateCustomQuestConfig(customSequence, groupId) {
  console.log('[DEBUG] [generateCustomQuestConfig] Incoming customSequence.questSequence:', JSON.stringify(customSequence.questSequence, null, 2));
  const config = {
    map_repo_link: "https://raw.githubusercontent.com/caiton1/OSS-Doorway/main/map"
  };
  // Convert quest sequence to quest config format
  customSequence.questSequence.forEach(quest => {
    const questId = quest.questId;
    let tasks = quest.tasks;
    // If tasks is nested under a 'tasks' key, flatten it
    if (tasks && tasks.tasks && typeof tasks.tasks === 'object') {
      tasks = tasks.tasks;
    }
    config[questId] = {
      metadata: quest.metadata,
      ...tasks // spread T1, T2, etc. at the top level
    };
    // Log the final config for this quest
    console.log(`[DEBUG] [generateCustomQuestConfig] Final config for questId=${questId}:`, JSON.stringify(config[questId], null, 2));
  });
  return config;
}

const createRepo = async (req, res) => {
    const { organizationGh, studentId, studentGithubUsername, groupId, groupName } = req.body;

    console.log(req.body);
    
    // Check if README exists for this group before proceeding
    let readme = await Readme.findOne({ group: groupId });
    let readmeContent = null;
    
    if (!readme || !readme.content) {
        // Create a default README if none exists
        console.log('📝 No README found, creating default README for class');
        const defaultReadmeContent = `# 🎓 ${groupName} - OSS Management Course

## 📚 Course Overview
Welcome to the Open Source Software (OSS) Management course! This repository will track your progress through various quests and challenges designed to teach you about contributing to open source projects.

## 🎯 Learning Objectives
- Understand the OSS contribution workflow
- Learn to work with Git and GitHub
- Practice creating pull requests and issues
- Develop collaboration skills in open source projects

## 📊 Your Progress
Your current progress will be displayed here as you complete quests.

### 🚀 Current Quest
{Current quest information will appear here}

### ✅ Completed Quests
{Completed quests will be listed here}

## 📋 Available Quests
{Quest list will be populated here}

## 🛠️ Getting Started
1. Accept the invitation to this repository
2. Check the issues tab for your first quest
3. Follow the instructions in each quest
4. Submit your answers as comments on the issues

## 📞 Need Help?
- Check the quest instructions carefully
- Use hints if available (they may cost XP)
- Ask questions in the issue comments

---
*This README is automatically updated as you progress through the course.*`;

        // Save the default README to the database
        readme = new Readme({
            group: groupId,
            content: defaultReadmeContent,
            fileName: 'README.md',
            contentLength: defaultReadmeContent.length
        });
        await readme.save();
        console.log('✅ Default README saved to database');
        
        readmeContent = defaultReadmeContent;
    } else {
        readmeContent = readme.content;
    }
    
    // Format class name to match repository naming convention
    const formattedClassName = groupName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')  // Replace any non-alphanumeric chars with hyphens
        .replace(/^-+|-+$/g, '');     // Remove leading/trailing hyphens

    const repoName = `${studentGithubUsername}-${formattedClassName}`;
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
    console.log('responseAddUserToRepo', responseAddUserToRepo);

    // Add README file if available
    if (readmeContent) {
            console.log(`📤 README DEPLOY: Sending README.md to bot server for ${org}/${repoName}`);
        console.log(`📄 README DEPLOY: Content length: ${readmeContent.length} characters`);
            
            await sendMessageToBot(
                "github/commitFile",
                {
                org: org,
                    repoName,
                    filePath: "README.md",
                fileContent: readmeContent,
                    commitMessage: "Add initial README file",
                    branch: "main"
                }
            );
            
            console.log(`✅ README DEPLOY: Successfully sent README.md to bot server for ${org}/${repoName}`);
        }
    
    res.status(200).json({
        message: "Repository created successfully",
        data: {
            repository_url: repository_url,
            student: student,
            group: group
        }
    });
};

const getProductionStatus = async (req, res) => { 
    console.log(process.env.NODE_ENV);
    if (process.env.NODE_ENV === 'production') {
        res.status(200).json({organizationGh: process.env.USER_AGENT_PROD});
    } else { 
       res.status(200).json({organizationGh: process.env.USER_AGENT_DEV});
   }
}

const createMultipleRepos = async (req, res) => {
    console.log('🚀 createMultipleRepos function called!');
    try {
        console.log('🔍 DEBUG: Received request body:', req.body);
        const { organizationGh, students, className, groupId } = req.body;
        
        console.log('🔍 DEBUG: Extracted data:', {
            organizationGh,
            students,
            className,
            groupId,
            studentsType: typeof students,
            isArray: Array.isArray(students)
        });
        
        if (!organizationGh || !students || !Array.isArray(students) || !className) {
            console.log('❌ DEBUG: Validation failed:', {
                hasOrg: !!organizationGh,
                hasStudents: !!students,
                isArray: Array.isArray(students),
                hasClassName: !!className
            });
            return res.status(400).json({ 
                message: "Invalid request. Required: organizationGh, students array, and className" 
            });
        }

        if (!groupId) {
            console.log('❌ DEBUG: Missing groupId');
            return res.status(400).json({ 
                message: "Invalid request. Required: groupId" 
            });
        }

        // Validate that groupId is a valid MongoDB ObjectId
        const mongoose = require('mongoose');
        if (!mongoose.Types.ObjectId.isValid(groupId)) {
            console.log('❌ DEBUG: Invalid groupId format:', groupId);
            return res.status(400).json({ 
                message: `Invalid groupId format: ${groupId}. Must be a valid MongoDB ObjectId.` 
            });
        }

        console.log('✅ DEBUG: Validation passed, proceeding with repository creation');

        // Check if README exists for this group before proceeding
        let readme = await Readme.findOne({ group: groupId });
        let readmeContent = null;
        
        if (!readme || !readme.content) {
            // Create a default README if none exists
            console.log('📝 No README found, creating default README for class');
            const defaultReadmeContent = `# 🎓 ${className} - OSS Management Course

## 📚 Course Overview
Welcome to the Open Source Software (OSS) Management course! This repository will track your progress through various quests and challenges designed to teach you about contributing to open source projects.

## 🎯 Learning Objectives
- Understand the OSS contribution workflow
- Learn to work with Git and GitHub
- Practice creating pull requests and issues
- Develop collaboration skills in open source projects

## 📊 Your Progress
Your current progress will be displayed here as you complete quests.

### 🚀 Current Quest
{Current quest information will appear here}

### ✅ Completed Quests
{Completed quests will be listed here}

## 📋 Available Quests
{Quest list will be populated here}

## 🛠️ Getting Started
1. Accept the invitation to this repository
2. Check the issues tab for your first quest
3. Follow the instructions in each quest
4. Submit your answers as comments on the issues

## 📞 Need Help?
- Check the quest instructions carefully
- Use hints if available (they may cost XP)
- Ask questions in the issue comments

---
*This README is automatically updated as you progress through the course.*`;

            // Save the default README to the database
            readme = new Readme({
                group: groupId,
                content: defaultReadmeContent,
                fileName: 'README.md',
                contentLength: defaultReadmeContent.length
            });
            await readme.save();
            console.log('✅ Default README saved to database');
            
            readmeContent = defaultReadmeContent;
        } else {
            readmeContent = readme.content;
        }

        // Format class name to be URL-safe
        const formattedClassName = className
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')  // Replace any non-alphanumeric chars with hyphens
            .replace(/^-+|-+$/g, '');     // Remove leading/trailing hyphens

        console.log('🔍 DEBUG: Formatted class name:', formattedClassName);

        // 🎯 NEW: Use GitHub App Auth directly instead of bot server
        console.log('🎯 USING GITHUB APP AUTH DIRECTLY');
        
        // Import GitHub App authentication
        let githubToken;
        try {
            // Use dynamic import for GitHub App authentication
            const { getGithubAppInstallationAccessToken } = await import('../../../bot/controllers/githubAppAuth');
            
            // Get GitHub access token
            console.log('🔑 Getting GitHub App installation access token...');
            githubToken = await getGithubAppInstallationAccessToken();
            console.log('✅ GitHub access token obtained');
            console.log('🔑 Token preview:', githubToken ? `${githubToken.substring(0, 10)}...` : 'null');
        } catch (authError) {
            console.error('❌ GitHub App authentication failed:', authError.message);
            console.error('❌ Auth error stack:', authError.stack);
            console.log('🔄 Falling back to bot server method...');
            
            // Test bot server connectivity first
            try {
                console.log('🔍 Testing bot server connectivity...');
                const testResponse = await sendMessageToBot("github/listRepos", { org: organizationGh });
                console.log('✅ Bot server is accessible');
            } catch (botError) {
                console.error('❌ Bot server is not accessible:', botError.message);
                
                // Final fallback: Try with personal access token if available
                const personalToken = process.env.GITHUB_PERSONAL_TOKEN;
                if (personalToken) {
                    console.log('🔄 Trying final fallback with personal access token...');

        const results = {
            successful: [],
            unsuccessful: []
        };

        for (const username of students) {
            try {
                            console.log(`🎯 Processing student with personal token: ${username}`);
                            
                const repoName = `${username}-${formattedClassName}`;
                            
                            // Create repository
                            await axios.post(
                                `https://api.github.com/orgs/${organizationGh}/repos`,
                                {
                                    name: repoName,
                                    description: "Student Repository for OSS Management",
                                    private: true,
                                    auto_init: true
                                },
                                {
                                    headers: {
                                        Authorization: `token ${personalToken}`,
                                        Accept: 'application/vnd.github.v3+json',
                                    }
                                }
                );

                // Add user as collaborator
                            await axios.put(
                                `https://api.github.com/repos/${organizationGh}/${repoName}/collaborators/${username}`,
                                { permission: "triage" },
                                {
                                    headers: {
                                        Authorization: `token ${personalToken}`,
                                        Accept: 'application/vnd.github.v3+json',
                                    }
                                }
                            );
                            
                            results.successful.push(username);
                            console.log(`✅ Personal token created repository for ${username}`);
                            
                        } catch (error) {
                            console.error(`❌ Error processing ${username} with personal token:`, error);
                            results.unsuccessful.push(username);
                        }
                    }
                    
                    return res.status(200).json({
                        message: "Repository creation completed via personal access token",
                        results
                    });
                }
                
                return res.status(500).json({
                    message: "All repository creation methods are unavailable",
                    error: "GitHub App auth failed, bot server is not accessible, and no personal token available",
                    details: {
                        githubAuthError: authError.message,
                        botServerError: botError.message
                    }
                });
            }
            
            // Fallback: Use bot server method
            const results = {
                successful: [],
                unsuccessful: []
            };
            
            for (const username of students) {
                try {
                    console.log(`🎯 Processing student via bot server: ${username}`);
                    
                    // Send request to bot server
                    const botResponse = await sendMessageToBot(
                        "gamification/createRepos",
                        {
                            org: organizationGh,
                            users: [username],
                            groupId: groupId,
                            className: className
                        }
                    );
                    
                    console.log(`🎯 Bot server response for ${username}:`, botResponse);
                    
                    // Check if bot server response indicates success
                    if (botResponse && botResponse.data && botResponse.data.success) {
                        results.successful.push(username);
                        console.log(`✅ Bot server created repository for ${username}`);
                    } else if (botResponse && botResponse.data && botResponse.data.results) {
                        // Check if the user is in successful results
                        const userResults = botResponse.data.results;
                        if (userResults.successful && userResults.successful.includes(username)) {
                            results.successful.push(username);
                            console.log(`✅ Bot server created repository for ${username}`);
                        } else {
                            results.unsuccessful.push(username);
                            console.log(`❌ Bot server failed for ${username}`);
                        }
                    } else {
                        // If we can't determine success, assume it worked (since we got a response)
                        results.successful.push(username);
                        console.log(`✅ Assuming success for ${username} (got bot response)`);
                    }
                } catch (error) {
                    console.error(`❌ Error processing ${username} via bot server:`, error);
                    results.unsuccessful.push(username);
                }
            }
            
            console.log('✅ Bot server repository creation completed:', results);
            
            return res.status(200).json({
                message: "Repository creation completed via bot server",
                results
            });
        }

        const results = {
            successful: [],
            unsuccessful: []
        };

        // Process each student
        for (const username of students) {
            try {
                console.log(`🎯 Processing student: ${username}`);
                
                // Create repository name using new username-classname pattern
                const repoName = `${username}-${formattedClassName}`;
                console.log(`🎯 Creating repository: ${organizationGh}/${repoName}`);
                
                // Step 1: Create the repository
                console.log(`🎯 Step 1 - Creating repository ${organizationGh}/${repoName}`);
                const createRepoResponse = await axios.post(
                    `https://api.github.com/orgs/${organizationGh}/repos`,
                    {
                        name: repoName,
                        description: "Student Repository for OSS Management",
                        private: true,
                        auto_init: true
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${githubToken}`,
                            Accept: 'application/vnd.github.v3+json',
                        }
                    }
                );
                console.log(`✅ Repository created: ${organizationGh}/${repoName}`);

                // Step 2: Add user as collaborator
                console.log(`🎯 Step 2 - Adding ${username} as collaborator`);
                await axios.put(
                    `https://api.github.com/repos/${organizationGh}/${repoName}/collaborators/${username}`,
                    { permission: "triage" },
                    {
                        headers: {
                            Authorization: `Bearer ${githubToken}`,
                            Accept: 'application/vnd.github.v3+json',
                        }
                    }
                );
                console.log(`✅ Collaborator added: ${username} to ${organizationGh}/${repoName}`);

                // Step 3: Add README file
                console.log(`🎯 Step 3 - Adding README file`);
                await axios.put(
                    `https://api.github.com/repos/${organizationGh}/${repoName}/contents/README.md`,
                    {
                        message: "Add initial README file",
                        content: Buffer.from(readmeContent).toString('base64'),
                            branch: "main"
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${githubToken}`,
                            Accept: 'application/vnd.github.v3+json',
                        }
                    }
                );
                console.log(`✅ README file added to ${organizationGh}/${repoName}`);

                // Step 4: Create quest issues (Q0, Q4, Q5, Q1, Q2, Q3)
                console.log(`🎯 Step 4 - Creating quest issues for ${username}`);
                
                // Create quest issues
                const questIssues = [
                    {
                        title: "Q0: Environment Setup and Configuration",
                        body: `# 🎯 Quest 0: Environment Setup and Configuration

Welcome to your OSS journey! This quest will help you set up your environment and understand the basics.

## Tasks:
- Configure your development environment
- Set up GitHub account and preferences
- Understand the quest system

Complete each task to progress through your OSS adventure!`
                    },
                    {
                        title: "Q4: Advanced GitHub Concepts",
                        body: `# 🎯 Quest 4: Advanced GitHub Concepts

In this quest, you'll learn advanced GitHub workflows and collaboration patterns.

## Tasks:
- Understand Git rebase and advanced concepts
- Master GitHub collaboration techniques
- Complete MCQ assessments

This quest builds on your foundational knowledge!`
                    },
                        {
                        title: "Q5: Repository Analytics",
                        body: `# 🎯 Quest 5: Repository Analytics

In this quest, you'll learn to analyze repository statistics and understand project activity.

## Tasks:
- Count open issues in repositories
- Understand repository activity metrics
- Analyze project health indicators

Learn to assess repository activity and project health!`
                    },
                    {
                        title: "Q1: Understanding OSS Projects and GitHub Basics",
                        body: `# 🎯 Quest 1: Understanding OSS Projects and GitHub Basics

In this quest, you'll learn about open source projects and GitHub fundamentals.

## Tasks:
- Explore GitHub repositories
- Understand issue tracking
- Learn about pull requests
- Discover project documentation

This quest covers the essential basics of OSS collaboration!`
                    },
                    {
                        title: "Q2: Forking and Contributing to Repositories",
                        body: `# 🎯 Quest 2: Forking and Contributing to Repositories

This quest covers the essential skills of forking repositories and making contributions.

## Tasks:
- Fork repositories
- Create branches
- Make meaningful contributions
- Understand contribution guidelines

Learn the practical skills of OSS contribution!`
                    },
                    {
                        title: "Q3: Creating Pull Requests and Code Reviews",
                        body: `# 🎯 Quest 3: Creating Pull Requests and Code Reviews

In this final quest, you'll learn about pull requests and the code review process.

## Tasks:
- Create effective pull requests
- Participate in code reviews
- Understand merge strategies
- Contribute to project discussions

Master the art of collaborative development!`
                    }
                ];

                // Create each quest issue
                for (const quest of questIssues) {
                    console.log(`🎯 Creating quest: ${quest.title}`);
                    
                    await axios.post(
                        `https://api.github.com/repos/${organizationGh}/${repoName}/issues`,
                        {
                            title: quest.title,
                            body: quest.body,
                            labels: ["quest"]
                        },
                        {
                            headers: {
                                Authorization: `Bearer ${githubToken}`,
                                Accept: 'application/vnd.github.v3+json',
                            }
                        }
                    );
                    
                    console.log(`✅ Quest created: ${quest.title}`);
                }

                // Step 5: Create setup issue and trigger quest system
                console.log(`🎯 Step 5 - Creating setup issue and triggering quest system`);
                
                // Create setup issue
                const setupIssueResponse = await axios.post(
                    `https://api.github.com/repos/${organizationGh}/${repoName}/issues`,
                    {
                        title: "New User Setup",
                        body: "Setting up new user repository with quest system.",
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${githubToken}`,
                            Accept: 'application/vnd.github.v3+json',
                        }
                    }
                );

                // Add /new_user comment to trigger quest system
                await axios.post(
                    `https://api.github.com/repos/${organizationGh}/${repoName}/issues/${setupIssueResponse.data.number}/comments`,
                    {
                        body: `/new_user ${username}`,
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${githubToken}`,
                            Accept: 'application/vnd.github.v3+json',
                        }
                    }
                );

                // Close the setup issue to trigger the quest system
                await axios.patch(
                    `https://api.github.com/repos/${organizationGh}/${repoName}/issues/${setupIssueResponse.data.number}`,
                    {
                        state: "closed",
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${githubToken}`,
                            Accept: 'application/vnd.github.v3+json',
                        }
                    }
                );

                console.log(`✅ Quest system triggered for ${username}`);
                results.successful.push(username);
                
            } catch (error) {
                console.error(`❌ Error processing user ${username}:`, error);
                if (error.response) {
                    console.error('Response status:', error.response.status);
                    console.error('Response data:', error.response.data);
                }
                results.unsuccessful.push(username);
            }
        }

        console.log('✅ Repository creation process completed:', results);

        res.status(200).json({
            message: "Repository creation process completed with full quest system (using GitHub App Auth directly)",
            results
        });
    } catch (error) {
        console.error("❌ DEBUG: Error in createMultipleRepos:", error);
        console.error("❌ DEBUG: Error message:", error.message);
        console.error("❌ DEBUG: Error stack:", error.stack);
        
        // Check if it's a GitHub API error
        if (error.response) {
            console.error("❌ DEBUG: GitHub API Error Status:", error.response.status);
            console.error("❌ DEBUG: GitHub API Error Data:", error.response.data);
        }
        
        res.status(500).json({ 
            message: "Error creating repositories", 
            error: error.message,
            details: error.response?.data || "No additional details available"
        });
    }
};

const getRepoCollaborationStatus = async (req, res) => {
    try {
        const { organizationGh, students, className } = req.body;
        
        console.log('🔍 [DEBUG] getRepoCollaborationStatus called with:', {
            organizationGh,
            students,
            className
        });
        
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

        console.log('🏷️ [DEBUG] formattedClassName:', formattedClassName);

        const results = {
            accepted: [],
            pending: [],
            notFound: []
        };

        for (const username of students) {
            try {
                // Use the username-classname format for the repository name (matches new repo creation format)
                const repoName = `${username}-${formattedClassName}`;
                console.log(`🔍 [DEBUG] Checking collaboration for repo: ${repoName}, user: ${username}`);
                
                const response = await sendMessageToBot(
                    "github/checkCollaboration",
                    { org: organizationGh, repoName, username }
                );

                console.log(`📊 [DEBUG] Bot response for ${username}:`, response.data);

                if (response.data.status === 'accepted') {
                    results.accepted.push(username);
                } else if (response.data.status === 'pending') {
                    results.pending.push(username);
                } else {
                    results.notFound.push(username);
                }
            } catch (error) {
                console.error(`❌ [DEBUG] Error checking collaboration status for ${username}:`, error.message);
                results.notFound.push(username);
            }
        }

        console.log('📊 [DEBUG] Final collaboration results:', results);

        res.status(200).json({
            message: "Collaboration status check completed",
            results
        });
    } catch (error) {
        console.error("❌ [DEBUG] Error in getRepoCollaborationStatus:", error);
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

const checkRepoReadme = async (req, res) => {
    try {
        const { organizationGh, repoName } = req.query;
        
        if (!organizationGh || !repoName) {
            return res.status(400).json({ 
                message: "Missing required parameters: organizationGh and repoName" 
            });
        }

        // Try to get GitHub access token
        let githubToken;
        try {
            // Use dynamic import for GitHub App authentication
            const { getGithubAppInstallationAccessToken } = await import('../../../bot/controllers/githubAppAuth');
            
            // Get GitHub access token
            console.log('🔑 Getting GitHub App installation access token...');
            githubToken = await getGithubAppInstallationAccessToken();
            console.log('✅ GitHub token obtained for debug');
        } catch (error) {
            console.log('❌ GitHub token failed:', error.message);
            return res.status(500).json({ 
                message: "GitHub authentication failed", 
                error: error.message 
            });
        }

        // Test repository access
        const response = await axios.get(
            `https://api.github.com/repos/${organizationGh}/${repoName}`,
            {
                headers: {
                    Authorization: `Bearer ${githubToken}`,
                    Accept: 'application/vnd.github.v3+json',
                }
            }
        );

        res.status(200).json({
            message: "Repository access successful",
            repo: response.data
        });
    } catch (error) {
        console.error("❌ Debug repository check failed:", error);
        res.status(500).json({ 
            message: "Repository check failed", 
            error: error.message,
            details: error.response?.data || "No additional details"
        });
    }
};

const getStudentScores = async (req, res) => {
    try {
        const { className, students } = req.body;
        
        console.log('🔍 [DEBUG] getStudentScores called with:', {
            className,
            students: students?.length || 0
        });
        
        if (!className || !students || !Array.isArray(students)) {
            return res.status(400).json({ 
                message: "Invalid request. Required: className and students array" 
            });
        }

        // Format class name to match repository naming convention
        const formattedClassName = className
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')  // Replace any non-alphanumeric chars with hyphens
            .replace(/^-+|-+$/g, '');     // Remove leading/trailing hyphens

        const results = {};

        // Connect to OSS-Doorway database to fetch scores
        const mongoose = require('mongoose');
        const ossDoorwayURI = process.env.OSS_DOORWAY_DB_URI;
        const ossDoorwayDBName = process.env.OSS_DOORWAY_DB_NAME;
        
        console.log(`🔗 [getStudentScores] Connecting to OSS-Doorway DB: ${ossDoorwayDBName}`);
        
        const ossDoorwayConnection = mongoose.createConnection(`${ossDoorwayURI}/${ossDoorwayDBName}`);
        
        // Define user schema
        const userSchema = new mongoose.Schema({
            _id: String,
            user_data: {
                github: String,
                username: String,
                points: Number,
                xp: Number,
                completion: Number,
                streakCount: Number,
                currentStreak: Number,
                completed: Object,
                accepted: Object,
                current: Object
            }
        }, { collection: 'user_data' });
        
        const User = ossDoorwayConnection.model('User', userSchema);

        // FIRST: List all users in the database for debugging
        console.log('🔍 [DEBUG] Listing all users in OSS-Doorway database...');
        const allUsers = await User.find({}).limit(20);
        console.log('📊 [DEBUG] Found users in database:');
        allUsers.forEach(user => {
            console.log(`   - ID: ${user._id}, GitHub: ${user.user_data?.github || 'N/A'}, Points: ${user.user_data?.points || 0}`);
        });

        for (const student of students) {
            try {
                // Create the database username using the same format as repository creation
                const dbUsername = `${student}-${formattedClassName}`;
                console.log(`🔍 [getStudentScores] Looking for user: ${dbUsername}`);
                
                const userDoc = await User.findOne({ _id: dbUsername });
                
                if (userDoc && userDoc.user_data) {
                    results[student] = {
                        points: userDoc.user_data.points || 0,
                        xp: userDoc.user_data.xp || 0,
                        completion: userDoc.user_data.completion || 0,
                        streakCount: userDoc.user_data.streakCount || 0,
                        currentStreak: userDoc.user_data.currentStreak || 0,
                        currentQuest: userDoc.user_data.current?.quest || null,
                        currentTask: userDoc.user_data.current?.task || null
                    };
                    console.log(`✅ [getStudentScores] Found data for ${student}:`, results[student]);
                } else {
                    // Try alternative search patterns
                    console.log(`⚠️ [getStudentScores] User not found with pattern: ${dbUsername}`);
                    console.log(`🔍 [getStudentScores] Trying alternative patterns...`);
                    
                    // Try searching by GitHub username directly
                    const userByGithub = await User.findOne({ 
                        $or: [
                            { '_id': student },
                            { 'user_data.github': student },
                            { '_id': new RegExp(student, 'i') }
                        ]
                    });
                    
                    if (userByGithub && userByGithub.user_data) {
                        console.log(`✅ [getStudentScores] Found user by alternative search: ${userByGithub._id}`);
                        results[student] = {
                            points: userByGithub.user_data.points || 0,
                            xp: userByGithub.user_data.xp || 0,
                            completion: userByGithub.user_data.completion || 0,
                            streakCount: userByGithub.user_data.streakCount || 0,
                            currentStreak: userByGithub.user_data.currentStreak || 0,
                            currentQuest: userByGithub.user_data.current?.quest || null,
                            currentTask: userByGithub.user_data.current?.task || null,
                            foundBy: `Alternative search: ${userByGithub._id}`
                        };
                    } else {
                        results[student] = {
                            points: 0,
                            xp: 0,
                            completion: 0,
                            streakCount: 0,
                            currentStreak: 0,
                            currentQuest: null,
                            currentTask: null,
                            searchedFor: dbUsername,
                            alternativeSearched: true
                        };
                        console.log(`⚠️ [getStudentScores] No data found for ${student} with any pattern`);
                    }
                }
            } catch (error) {
                console.error(`❌ [getStudentScores] Error fetching data for ${student}:`, error.message);
                results[student] = {
                    points: 0,
                    xp: 0,
                    completion: 0,
                    streakCount: 0,
                    currentStreak: 0,
                    currentQuest: null,
                    currentTask: null,
                    error: error.message
                };
            }
        }

        await ossDoorwayConnection.close();
        console.log(`🔌 [getStudentScores] Disconnected from OSS-Doorway database`);

        console.log('📊 [DEBUG] Final student scores:', results);

        res.status(200).json({
            message: "Student scores fetched successfully",
            scores: results,
            debug: {
                formattedClassName,
                totalUsersInDB: allUsers.length,
                searchPattern: `{student}-${formattedClassName}`
            }
        });
    } catch (error) {
        console.error("❌ [DEBUG] Error in getStudentScores:", error);
        res.status(500).json({ 
            message: "Error fetching student scores", 
            error: error.message 
        });
    }
};

const createCustomRepos = async (req, res) => {
  try {
    console.log('[DEBUG] [createCustomRepos] Incoming POST body:', JSON.stringify(req.body, null, 2));
    if (req.body.customSequence) {
      console.log('[DEBUG] [createCustomRepos] Incoming customSequence:', JSON.stringify(req.body.customSequence, null, 2));
    } else if (req.body.sequenceFile) {
      console.log('[DEBUG] [createCustomRepos] Incoming sequenceFile:', req.body.sequenceFile);
    }

    const { users, sequenceFile, customSequence, className, classId } = req.body;

    // 🔧 NEW: Add README handling for class-based repository creation
    let readmeContent = null;
    if (classId && className) {
      console.log(`📝 [createCustomRepos] Starting README check for class: ${className} (ID: ${classId})`);
      console.log(`📝 [createCustomRepos] classId type: ${typeof classId}, length: ${classId ? classId.length : 'null'}`);
      console.log(`📝 [createCustomRepos] className type: ${typeof className}, value: "${className}"`);
      
      try {
        // Check if README exists for this group/class
        console.log(`🔍 [createCustomRepos] Querying database for README with group: ${classId}`);
        let readme = await Readme.findOne({ group: classId });
        console.log(`📊 [createCustomRepos] Database query result:`, readme ? 'Found' : 'Not found');
        
        if (!readme || !readme.content) {
          // Create a default README if none exists
          console.log('📝 [createCustomRepos] No README found, creating default README for class');
          console.log(`📝 [createCustomRepos] Reason: ${!readme ? 'No README document' : 'README document exists but no content'}`);
          
          const defaultReadmeContent = `# 🎓 ${className} - OSS Management Course

## 📚 Course Overview
Welcome to the Open Source Software (OSS) Management course! This repository will track your progress through various quests and challenges designed to teach you about contributing to open source projects.

## 🎯 Learning Objectives
- Understand the OSS contribution workflow
- Learn to work with Git and GitHub
- Practice creating pull requests and issues
- Develop collaboration skills in open source projects

## 📊 Your Progress
Your current progress will be displayed here as you complete quests.

### 🚀 Current Quest
{Current quest information will appear here}

### ✅ Completed Quests
{Completed quests will be listed here}

## 📋 Available Quests
{Quest list will be populated here}

## 🛠️ Getting Started
1. Accept the invitation to this repository
2. Check the issues tab for your first quest
3. Follow the instructions in each quest
4. Submit your answers as comments on the issues

## 📞 Need Help?
- Check the quest instructions carefully
- Use hints if available (they may cost XP)
- Ask questions in the issue comments

---
*This README is automatically updated as you progress through the course.*`;

          console.log(`📄 [createCustomRepos] Generated default README content (${defaultReadmeContent.length} characters)`);
          console.log(`📄 [createCustomRepos] Default README preview: "${defaultReadmeContent.substring(0, 100)}..."`);

          // Save the default README to the database
          console.log(`💾 [createCustomRepos] Saving default README to database...`);
          readme = new Readme({
            group: classId,
            content: defaultReadmeContent,
            fileName: 'README.md',
            contentLength: defaultReadmeContent.length
          });
          
          const savedReadme = await readme.save();
          console.log(`✅ [createCustomRepos] Default README saved to database with ID: ${savedReadme._id}`);
          console.log(`✅ [createCustomRepos] Saved README details: fileName=${savedReadme.fileName}, contentLength=${savedReadme.contentLength}`);
          
          readmeContent = defaultReadmeContent;
        } else {
          readmeContent = readme.content;
          console.log(`📄 [createCustomRepos] Found existing README for class`);
          console.log(`📄 [createCustomRepos] Existing README details: fileName=${readme.fileName}, contentLength=${readme.contentLength}`);
          console.log(`📄 [createCustomRepos] README content length: ${readmeContent.length} characters`);
          console.log(`📄 [createCustomRepos] README preview: "${readmeContent.substring(0, 100)}..."`);
        }
        
        console.log(`🎯 [createCustomRepos] README processing complete. Will use README: ${readmeContent ? 'YES' : 'NO'}`);
        if (readmeContent) {
          console.log(`🎯 [createCustomRepos] Final README content length: ${readmeContent.length} characters`);
        }
        
      } catch (error) {
        console.error('❌ [createCustomRepos] Error handling README:', error);
        console.error('❌ [createCustomRepos] Error stack:', error.stack);
        console.error('❌ [createCustomRepos] Error details:', {
          message: error.message,
          code: error.code,
          name: error.name
        });
        // Continue without README if there's an error
        readmeContent = null;
        console.log('⚠️ [createCustomRepos] Continuing without README due to error');
      }
    } else {
      console.log('📝 [createCustomRepos] No classId provided, skipping README handling');
      console.log(`📝 [createCustomRepos] Debug: classId=${classId}, className=${className}`);
    }

    // --- BEGIN orgOctokit initialization ---
    // Import Octokit modules dynamically
    const { Octokit } = await import('@octokit/rest');
    const { createAppAuth } = await import('@octokit/auth-app');

    // Create GitHub App instance using OSS-Doorway's credentials
    const auth = createAppAuth({
      appId: process.env.OSS_DOORWAY_APP_ID,
      privateKey: process.env.OSS_DOORWAY_PRIVATE_KEY,
    });

    // Get app token
    const { token } = await auth({ type: "app" });

    const octokit = new Octokit({
      auth: token,
      userAgent: 'OSS-Management'
    });

    // Find installation for the org
    const { data: installations } = await octokit.apps.listInstallations();
    const installation = installations.find(inst => 
      inst.account.login === process.env.GITHUB_ORG
    );

    if (!installation) {
      throw new Error(`GitHub App not installed in organization: ${process.env.GITHUB_ORG}`);
    }

    // Get installation token
    const { token: installationToken } = await auth({
      type: "installation",
      installationId: installation.id,
    });

    const orgOctokit = new Octokit({
      auth: installationToken,
      userAgent: 'OSS-Management'
    });
    // --- END orgOctokit initialization ---

    console.log(`Creating custom repos for users: ${users.join(', ')} with sequence: ${sequenceFile || '[customSequence]'}`);

    // 1. Load custom quest sequence (support both file and direct JSON)
    let customSequenceData;
    if (customSequence) {
      customSequenceData = customSequence;
    } else if (sequenceFile) {
      const path = require('path');
      const fs = require('fs');
      const sequencePath = path.join(__dirname, '../OSS-Doorway/src/config', sequenceFile);
      if (!fs.existsSync(sequencePath)) {
        return res.status(400).json({ message: `❌ Error: Custom sequence file '${sequenceFile}' not found at ${sequencePath}` });
      }
      try {
        customSequenceData = JSON.parse(fs.readFileSync(sequencePath, 'utf8'));
      } catch (error) {
        return res.status(400).json({ message: `❌ Error: Invalid JSON in sequence file '${sequenceFile}': ${error.message}` });
      }
    } else {
      return res.status(400).json({ message: 'No quest sequence provided.' });
    }

    // 2. Validate sequence structure
    if (!customSequenceData.questSequence || !Array.isArray(customSequenceData.questSequence)) {
      return res.status(400).json({ message: `❌ Error: Invalid sequence structure. Missing or invalid 'questSequence' array.` });
    }

    // 3. Check if this is the default quest-sequence.json
    const isDefaultSequence = sequenceFile === 'quest-sequence.json';
    let groupId = null;
    let dynamicConfig = null;
    if (!isDefaultSequence) {
      groupId = `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      dynamicConfig = generateCustomQuestConfig(customSequenceData, groupId);
      // Ensure generated directory exists
      const path = require('path');
      const fs = require('fs');
      const generatedDir = path.join(__dirname, '../../../OSS-Doorway/src/config/generated');
      if (!fs.existsSync(generatedDir)) {
        fs.mkdirSync(generatedDir, { recursive: true });
      }
      // Save group-specific config
      const configPath = path.join(generatedDir, `quest_config_${groupId}.json`);
      fs.writeFileSync(configPath, JSON.stringify(dynamicConfig, null, 2));
      console.log(`✅ Generated custom config: ${configPath}`);
    } else {
      console.log(`✅ Using default quest sequence: ${sequenceFile}`);
    }

    // 4. Create repos with sequence
    // Use class name for repository naming if available, otherwise fall back to sequenceId
    let repoIdentifier;
    if (className) {
      // Format class name to be URL-safe (same logic as createMultipleRepos)
      repoIdentifier = className
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      console.log(`📚 [createCustomRepos] Using class-based naming: ${repoIdentifier}`);
    } else {
      // Fallback to sequence-based naming
      repoIdentifier = sequenceFile ? sequenceFile.replace(/\.json$/i, '') : 'custom';
      console.log(`📁 [createCustomRepos] Using sequence-based naming: ${repoIdentifier}`);
    }
    
    const results = { successful: [], unsuccessful: [] };
    for (const user of users) {
      try {
        // Use class-based naming: username-classname format (e.g., alice-cs-101)
        const dbUser = className ? `${user}-${repoIdentifier}` : `${user}-${repoIdentifier}-oss-doorway`;
        const repoName = className ? `${user}-${repoIdentifier}` : dbUser; // Class repos: username-classname, Legacy: user-sequence-oss-doorway
        const repoDescription = className ? `Repository for ${user} in ${className}` : `OSS Doorway repository for ${dbUser}`;
        
        console.log(`📝 [createCustomRepos] Creating repo: ${repoName} (dbUser: ${dbUser})`);
        
        // Create the repository
        const repoResponse = await orgOctokit.repos.createInOrg({
          org: process.env.GITHUB_ORG,
          name: repoName,
          description: repoDescription,
          private: false,
          auto_init: true,
          gitignore_template: "Node"
        });
        // Add original user as collaborator
        await orgOctokit.repos.addCollaborator({
          owner: process.env.GITHUB_ORG,
          repo: repoName,
          username: user,
          permission: "push"
        });

        // 🔧 NEW: Add README file if available from class setup
        if (readmeContent) {
          console.log(`📤 [createCustomRepos] ===== README UPLOAD START =====`);
          console.log(`📤 [createCustomRepos] Target repository: ${process.env.GITHUB_ORG}/${repoName}`);
          console.log(`📤 [createCustomRepos] User: ${user} (dbUser: ${dbUser})`);
          console.log(`📄 [createCustomRepos] README content length: ${readmeContent.length} characters`);
          console.log(`📄 [createCustomRepos] README content preview: "${readmeContent.substring(0, 150)}..."`);
          console.log(`🔧 [createCustomRepos] GitHub org: ${process.env.GITHUB_ORG}`);
          console.log(`🔧 [createCustomRepos] Repository name: ${repoName}`);
          console.log(`🔧 [createCustomRepos] Branch: main`);
          
          try {
            console.log(`🚀 [createCustomRepos] Initiating GitHub API call to upload README...`);
            console.log(`🚀 [createCustomRepos] Converting content to base64...`);
            
            const base64Content = Buffer.from(readmeContent).toString('base64');
            console.log(`🚀 [createCustomRepos] Base64 content length: ${base64Content.length} characters`);
            console.log(`🚀 [createCustomRepos] Base64 preview: "${base64Content.substring(0, 50)}..."`);
            
            console.log(`🌐 [createCustomRepos] Making GitHub API request to create/update README.md...`);
            const uploadResult = await orgOctokit.repos.createOrUpdateFileContents({
              owner: process.env.GITHUB_ORG,
              repo: repoName,
              path: "README.md",
              message: "Add initial README file from class setup",
              content: base64Content,
              branch: "main"
            });
            
            console.log(`✅ [createCustomRepos] README file successfully uploaded to ${process.env.GITHUB_ORG}/${repoName}`);
            console.log(`✅ [createCustomRepos] Upload response details:`, {
              status: uploadResult.status,
              sha: uploadResult.data.content?.sha,
              size: uploadResult.data.content?.size,
              download_url: uploadResult.data.content?.download_url,
              html_url: uploadResult.data.content?.html_url
            });
            console.log(`📤 [createCustomRepos] ===== README UPLOAD SUCCESS =====`);
            
          } catch (readmeError) {
            console.error(`❌ [createCustomRepos] ===== README UPLOAD FAILED =====`);
            console.error(`❌ [createCustomRepos] Error uploading README to ${repoName}:`, readmeError.message);
            console.error(`❌ [createCustomRepos] Error stack:`, readmeError.stack);
            console.error(`❌ [createCustomRepos] Error details:`, {
              status: readmeError.response?.status,
              statusText: readmeError.response?.statusText,
              data: readmeError.response?.data,
              message: readmeError.message,
              code: readmeError.code
            });
            
            if (readmeError.response?.data) {
              console.error(`❌ [createCustomRepos] GitHub API error response:`, readmeError.response.data);
            }
            
            console.log(`⚠️ [createCustomRepos] Continuing with repository creation despite README upload failure`);
            // Continue with repository creation even if README fails
          }
        } else {
          console.log(`📝 [createCustomRepos] ===== README SKIPPED =====`);
          console.log(`📝 [createCustomRepos] No README content available for ${repoName}`);
          console.log(`📝 [createCustomRepos] Reason: readmeContent is ${readmeContent === null ? 'null' : readmeContent === undefined ? 'undefined' : 'empty'}`);
          console.log(`📝 [createCustomRepos] Repository will be created without README from class setup`);
        }

        // Create user in OSS-Doorway database if they don't exist (using dbUser)
        await createUserInOSSDoorwayDB(dbUser, user, groupId, sequenceFile, isDefaultSequence);
        // Get user data (either newly created or existing)
        // Connect to OSS-Doorway DB to update user data
        const mongoose = require('mongoose');
        const ossDoorwayURI = process.env.OSS_DOORWAY_DB_URI;
        const ossDoorwayDBName = process.env.OSS_DOORWAY_DB_NAME;
        const ossDoorwayConnection = mongoose.createConnection(`${ossDoorwayURI}/${ossDoorwayDBName}`);
        const userSchema = new mongoose.Schema({
          _id: String,
          user_data: Object
        }, { collection: 'user_data' });
        const User = ossDoorwayConnection.model('User', userSchema);
        let userDoc = await User.findOne({ _id: dbUser });
        if (userDoc) {
          // COMPLETELY RESET user data for fresh start with new sequence
          userDoc.user_data = {
            github: userDoc.user_data.github || user,
            username: dbUser,
            points: 0,
            xp: 0,
            completion: 0,
            streakCount: 0,
            currentStreak: 0,
            completed: {},
            accepted: {},
            current: null,
            customGroupId: null,
            customSequenceFile: null
          };
          if (!isDefaultSequence) {
            userDoc.user_data.customGroupId = groupId;
            userDoc.user_data.customSequenceFile = sequenceFile;
          }
          // Find the first quest (no prerequisite or isQ0)
          let firstQuestId;
          let firstTaskId = "T1";
          if (isDefaultSequence) {
            const defaultConfigPath = path.join(__dirname, '../OSS-Doorway/src/config/quest_config.json');
            let defaultQuestConfig = {};
            if (fs.existsSync(defaultConfigPath)) {
              defaultQuestConfig = JSON.parse(fs.readFileSync(defaultConfigPath, 'utf8'));
            }
            if (defaultQuestConfig.Q0) {
              firstQuestId = "Q0";
            } else {
              const defaultQuests = Object.keys(defaultQuestConfig).filter(key => key !== "map_repo_link");
              if (defaultQuests.length > 0) {
                firstQuestId = defaultQuests[0];
              }
            }
          } else {
            const firstQuestObj = customSequenceData.questSequence.find(q => !q.metadata.prerequisite || q.metadata.isQ0);
            if (firstQuestObj) firstQuestId = firstQuestObj.questId;
          }
          // Initialize accepted and current fields like acceptQuest
          if (firstQuestId) {
            // Load quest config
            let questConfig;
            if (isDefaultSequence) {
              const defaultConfigPath = path.join(__dirname, '../OSS-Doorway/src/config/quest_config.json');
              questConfig = fs.existsSync(defaultConfigPath)
                ? JSON.parse(fs.readFileSync(defaultConfigPath, 'utf8'))
                : {};
            } else {
              const groupConfigPath = path.join(__dirname, '../../../OSS-Doorway/src/config/generated', `quest_config_${groupId}.json`);
              questConfig = fs.existsSync(groupConfigPath)
                ? JSON.parse(fs.readFileSync(groupConfigPath, 'utf8'))
                : {};
            }
            // Set up accepted
            userDoc.user_data.accepted = userDoc.user_data.accepted || {};
            userDoc.user_data.accepted[firstQuestId] = {};
            for (const task in questConfig[firstQuestId]) {
              if (task !== "metadata") {
                userDoc.user_data.accepted[firstQuestId][task] = {
                  completed: false,
                  attempts: 0,
                  hints: 0,
                  timeStart: 0,
                  timeEnd: 0.0,
                  issueNum: 0
                };
              }
            }
            // Set current
            userDoc.user_data.current = {
              quest: firstQuestId,
              task: firstTaskId
            };
          }
          await userDoc.save();
        }
        await ossDoorwayConnection.close();
        // Find the first quest (no prerequisite or isQ0)
        let firstQuest;
        if (isDefaultSequence) {
          // Load default quest config
          const defaultConfigPath = path.join(__dirname, '../OSS-Doorway/src/config/quest_config.json');
          let defaultQuestConfig = {};
          if (fs.existsSync(defaultConfigPath)) {
            defaultQuestConfig = JSON.parse(fs.readFileSync(defaultConfigPath, 'utf8'));
          }
          if (defaultQuestConfig.Q0) {
            firstQuest = { questId: "Q0" };
          } else {
            const defaultQuests = Object.keys(defaultQuestConfig).filter(key => key !== "map_repo_link");
            if (defaultQuests.length > 0) {
              firstQuest = { questId: defaultQuests[0] };
            }
          }
        } else {
          firstQuest = customSequenceData.questSequence.find(q => !q.metadata.prerequisite || q.metadata.isQ0);
        }
        // Create the first quest issue (if any)
        if (firstQuest) {
          // For custom sequences, use the generated group config directly
          let taskId = "T1";
          let questConfig = {};
          let groupConfigPath = null;
          if (!isDefaultSequence) {
            groupConfigPath = path.join(__dirname, '../../../OSS-Doorway/src/config/generated', `quest_config_${groupId}.json`);
            if (fs.existsSync(groupConfigPath)) {
              questConfig = JSON.parse(fs.readFileSync(groupConfigPath, 'utf8'));
              console.log(`[DEBUG] Loaded group config for custom sequence: ${groupConfigPath}`);
              // Print all quests and their tasks
              Object.keys(questConfig).forEach(qid => {
                if (qid === 'map_repo_link') return;
                const quest = questConfig[qid];
                console.log(`[DEBUG] Quest: ${qid}`);
                Object.keys(quest).forEach(key => {
                  if (key === 'metadata') return;
                  const task = quest[key];
                  console.log(`  [DEBUG] Task: ${key} ->`, task);
                });
              });
            } else {
              console.warn(`[WARN] Group config file not found: ${groupConfigPath}`);
            }
            if (firstQuest.questId && questConfig[firstQuest.questId] && questConfig[firstQuest.questId][taskId]) {
              const task = questConfig[firstQuest.questId][taskId];
              console.log(`[DEBUG] Creating issue for questId=${firstQuest.questId}, taskId=${taskId}`);
              console.log(`[DEBUG] Task content:`, task);
              await orgOctokit.issues.create({
                owner: process.env.GITHUB_ORG,
                repo: repoName,
                title: `${taskId}: ${task.desc}`,
                body: task.accept,
                labels: ['quest', 'task']
              });
            } else {
              console.warn(`[WARN] Could not find real task for questId=${firstQuest.questId}, taskId=${taskId} in group config. Falling back to default.`);
            }
          } else {
            // For default, load from config
            const defaultConfigPath = path.join(__dirname, '../OSS-Doorway/src/config/quest_config.json');
            if (fs.existsSync(defaultConfigPath)) {
              questConfig = JSON.parse(fs.readFileSync(defaultConfigPath, 'utf8'));
              console.log(`[DEBUG] Loaded default quest config: ${defaultConfigPath}`);
            }
            if (questConfig[firstQuest.questId] && questConfig[firstQuest.questId][taskId]) {
              const task = questConfig[firstQuest.questId][taskId];
              console.log(`[DEBUG] Creating issue for questId=${firstQuest.questId}, taskId=${taskId}`);
              console.log(`[DEBUG] Task content:`, task);
              await orgOctokit.issues.create({
                owner: process.env.GITHUB_ORG,
                repo: repoName,
                title: `${taskId}: ${task.desc}`,
                body: task.accept,
                labels: ['quest', 'task']
              });
            } else {
              console.warn(`[WARN] Could not find real task for questId=${firstQuest.questId}, taskId=${taskId} in default config. Falling back to default.`);
            }
          }
        }
        results.successful.push({ user, repoName, dbUser, groupId, repoUrl: repoResponse.data.html_url });
      } catch (error) {
        console.error(`❌ Failed to create repo for ${user}:`, error);
        results.unsuccessful.push({ user, error: error.message, details: error.response?.data || "No additional details" });
      }
    }
    res.status(200).json({ message: "Custom repository creation process completed", results });
  } catch (error) {
    console.error("❌ DEBUG: Error in createCustomRepos:", error);
    res.status(500).json({ message: "Error creating custom repositories", error: error.message, details: error.response?.data || "No additional details available" });
  }
};

// Helper function to create user in OSS-Doorway database
async function createUserInOSSDoorwayDB(dbUser, originalUser, groupId, sequenceFile, isDefaultSequence) {
    try {
        console.log(`💾 [createUserInOSSDoorwayDB] Starting for user: ${dbUser}`);
        
        // Connect to OSS-Doorway database using a separate connection
        const mongoose = require('mongoose');
        const ossDoorwayURI = process.env.OSS_DOORWAY_DB_URI;
        const ossDoorwayDBName = process.env.OSS_DOORWAY_DB_NAME;
        
        console.log(`🔗 [createUserInOSSDoorwayDB] Connecting to OSS-Doorway DB: ${ossDoorwayDBName}`);
        
        // Create a separate connection for OSS-Doorway database
        const ossDoorwayConnection = mongoose.createConnection(`${ossDoorwayURI}/${ossDoorwayDBName}`);
        console.log(`✅ [createUserInOSSDoorwayDB] Connected to OSS-Doorway database`);
        
        // Define user schema (simplified version of OSS-Doorway's user schema)
        const userSchema = new mongoose.Schema({
            _id: String, // Use _id as the username
            user_data: {
                github: String,
                username: String,
                points: Number,
                xp: Number,
                completion: Number,
                streakCount: Number,
                currentStreak: Number,
                completed: Object,
                accepted: Object,
                current: Object,
                customGroupId: String,
                customSequenceFile: String
            }
        }, { collection: 'user_data' }); // Explicitly set collection name to match bot's expectation
        
        const User = ossDoorwayConnection.model('User', userSchema);
        
        // Check if user already exists
        console.log(`🔍 [createUserInOSSDoorwayDB] Checking if user exists: ${dbUser}`);
        let userDoc = await User.findOne({ _id: dbUser });
        if (!userDoc) {
            console.log(`➕ [createUserInOSSDoorwayDB] Creating new user: ${dbUser}`);
            // Create new user with _id as the username
            userDoc = new User({
                _id: dbUser,
                user_data: {
                    github: originalUser,
                    username: dbUser,
                    points: 0,
                    xp: 0,
                    completion: 0,
                    streakCount: 0,
                    currentStreak: 0,
                    completed: {},
                    accepted: {},
                    current: null,
                    customGroupId: isDefaultSequence ? null : groupId,
                    customSequenceFile: isDefaultSequence ? null : sequenceFile
                }
            });
        } else {
            console.log(`🔄 [createUserInOSSDoorwayDB] Resetting existing user: ${dbUser}`);
            // Reset user data for fresh start
            userDoc.user_data = {
                github: originalUser,
                username: dbUser,
                points: 0,
                xp: 0,
                completion: 0,
                streakCount: 0,
                currentStreak: 0,
                completed: {},
                accepted: {},
                current: null,
                customGroupId: isDefaultSequence ? null : groupId,
                customSequenceFile: isDefaultSequence ? null : sequenceFile
            };
        }
        await userDoc.save();
        console.log(`✅ [createUserInOSSDoorwayDB] User ${dbUser} created/updated in OSS-Doorway database`);
        // Close the OSS-Doorway connection
        await ossDoorwayConnection.close();
        console.log(`🔌 [createUserInOSSDoorwayDB] Disconnected from OSS-Doorway database`);
    } catch (error) {
        console.error(error);
    }
}

module.exports = {
    createRepo,
    getProductionStatus,
    createMultipleRepos,
    createCustomRepos,
    getRepoCollaborationStatus,
    listOrganizationRepos,
    checkRepoReadme,
    getStudentScores
};