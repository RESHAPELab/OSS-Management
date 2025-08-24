/*
Maybe one day we need to implement the creation of a repo
for different organizations. Now, I am not going to 
implement the logic. Time costs :(
*/
const UserRepo = require("../models/UserRepoModel");
const Readme = require("../models/ReadmeModel");
const Group = require("../models/GroupModel");
const QuestConfig = require("../models/QuestConfigModel");
require("dotenv").config();


const axios = require('axios');
const { sendMessageToBot, getGithubAppInstallationAccessToken } = require('../utils/botMessage');
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
        const defaultReadmeContent = `# ${studentGithubUsername}-${formattedClassName}

Repository for ${studentGithubUsername} in ${groupName}.`;

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
    try {
        const env = process.env.NODE_ENV;
        const orgFromEnv = process.env.GITHUB_ORG;
        const devOrg = process.env.USER_AGENT_DEV;
        const prodOrg = process.env.USER_AGENT_PROD;
        const fallback = 'OSS-Doorway-Dev';
        
        const organizationGh = orgFromEnv || (env === 'production' ? prodOrg : devOrg) || fallback;
        return res.status(200).json({ organizationGh });
    } catch (e) {
        return res.status(200).json({ organizationGh: 'OSS-Doorway-Dev' });
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

        // Inject initial quest progress section if we have a quest sequence
        if (customSequenceData && customSequenceData.questSequence && customSequenceData.questSequence.length > 0) {
          const timestamp = new Date().toISOString().replace('T', ' ').replace(/\..+/, '');
          let progressSection = `\n\n---\n\n### 🕒 Progress Update: ${timestamp} UTC\n\n### ⚙️ Current Quest\n\n`;

          // Determine the first quest (prefer Q0 or a quest without prerequisites)
          const firstQuest = customSequenceData.questSequence.find(q => !q.metadata?.prerequisite || q.isQ0 || q.metadata?.isQ0) || customSequenceData.questSequence[0];
          if (firstQuest) {
            const questTitle = firstQuest.metadata?.title || firstQuest.title || '';
            progressSection += `- ${firstQuest.questId} - ${questTitle}\n`;
            if (firstQuest.tasks && typeof firstQuest.tasks === 'object') {
              Object.entries(firstQuest.tasks).forEach(([taskKey, taskVal]) => {
                if (taskKey === 'metadata') return;
                const taskDesc = taskVal.desc || taskVal.description || taskVal.name || '';
                progressSection += `  - ${taskKey} - ${taskDesc}\n`;
              });
            }
          }

          progressSection += `\n### ✅ Completed Quests\n\n- None yet\n`;

          // Append the section only if it's not already present
          if (readmeContent) {
            if (!readmeContent.includes('### 🕒 Progress Update')) {
              readmeContent += progressSection;
            }
          } else {
            // Initialize README content if it was null and add progress section
            readmeContent = progressSection;
          }
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
                            
                            results.successful.push({
                                user: username,
                                repoName: `${username}-${formattedClassName}`,
                                repoUrl: `https://github.com/${organizationGh}/${username}-${formattedClassName}`,
                                status: 'success',
                                message: 'Repository created successfully via personal token'
                            });
                            console.log(`✅ Personal token created repository for ${username}`);
                            
                        } catch (error) {
                            console.error(`❌ Error processing ${username} with personal token:`, error);
                            results.unsuccessful.push({
                                user: username,
                                error: error.message,
                                details: 'Personal token method failed',
                                status: 'error'
                            });
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
                        results.successful.push({
                            user: username,
                            repoName: `${username}-${formattedClassName}`,
                            repoUrl: `https://github.com/${organizationGh}/${username}-${formattedClassName}`,
                            status: 'success',
                            message: 'Repository created successfully via bot server'
                        });
                        console.log(`✅ Bot server created repository for ${username}`);
                    } else if (botResponse && botResponse.data && botResponse.data.results) {
                        // Check if the user is in successful results
                        const userResults = botResponse.data.results;
                        if (userResults.successful && userResults.successful.includes(username)) {
                            results.successful.push({
                                user: username,
                                repoName: `${username}-${formattedClassName}`,
                                repoUrl: `https://github.com/${organizationGh}/${username}-${formattedClassName}`,
                                status: 'success',
                                message: 'Repository created successfully via bot server'
                            });
                            console.log(`✅ Bot server created repository for ${username}`);
                        } else {
                            results.unsuccessful.push({
                                user: username,
                                error: 'Bot server reported failure',
                                details: 'User not found in successful results',
                                status: 'error'
                            });
                            console.log(`❌ Bot server failed for ${username}`);
                        }
                    } else {
                        // If we can't determine success, assume it worked (since we got a response)
                        results.successful.push({
                            user: username,
                            repoName: `${username}-${formattedClassName}`,
                            repoUrl: `https://github.com/${organizationGh}/${username}-${formattedClassName}`,
                            status: 'success',
                            message: 'Repository created successfully via bot server (assumed)'
                        });
                        console.log(`✅ Assuming success for ${username} (got bot response)`);
                    }
                } catch (error) {
                    console.error(`❌ Error processing ${username} via bot server:`, error);
                    results.unsuccessful.push({
                        user: username,
                        error: error.message,
                        details: 'Bot server method failed',
                        status: 'error'
                    });
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

                // Step 4: Create quest issues (autogenerated IDs and titles)
                console.log(`🎯 Step 4 - Creating quest issues for ${username}`);
                // Define the quest tasks (replace with your actual quest/task data as needed)
                const questTasks = [
                    {
                        taskTitle: "Environment Setup and Configuration",
                        body: `# 🎯 Environment Setup and Configuration\n\nWelcome to your OSS journey! This quest will help you set up your environment and understand the basics.\n\n## Tasks:\n- Configure your development environment\n- Set up GitHub account and preferences\n- Understand the quest system\n\nComplete each task to progress through your OSS adventure!`
                    },
                    {
                        taskTitle: "Advanced GitHub Concepts",
                        body: `# 🎯 Advanced GitHub Concepts\n\nIn this quest, you'll learn advanced GitHub workflows and collaboration patterns.\n\n## Tasks:\n- Understand Git rebase and advanced concepts\n- Master GitHub collaboration techniques\n- Complete MCQ assessments\n\nThis quest builds on your foundational knowledge!`
                    },
                    {
                        taskTitle: "Repository Analytics",
                        body: `# 🎯 Repository Analytics\n\nIn this quest, you'll learn to analyze repository statistics and understand project activity.\n\n## Tasks:\n- Count open issues in repositories\n- Understand repository activity metrics\n- Analyze project health indicators\n\nLearn to assess repository activity and project health!`
                    },
                    {
                        taskTitle: "Understanding OSS Projects and GitHub Basics",
                        body: `# 🎯 Understanding OSS Projects and GitHub Basics\n\nIn this quest, you'll learn about open source projects and GitHub fundamentals.\n\n## Tasks:\n- Explore GitHub repositories\n- Understand issue tracking\n- Learn about pull requests\n- Discover project documentation\n\nThis quest covers the essential basics of OSS collaboration!`
                    },
                    {
                        taskTitle: "Forking and Contributing to Repositories",
                        body: `# 🎯 Forking and Contributing to Repositories\n\nThis quest covers the essential skills of forking repositories and making contributions.\n\n## Tasks:\n- Fork repositories\n- Create branches\n- Make meaningful contributions\n- Understand contribution guidelines\n\nLearn the practical skills of OSS contribution!`
                    },
                    {
                        taskTitle: "Creating Pull Requests and Code Reviews",
                        body: `# 🎯 Creating Pull Requests and Code Reviews\n\nIn this final quest, you'll learn about pull requests and the code review process.\n\n## Tasks:\n- Create effective pull requests\n- Participate in code reviews\n- Understand merge strategies\n- Contribute to project discussions\n\nMaster the art of collaborative development!`
                    }
                ];
                // Format class name for the title
                const classTitle = (className || groupName || "Class")
                    .replace(/[^a-zA-Z0-9]+/g, '')
                    .replace(/^-+|-+$/g, '');
                // Create each quest issue with autogenerated ID and title
                for (let i = 0; i < questTasks.length; i++) {
                    const questNumber = i + 1;
                    const questId = `Q${questNumber}`;
                    const quest = questTasks[i];
                    const issueTitle = `${classTitle}-Q${questNumber} T1: ${quest.taskTitle}`;
                    console.log(`🎯 Creating quest: ${issueTitle}`);
                    await axios.post(
                        `https://api.github.com/repos/${organizationGh}/${repoName}/issues`,
                        {
                            title: issueTitle,
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
                    console.log(`✅ Quest created: ${issueTitle}`);
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
                results.successful.push({
                    user: username,
                    repoName: `${username}-${formattedClassName}`,
                    repoUrl: `https://github.com/${organizationGh}/${username}-${formattedClassName}`,
                    status: 'success',
                    message: 'Repository created successfully'
                });
                
            } catch (error) {
                console.error(`❌ Error processing user ${username}:`, error);
                if (error.response) {
                    console.error('Response status:', error.response.status);
                    console.error('Response data:', error.response.data);
                }
                results.unsuccessful.push({
                    user: username,
                    error: error.message,
                    details: error.response?.data || 'No additional details',
                    status: 'error'
                });
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
        let { organizationGh } = req.query;
        if (!organizationGh) {
            // Fallback to env if frontend didn't pass it
            organizationGh = process.env.GITHUB_ORG || process.env.USER_AGENT_DEV || 'OSS-Doorway-Dev';
        }

        const response = await sendMessageToBot(
            "github/listRepos",
            { org: organizationGh }
        );

        if (!response || !response.data) {
            return res.status(502).json({ message: "Bot did not return data" });
        }

        res.status(200).json({
            message: "Repositories retrieved successfully",
            repos: response.data
        });
    } catch (error) {
        console.error("Error in listOrganizationRepos:", error.message);
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
                
                // Try multiple search patterns to handle different naming conventions
                const searchPatterns = [
                    { _id: dbUsername },                                    // Exact match: student-classname
                    { _id: student },                                       // Just the username
                    { 'user_data.github': student },                       // GitHub field match
                    { _id: new RegExp(`^${student}`, 'i') },               // Username prefix (case insensitive)
                    { _id: new RegExp(`${student}`, 'i') },                // Username anywhere (case insensitive)
                    { _id: new RegExp(`${student}-.*`, 'i') }              // Username with any suffix (case insensitive)
                ];
                
                let userDoc = null;
                let searchMethod = '';
                
                // Try each search pattern until we find a user
                for (let i = 0; i < searchPatterns.length; i++) {
                    const pattern = searchPatterns[i];
                    console.log(`🔍 [getStudentScores] Trying search pattern ${i + 1}:`, pattern);
                    
                    userDoc = await User.findOne(pattern);
                    if (userDoc && userDoc.user_data) {
                        searchMethod = `Pattern ${i + 1}: ${JSON.stringify(pattern)}`;
                        console.log(`✅ [getStudentScores] Found user: ${userDoc._id} using ${searchMethod}`);
                        break;
                    }
                }
                
                if (userDoc && userDoc.user_data) {
                    // Parse quest progress from OSS-Doorway data structure
                    const questProgress = {};
                    const completed = userDoc.user_data.completed || {};
                    const accepted = userDoc.user_data.accepted || {};
                    
                    // Process completed quests
                    Object.keys(completed).forEach(questId => {
                        // Map Q1, Q2, ... to {ClassName}-Q{n}
                        let mappedQuestId = questId;
                        const classPrefixedQuestId = `${formattedClassName.replace(/[^a-zA-Z0-9]+/g, '')}-${questId}`;
                        const questIdMatch = questId.match(/^Q(\d+)$/i);
                        if (questIdMatch) {
                            mappedQuestId = `${formattedClassName.replace(/[^a-zA-Z0-9]+/g, '')}-Q${questIdMatch[1]}`;
                        }
                        // Always store under both keys
                        [questId, mappedQuestId, classPrefixedQuestId].forEach(key => {
                            if (!questProgress[key]) {
                                questProgress[key] = { completed: false, score: 0, xp: 0, tasks: {} };
                            }
                        });
                        questProgress[questId].completed = true;
                        questProgress[mappedQuestId].completed = true;
                        questProgress[classPrefixedQuestId].completed = true;
                        // If completed data has task information
                        if (typeof completed[questId] === 'object') {
                            Object.keys(completed[questId]).forEach(taskId => {
                                const taskData = completed[questId][taskId];
                                if (taskData && typeof taskData === 'object') {
                                    [questId, mappedQuestId, classPrefixedQuestId].forEach(key => {
                                        questProgress[key].tasks[taskId] = {
                                            completed: taskData.completed || true,
                                            score: taskData.score || 0,
                                            xp: taskData.xp || 0
                                        };
                                        questProgress[key].score += taskData.score || 0;
                                        questProgress[key].xp += taskData.xp || 0;
                                    });
                                }
                            });
                        }
                    });
                    
                    // Process accepted quests (may have partial completion)
                    Object.keys(accepted).forEach(questId => {
                        let mappedQuestId = questId;
                        const classPrefixedQuestId = `${formattedClassName.replace(/[^a-zA-Z0-9]+/g, '')}-${questId}`;
                        const questIdMatch = questId.match(/^Q(\d+)$/i);
                        if (questIdMatch) {
                            mappedQuestId = `${formattedClassName.replace(/[^a-zA-Z0-9]+/g, '')}-Q${questIdMatch[1]}`;
                        }
                        [questId, mappedQuestId, classPrefixedQuestId].forEach(key => {
                            if (!questProgress[key]) {
                                questProgress[key] = { completed: false, score: 0, xp: 0, tasks: {} };
                            }
                        });
                        if (typeof accepted[questId] === 'object') {
                            let questCompleted = true;
                            Object.keys(accepted[questId]).forEach(taskId => {
                                const taskData = accepted[questId][taskId];
                                if (taskData && typeof taskData === 'object') {
                                    const isTaskCompleted = taskData.completed || false;
                                    [questId, mappedQuestId, classPrefixedQuestId].forEach(key => {
                                        questProgress[key].tasks[taskId] = {
                                            completed: isTaskCompleted,
                                            score: taskData.score || 0,
                                            xp: taskData.xp || 0
                                        };
                                        if (isTaskCompleted) {
                                            questProgress[key].score += taskData.score || 0;
                                            questProgress[key].xp += taskData.xp || 0;
                                        } else {
                                            questCompleted = false;
                                        }
                                    });
                                }
                            });
                            // Only mark quest as completed if all tasks are completed
                            [questId, mappedQuestId, classPrefixedQuestId].forEach(key => {
                                questProgress[key].completed = questCompleted && Object.keys(questProgress[key].tasks).length > 0;
                            });
                        }
                    });

                    results[student] = {
                        points: userDoc.user_data.points || 0,
                        xp: userDoc.user_data.xp || 0,
                        completion: userDoc.user_data.completion || 0,
                        streakCount: userDoc.user_data.streakCount || 0,
                        currentStreak: userDoc.user_data.currentStreak || 0,
                        currentQuest: userDoc.user_data.current?.quest || null,
                        currentTask: userDoc.user_data.current?.task || null,
                        questProgress: questProgress,
                        completedQuests: userDoc.user_data.completed || {},
                        acceptedQuests: userDoc.user_data.accepted || {},
                        foundBy: searchMethod,
                        dbUserId: userDoc._id
                    };
                    console.log(`✅ [getStudentScores] Found data for ${student}:`, results[student]);
                } else {
                    results[student] = {
                        points: 0,
                        xp: 0,
                        completion: 0,
                        streakCount: 0,
                        currentStreak: 0,
                        currentQuest: null,
                        currentTask: null,
                        error: 'No user found with any search pattern'
                    };
                    console.log(`⚠️ [getStudentScores] No data found for ${student} with any pattern`);
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
        const { users, sequenceFile, customSequence, className, classId } = req.body;

        // 🎯 KEEP: Comprehensive logging of received custom quest data
        console.log('🎮 [BACKEND-RECEIVED] createCustomRepos called with:');
        console.log('📥 [BACKEND-RECEIVED] Users:', users);
        // console.log('📥 [BACKEND-RECEIVED] SequenceFile:', sequenceFile); // Removed
        console.log('📥 [BACKEND-RECEIVED] ClassName:', className);
        console.log('📥 [BACKEND-RECEIVED] ClassId:', classId);
        console.log('📥 [BACKEND-RECEIVED] Has customSequence:', !!customSequence);
        
        if (customSequence) {
            console.log('🎮 [BACKEND-CUSTOM-QUESTS] Full customSequence received:');
            console.log('🎮 [BACKEND-CUSTOM-QUESTS]', JSON.stringify(customSequence, null, 2));
            
            if (customSequence.questSequence) {
                // Filter and show only custom quests
                const customQuests = customSequence.questSequence.filter(quest => quest.questType === 'custom');
                console.log(`🔥 [BACKEND-CUSTOM-QUESTS] Found ${customQuests.length} custom quest(s):`);
                
                customQuests.forEach((quest, index) => {
                    console.log(`🔥 [BACKEND-CUSTOM-QUEST-${index + 1}] "${quest.title}":`, {
                        questId: quest.questId,
                        sequenceNumber: quest.sequenceNumber,
                        taskCount: quest.tasks ? Object.keys(quest.tasks).length : 0,
                        metadata: quest.metadata
                    });
                    
                    if (quest.tasks) {
                        console.log(`📋 [BACKEND-CUSTOM-TASKS] Tasks for "${quest.title}":`);
                        Object.entries(quest.tasks).forEach(([taskKey, task]) => {
                            console.log(`📋 [BACKEND-TASK] ${taskKey}:`, {
                                desc: task.desc,
                                points: task.points,
                                xp: task.xp,
                                answer: task.answer,
                                type: task.type
                            });
                        });
                    }
                });
            }
        }

        // Validate required environment variables
        console.log('🔍 [ENV-CHECK] Checking required environment variables...');
        const requiredEnvVars = {
            OSS_DOORWAY_APP_ID: process.env.OSS_DOORWAY_APP_ID,
            OSS_DOORWAY_PRIVATE_KEY: process.env.OSS_DOORWAY_PRIVATE_KEY ? 'SET' : 'NOT SET',
            GITHUB_ORG: process.env.GITHUB_ORG,
            OSS_DOORWAY_DB_URI: process.env.OSS_DOORWAY_DB_URI ? 'SET' : 'NOT SET',
            OSS_DOORWAY_DB_NAME: process.env.OSS_DOORWAY_DB_NAME
        };
        
        console.log('🔍 [ENV-CHECK] Environment variables status:', requiredEnvVars);
        
        // Check for missing environment variables
        const missingVars = Object.entries(requiredEnvVars)
            .filter(([key, value]) => !value || value === 'NOT SET')
            .map(([key]) => key);
            
        if (missingVars.length > 0) {
            console.error('❌ [ENV-CHECK] Missing required environment variables:', missingVars);
            return res.status(500).json({ 
                message: "Missing required environment variables", 
                missing: missingVars,
                details: `The following environment variables are required but not set: ${missingVars.join(', ')}`
            });
        }

        // Additional validation for specific variables
        if (!process.env.OSS_DOORWAY_APP_ID || process.env.OSS_DOORWAY_APP_ID.trim() === '') {
            console.error('❌ [ENV-CHECK] OSS_DOORWAY_APP_ID is empty or invalid');
            return res.status(500).json({ 
                message: "OSS_DOORWAY_APP_ID environment variable is empty or invalid"
            });
        }

        if (!process.env.GITHUB_ORG || process.env.GITHUB_ORG.trim() === '') {
            console.error('❌ [ENV-CHECK] GITHUB_ORG is empty or invalid');
            return res.status(500).json({ 
                message: "GITHUB_ORG environment variable is empty or invalid"
            });
        }

        if (!process.env.OSS_DOORWAY_DB_URI || process.env.OSS_DOORWAY_DB_URI.trim() === '') {
            console.error('❌ [ENV-CHECK] OSS_DOORWAY_DB_URI is empty or invalid');
            return res.status(500).json({ 
                message: "OSS_DOORWAY_DB_URI environment variable is empty or invalid"
            });
        }

        if (!process.env.OSS_DOORWAY_DB_NAME || process.env.OSS_DOORWAY_DB_NAME.trim() === '') {
            console.error('❌ [ENV-CHECK] OSS_DOORWAY_DB_NAME is empty or invalid');
            return res.status(500).json({ 
                message: "OSS_DOORWAY_DB_NAME environment variable is empty or invalid"
            });
        }

        // Validate GitHub App private key format
        try {
            let privateKey = process.env.OSS_DOORWAY_PRIVATE_KEY;
            if (!privateKey) {
                throw new Error('OSS_DOORWAY_PRIVATE_KEY environment variable is not set');
            }
            
            // Convert \n characters to actual newlines if they exist
            if (privateKey.includes('\\n')) {
                privateKey = privateKey.replace(/\\n/g, '\n');
            }
            
            if (!privateKey.includes('-----BEGIN RSA PRIVATE KEY-----') || !privateKey.includes('-----END RSA PRIVATE KEY-----')) {
                throw new Error('Invalid private key format - must contain BEGIN and END RSA PRIVATE KEY markers');
            }
            console.log('✅ [ENV-CHECK] GitHub App private key format is valid');
        } catch (keyError) {
            console.error('❌ [ENV-CHECK] Invalid GitHub App private key format:', keyError.message);
            return res.status(500).json({ 
                message: "Invalid GitHub App private key format", 
                error: keyError.message 
            });
        }

    // --- BEGIN orgOctokit initialization ---
    let orgOctokit; // Declare orgOctokit at function scope
    try {
        console.log('🔐 [GITHUB-AUTH] Initializing GitHub App authentication...');
        
        // Import Octokit modules dynamically
        const { Octokit } = await import('@octokit/rest');
        const { createAppAuth } = await import('@octokit/auth-app');

        console.log('🔐 [GITHUB-AUTH] Creating GitHub App auth instance...');
        // Create GitHub App instance using OSS-Doorway's credentials
        let privateKey = process.env.OSS_DOORWAY_PRIVATE_KEY;
        // Convert \n characters to actual newlines if they exist
        if (privateKey && privateKey.includes('\\n')) {
            privateKey = privateKey.replace(/\\n/g, '\n');
        }
        
        const auth = createAppAuth({
          appId: process.env.OSS_DOORWAY_APP_ID,
          privateKey: privateKey,
        });

        console.log('🔐 [GITHUB-AUTH] Getting app token...');
        // Get app token
        const { token } = await auth({ type: "app" });

        const octokit = new Octokit({
          auth: token,
          userAgent: 'OSS-Management'
        });

        console.log('🔐 [GITHUB-AUTH] Finding installation for organization...');
        // Find installation for the org
        const { data: installations } = await octokit.apps.listInstallations();
        const installation = installations.find(inst => 
          inst.account.login === process.env.GITHUB_ORG
        );

        if (!installation) {
          throw new Error(`GitHub App not installed in organization: ${process.env.GITHUB_ORG}`);
        }

        console.log('🔐 [GITHUB-AUTH] Getting installation token...');
        // Get installation token
        const { token: installationToken } = await auth({
          type: "installation",
          installationId: installation.id,
        });

        orgOctokit = new Octokit({
          auth: installationToken,
          userAgent: 'OSS-Management'
        });
        
        console.log('✅ [GITHUB-AUTH] GitHub App authentication successful');
        
        // Test the authentication by making a simple API call
        try {
            console.log('🔐 [GITHUB-AUTH] Testing authentication with organization info...');
            const { data: orgInfo } = await orgOctokit.orgs.get({
                org: process.env.GITHUB_ORG
            });
            console.log('✅ [GITHUB-AUTH] Organization access confirmed:', orgInfo.login);
        } catch (orgError) {
            console.error('❌ [GITHUB-AUTH] Failed to access organization:', orgError.message);
            return res.status(500).json({ 
                message: "GitHub App does not have access to the organization", 
                error: orgError.message 
            });
        }
    } catch (authError) {
        console.error('❌ [GITHUB-AUTH] GitHub App authentication failed:', authError);
        return res.status(500).json({ 
            message: "GitHub App authentication failed", 
            error: authError.message 
        });
    }
    // --- END orgOctokit initialization ---

    console.log(`Creating custom repos for users: ${users.join(', ')} with sequence: ${sequenceFile || '[customSequence]'}`);

    // Test OSS-Doorway database connection
    try {
        console.log('💾 [DB-TEST] Testing OSS-Doorway database connection...');
        const mongoose = require('mongoose');
        const ossDoorwayURI = process.env.OSS_DOORWAY_DB_URI;
        const ossDoorwayDBName = process.env.OSS_DOORWAY_DB_NAME;
        const testConnection = mongoose.createConnection(`${ossDoorwayURI}/${ossDoorwayDBName}`);
        
        // Test the connection by trying to access the database
        await testConnection.asPromise();
        console.log('✅ [DB-TEST] OSS-Doorway database connection successful');
        await testConnection.close();
    } catch (dbError) {
        console.error('❌ [DB-TEST] OSS-Doorway database connection failed:', dbError.message);
        return res.status(500).json({ 
            message: "OSS-Doorway database connection failed", 
            error: dbError.message 
        });
    }

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

    // 🔧 Handle README - prioritize JSON readme field
    let readmeContent = null;
    
    // First, check if README content is provided in the JSON
    if (customSequenceData && customSequenceData.readme) {
      readmeContent = customSequenceData.readme;
      console.log(`📄 [createCustomRepos] Using README from JSON configuration`);
      console.log(`📄 [createCustomRepos] JSON README content length: ${readmeContent.length} characters`);
      console.log(`📄 [createCustomRepos] JSON README preview: "${readmeContent.substring(0, 100)}..."`);
    }
    // If no README in JSON, fall back to database/class setup
    else if (classId && className) {
      console.log(`📝 [createCustomRepos] No README in JSON, checking class setup for: ${className} (ID: ${classId})`);
      
      try {
        // Check if README exists for this group/class
        console.log(`🔍 [createCustomRepos] Querying database for README with group: ${classId}`);
        const Readme = require('../models/ReadmeModel');
        let readme = await Readme.findOne({ group: classId });
        console.log(`📊 [createCustomRepos] Database query result:`, readme ? 'Found' : 'Not found');
        
        if (!readme || !readme.content) {
          // Create a default README if none exists
          console.log('📝 [createCustomRepos] No README found, creating default README for class');
          
          const defaultReadmeContent = `# ${className}

Repository for students in ${className}.`;

          // Save the default README to the database
          readme = new Readme({
            group: classId,
            content: defaultReadmeContent,
            fileName: 'README.md',
            contentLength: defaultReadmeContent.length
          });
          
          await readme.save();
          console.log(`✅ [createCustomRepos] Default README saved to database`);
          
          readmeContent = defaultReadmeContent;
        } else {
          readmeContent = readme.content;
          console.log(`📄 [createCustomRepos] Found existing README for class`);
          console.log(`📄 [createCustomRepos] README content length: ${readmeContent.length} characters`);
        }
      } catch (error) {
        console.error('❌ [createCustomRepos] Error handling README:', error);
        // Continue without README if there's an error
        readmeContent = null;
        console.log('⚠️ [createCustomRepos] Continuing without README due to error');
      }
    }
    


    // Final README status
    console.log(`🎯 [createCustomRepos] Final README decision: ${readmeContent ? 'USING README' : 'NO README'}`);
    if (readmeContent) {
      console.log(`🎯 [createCustomRepos] README source: ${customSequenceData?.readme ? 'JSON Configuration' : 'Database/Class Setup'}`);
      console.log(`🎯 [createCustomRepos] README length: ${readmeContent.length} characters`);
    }

    // Inject initial quest progress section if we have a quest sequence
    if (customSequenceData && customSequenceData.questSequence && customSequenceData.questSequence.length > 0) {
      const timestamp = new Date().toISOString().replace('T', ' ').replace(/\..+/, '');
      let progressSection = `\n\n---\n\n### 🕒 Progress Update: ${timestamp} UTC\n\n### ⚙️ Current Quest\n\n`;

      // Determine the first quest (prefer Q0 or a quest without prerequisites)
      const firstQuest = customSequenceData.questSequence.find(q => !q.metadata?.prerequisite || q.isQ0 || q.metadata?.isQ0) || customSequenceData.questSequence[0];
      if (firstQuest) {
        const questTitle = firstQuest.metadata?.title || firstQuest.title || '';
        progressSection += `- ${firstQuest.questId} - ${questTitle}\n`;
        if (firstQuest.tasks && typeof firstQuest.tasks === 'object') {
          Object.entries(firstQuest.tasks).forEach(([taskKey, taskVal]) => {
            if (taskKey === 'metadata') return;
            const taskDesc = taskVal.desc || taskVal.description || taskVal.name || '';
            
            // For the first task (T1), add a clickable link to issue #1
            if (taskKey === 'T1') {
              progressSection += `  - ${taskKey} - ${taskDesc} [[Click here to start](https://github.com/${process.env.GITHUB_ORG}/REPO_NAME/issues/1)]\n`;
            } else {
              progressSection += `  - ${taskKey} - ${taskDesc}\n`;
            }
          });
        }
      }

      progressSection += `\n### ✅ Completed Quests\n\n- None yet\n`;

      // Append the section only if it's not already present
      if (readmeContent) {
        if (!readmeContent.includes('### 🕒 Progress Update')) {
          readmeContent += progressSection;
        }
      } else {
        // Initialize README content if it was null and add progress section
        readmeContent = progressSection;
      }
    }

    // 3. Check if this is the default quest-sequence.json
    const isDefaultSequence = sequenceFile === 'quest-sequence.json';
    let groupId = null;
    let questConfigTemplate = null;
    if (!isDefaultSequence) {
      // Generate the quest config template but don't save it yet
      // Each repo will get its own unique copy
      const templateGroupId = `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      questConfigTemplate = generateCustomQuestConfig(customSequenceData, templateGroupId);
      console.log(`✅ Generated quest config template for custom sequence`);
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
      let repoResponse = null; // Declare outside try-catch
      let repoName, dbUser, groupId; // Declare variables outside try-catch
      
      try {
        // Use strictly username-class format for repo and dbUser
        dbUser = `${user}-${repoIdentifier}`;
        repoName = `${user}-${repoIdentifier}`;
        groupId = classId; // Set groupId for later use
        const repoDescription = `Repository for ${user} in ${className}`;
        
        console.log(`📝 [createCustomRepos] Creating repo: ${repoName} (dbUser: ${dbUser})`);
        
        // Create the repository
        try {
            console.log(`🚀 [REPO-CREATION] Creating repository: ${process.env.GITHUB_ORG}/${repoName}`);
            repoResponse = await orgOctokit.repos.createInOrg({
              org: process.env.GITHUB_ORG,
              name: repoName,
              description: repoDescription,
              private: true,
              auto_init: readmeContent ? false : true, // Don't auto-init if we have custom README
              gitignore_template: readmeContent ? null : "Node" // Don't use template if we're manually creating files
            });
            console.log(`✅ [REPO-CREATION] Repository created successfully: ${process.env.GITHUB_ORG}/${repoName}`);
        } catch (repoError) {
            console.error(`❌ [REPO-CREATION] Failed to create repository ${repoName}:`, repoError.message);
            if (repoError.response?.data) {
                console.error(`❌ [REPO-CREATION] GitHub API error:`, repoError.response.data);
            }
            throw new Error(`Failed to create repository: ${repoError.message}`);
        }
        
        // Add original user as collaborator
        try {
            console.log(`👥 [COLLABORATOR] Adding ${user} as collaborator to ${repoName}`);
            await orgOctokit.repos.addCollaborator({
              owner: process.env.GITHUB_ORG,
              repo: repoName,
              username: user,
              permission: "push"
            });
            console.log(`✅ [COLLABORATOR] User ${user} added as collaborator to ${repoName}`);
        } catch (collabError) {
            console.error(`❌ [COLLABORATOR] Failed to add ${user} as collaborator to ${repoName}:`, collabError.message);
            // Continue even if collaborator addition fails
        }

        // Add all admins as collaborators
        try {
            console.log(`👥 [ADMIN-COLLABORATORS] Fetching admins for class ${classId}`);
            const group = await Group.findById(classId);
            
            if (group && group.admins && group.admins.length > 0) {
                console.log(`👥 [ADMIN-COLLABORATORS] Found ${group.admins.length} admins to add to ${repoName}`);
                
                for (const admin of group.admins) {
                    try {
                        console.log(`👥 [ADMIN-COLLABORATORS] Adding admin ${admin.githubUsername} to ${repoName}`);
                        await orgOctokit.repos.addCollaborator({
                            owner: process.env.GITHUB_ORG,
                            repo: repoName,
                            username: admin.githubUsername,
                            permission: "push"  // Same permission as students
                        });
                        console.log(`✅ [ADMIN-COLLABORATORS] Admin ${admin.githubUsername} added as collaborator to ${repoName}`);
                        
                        // Small delay to avoid rate limiting
                        await new Promise(resolve => setTimeout(resolve, 100));
                    } catch (adminCollabError) {
                        console.error(`❌ [ADMIN-COLLABORATORS] Failed to add admin ${admin.githubUsername} to ${repoName}:`, adminCollabError.message);
                        // Continue with other admins even if one fails
                    }
                }
            } else {
                console.log(`ℹ️ [ADMIN-COLLABORATORS] No admins found for class ${classId} or group not found`);
            }
        } catch (adminError) {
            console.error(`❌ [ADMIN-COLLABORATORS] Error fetching/adding admins for ${repoName}:`, adminError.message);
            // Don't fail the whole operation if admin addition fails
        }

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
            
            // Replace REPO_NAME placeholder with actual repository name
            let finalReadmeContent = readmeContent.replace(/REPO_NAME/g, repoName);
            console.log(`🔧 [createCustomRepos] Replaced REPO_NAME placeholder with: ${repoName}`);
            
            const base64Content = Buffer.from(finalReadmeContent).toString('base64');
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
            
            // Also create .gitignore since we didn't auto-init
            try {
              console.log(`📁 [createCustomRepos] Creating .gitignore file...`);
              const gitignoreContent = `# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Directory for instrumented libs generated by jscoverage/JSCover
lib-cov

# Coverage directory used by tools like istanbul
coverage/

# nyc test coverage
.nyc_output

# Grunt intermediate storage (http://gruntjs.com/creating-plugins#storing-task-files)
.grunt

# Bower dependency directory (https://bower.io/)
bower_components

# node-waf configuration
.lock-wscript

# Compiled binary addons (https://nodejs.org/api/addons.html)
build/Release

# Dependency directories
node_modules/
jspm_packages/

# TypeScript v1 declaration files
typings/

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env

# parcel-bundler cache (https://parceljs.org/)
.cache
.parcel-cache

# next.js build output
.next

# nuxt.js build output
.nuxt

# vuepress build output
.vuepress/dist

# Serverless directories
.serverless`;

              await orgOctokit.repos.createOrUpdateFileContents({
                owner: process.env.GITHUB_ORG,
                repo: repoName,
                path: ".gitignore",
                message: "Add .gitignore file",
                content: Buffer.from(gitignoreContent).toString('base64'),
                branch: "main"
              });
              console.log(`✅ [createCustomRepos] .gitignore file created successfully`);
            } catch (gitignoreError) {
              console.log(`⚠️ [createCustomRepos] Failed to create .gitignore file:`, gitignoreError.message);
              // Continue even if .gitignore creation fails
            }
            
          } catch (readmeError) {
            console.error(`❌ [README-UPLOAD] Failed to upload README to ${repoName}:`, readmeError.message);
            if (readmeError.response?.data) {
                console.error(`❌ [README-UPLOAD] GitHub API error:`, readmeError.response.data);
            }
            // Continue even if README upload fails
          }
        } else {
          console.log(`📝 [createCustomRepos] ===== README SKIPPED =====`);
          console.log(`📝 [createCustomRepos] No README content available for ${repoName}`);
          console.log(`📝 [createCustomRepos] Reason: readmeContent is ${readmeContent === null ? 'null' : readmeContent === undefined ? 'undefined' : 'empty'}`);
          console.log(`📝 [createCustomRepos] Repository will be created without README from class setup`);
        }

        // Create user in OSS-Doorway database if they don't exist (using dbUser)
        try {
            console.log('💾 [DB-CONNECTION] Connecting to OSS-Doorway database...');
            await createUserInOSSDoorwayDB(dbUser, user, groupId, sequenceFile, isDefaultSequence);
            console.log('✅ [DB-CONNECTION] User created/updated in OSS-Doorway database');
        } catch (dbError) {
            console.error('❌ [DB-CONNECTION] Failed to create user in OSS-Doorway database:', dbError);
            // Continue with repository creation even if database fails
        }
        
        // Get user data (either newly created or existing)
        // Connect to OSS-Doorway DB to update user data
        let repoUniqueGroupId = null; // Declare this in higher scope for issue creation
        try {
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
                // Create a unique quest config for this specific repo
                const uniqueGroupId = `repo_${user}_${repoIdentifier}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                repoUniqueGroupId = uniqueGroupId; // Store in higher scope for issue creation
                
                // Create a deep copy of the quest config template for this repo
                const repoQuestConfig = JSON.parse(JSON.stringify(questConfigTemplate));
                
                // Update the groupId in the config to match this repo's unique ID
                if (repoQuestConfig.map_repo_link) {
                  // Keep the original map_repo_link, but ensure quest metadata uses unique groupId
                  Object.keys(repoQuestConfig).forEach(questKey => {
                    if (questKey !== 'map_repo_link' && repoQuestConfig[questKey].metadata) {
                      repoQuestConfig[questKey].metadata.groupId = uniqueGroupId;
                    }
                  });
                }
                
                // Save the unique quest config for this repo (both file system and database)
                await saveQuestConfig(uniqueGroupId, repoQuestConfig, {
                  classId: classId,
                  createdBy: user,
                  originalFilePath: `quest_config_${uniqueGroupId}.json`
                });
                
                console.log(`🔍 [QUEST-CONFIG-REPO] Created unique quest config for ${repoName}: ${uniqueGroupId}`);
                
                // Store the unique groupId in the user's database entry
                userDoc.user_data.customGroupId = uniqueGroupId;
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
                  // Use the unique groupId that was created for this specific repo
                  const uniqueGroupId = repoUniqueGroupId;
                  const groupConfigPath = path.join(__dirname, '../../../OSS-Doorway/src/config/generated', `quest_config_${uniqueGroupId}.json`);
                  questConfig = fs.existsSync(groupConfigPath)
                    ? JSON.parse(fs.readFileSync(groupConfigPath, 'utf8'))
                    : {};
                  console.log(`🔍 [QUEST-CONFIG-LOAD] Loading quest config for ${repoName}: ${groupConfigPath}`);
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
        } catch (userDataError) {
            console.error('❌ [USER-DATA] Failed to update user data:', userDataError);
            // Continue even if user data update fails
        }
        
        // Find the first quest (no prerequisite or isQ0)
        try {
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
                // Use the unique groupId for this specific repo
                const uniqueGroupId = repoUniqueGroupId;
                groupConfigPath = path.join(__dirname, '../../../OSS-Doorway/src/config/generated', `quest_config_${uniqueGroupId}.json`);
                if (fs.existsSync(groupConfigPath)) {
                  questConfig = JSON.parse(fs.readFileSync(groupConfigPath, 'utf8'));
                  console.log(`🔍 [QUEST-CONFIG-LOAD] Loaded quest config for repo ${repoName}: ${groupConfigPath}`);
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
                  // Generate class title for the issue
                  const classTitle = (className || groupName || "Class")
                    .replace(/[^a-zA-Z0-9]+/g, '')
                    .replace(/^-+|-+$/g, '');
                  // Find quest number from questId (e.g., Q1, Q2, ...)
                  let questNumber = 1;
                  const questIdMatch = firstQuest.questId && firstQuest.questId.match(/Q(\d+)/i);
                  if (questIdMatch) questNumber = parseInt(questIdMatch[1], 10);
                  // Always T1 for first task
                  const issueTitle = `${classTitle}-Q${questNumber} T1: ${task.desc}`;
                  await orgOctokit.issues.create({
                    owner: process.env.GITHUB_ORG,
                    repo: repoName,
                    title: issueTitle,
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
        } catch (issueError) {
            console.error('❌ [ISSUE-CREATION] Failed to create first quest issue:', issueError);
            // Continue even if issue creation fails
        }
        results.successful.push({ 
          user, 
          repoName, 
          dbUser, 
          groupId, 
          repoUrl: repoResponse ? repoResponse.data.html_url : `https://github.com/${process.env.GITHUB_ORG}/${repoName}` 
        });
      } catch (error) {
        console.error(`❌ [REPO-CREATION] Failed to create repo for ${user}:`, error);
        console.error(`❌ [REPO-CREATION] Error details:`, {
          message: error.message,
          stack: error.stack,
          response: error.response?.data,
          status: error.response?.status,
          statusText: error.response?.statusText
        });
        results.unsuccessful.push({ user, error: error.message, details: error.response?.data || "No additional details" });
      }
    }
    res.status(200).json({ message: "Custom repository creation process completed", results });
  } catch (error) {
    console.error("❌ [MAIN-ERROR] Error in createCustomRepos:", error);
    console.error("❌ [MAIN-ERROR] Error details:", {
      message: error.message,
      stack: error.stack,
      response: error.response?.data,
      status: error.response?.status,
      statusText: error.response?.statusText
    });
    res.status(500).json({ 
      message: "Error creating custom repositories", 
      error: error.message, 
      details: error.response?.data || "No additional details available",
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
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

// Delete repository function (replicates OSS-Doorway del_repo command)
const deleteRepository = async (req, res) => {
    try {
        const { organizationGh, repoName } = req.body;
        
        console.log(`🗑️ [deleteRepository] Attempting to delete repository: ${repoName} in organization: ${organizationGh}`);
        
        if (!organizationGh || !repoName) {
            return res.status(400).json({
                success: false,
                message: 'Organization name and repository name are required'
            });
        }

        // --- BEGIN orgOctokit initialization (same as createCustomRepos) ---
        // Import Octokit modules dynamically
        const { Octokit } = await import('@octokit/rest');
        const { createAppAuth } = await import('@octokit/auth-app');

        // Create GitHub App instance using OSS-Doorway's credentials
        let privateKey = process.env.OSS_DOORWAY_PRIVATE_KEY;
        // Convert \n characters to actual newlines if they exist
        if (privateKey && privateKey.includes('\\n')) {
            privateKey = privateKey.replace(/\\n/g, '\n');
        }
        
        const auth = createAppAuth({
            appId: process.env.OSS_DOORWAY_APP_ID,
            privateKey: privateKey,
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

        // First, check if the repository exists
        try {
            await orgOctokit.repos.get({
                owner: organizationGh,
                repo: repoName
            });
            console.log(`✅ [deleteRepository] Repository ${repoName} found, proceeding with deletion`);
        } catch (repoError) {
            if (repoError.status === 404) {
                return res.status(404).json({
                    success: false,
                    message: `Repository ${repoName} not found in organization ${organizationGh}`
                });
            }
            throw repoError;
        }
        
        // Delete the repository using Octokit (same method as createCustomRepos)
        try {
            await orgOctokit.repos.delete({
                owner: organizationGh,
                repo: repoName
            });

            console.log(`✅ [deleteRepository] Repository ${repoName} deleted successfully`);
            
            res.status(200).json({
                success: true,
                message: `Repository ${repoName} deleted successfully in organization ${organizationGh}`,
                data: {
                    repoName,
                    organizationGh,
                    deletedAt: new Date().toISOString()
                }
            });
            
        } catch (deleteError) {
            console.error(`❌ [deleteRepository] GitHub API delete error:`, deleteError);
            
            // Check if it's a permissions error
            if (deleteError.status === 403) {
                return res.status(403).json({
                    success: false,
                    message: `Permission denied: GitHub App does not have permission to delete repositories. Please ensure the GitHub App has 'administration' permission set to 'write' or higher.`,
                    error: deleteError.message,
                    solution: "Update GitHub App permissions in the organization settings"
                });
            }
            
            // Check if it's a 404 (already deleted)
            if (deleteError.status === 404) {
                return res.status(200).json({
                    success: true,
                    message: `Repository ${repoName} was already deleted or does not exist`,
                    data: {
                        repoName,
                        organizationGh,
                        deletedAt: new Date().toISOString()
                    }
                });
            }
            
            throw deleteError;
        }
        
    } catch (error) {
        console.error(`❌ [deleteRepository] Error deleting repository:`, error);
        
        res.status(500).json({
            success: false,
            message: `Error deleting repository: ${error.message}`,
            error: error.message
        });
    }
};

// Helper function to save quest config to both file system and database
async function saveQuestConfig(configId, config, metadata = {}) {
    const isProduction = process.env.NODE_ENV === 'production' || process.env.RAILWAY_ENVIRONMENT;
    
    // Always save to database (OSS-Doorway bot DB)
    try {
        const mongoose = require('mongoose');
        const ossDoorwayURI = process.env.OSS_DOORWAY_DB_URI;
        const ossDoorwayDBName = process.env.OSS_DOORWAY_DB_NAME;
        if (!ossDoorwayURI || !ossDoorwayDBName) {
            throw new Error('OSS_DOORWAY_DB_URI or OSS_DOORWAY_DB_NAME is not set');
        }
        const connection = mongoose.createConnection(`${ossDoorwayURI}/${ossDoorwayDBName}`);
        const QuestConfigModel = connection.models.QuestConfig || connection.model('QuestConfig', QuestConfig.schema);

        const updateData = { config, updatedAt: new Date(), ...metadata };
        await QuestConfigModel.findOneAndUpdate(
            { configId },
            { $set: updateData },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        console.log(`📁 [QUEST-CONFIG-DB] Saved quest config to OSS-Doorway DB: ${configId}`);
    } catch (dbError) {
        console.error(`❌ [QUEST-CONFIG-DB] Failed to save to database:`, dbError);
        // In production, database failure is critical
        if (isProduction) {
            throw dbError;
        }
    }
    
    // In development, also save to file system for backward compatibility
    if (!isProduction) {
        try {
            const path = require('path');
            const fs = require('fs');
            const generatedDir = path.join(__dirname, '../../../OSS-Doorway/src/config/generated');
            
            // Ensure directory exists
            if (!fs.existsSync(generatedDir)) {
                fs.mkdirSync(generatedDir, { recursive: true });
            }
            
            const filePath = path.join(generatedDir, `quest_config_${configId}.json`);
            fs.writeFileSync(filePath, JSON.stringify(config, null, 2));
            console.log(`📁 [QUEST-CONFIG-FILE] Saved quest config to file: ${filePath}`);
        } catch (fileError) {
            console.error(`⚠️ [QUEST-CONFIG-FILE] Failed to save to file (non-critical in dev):`, fileError);
        }
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
    getStudentScores,
    deleteRepository
};
