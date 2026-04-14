const { getGithubAppInstallationAccessToken } = require('./githubAppAuth');
const axios = require('axios');

// Self-contained gamification controller - no external dependencies
console.log('🎯 BOT: Initializing self-contained gamification controller...');

const createRepos = async (req, res) => {
    try {
        const { org, users, groupId, className } = req.body;
        
        console.log('🎯 BOT: createRepos called with:', { org, users, groupId, className });
        
        if (!org || !users || !Array.isArray(users)) {
            return res.status(400).json({ 
                error: "Invalid request. Required: org, users array" 
            });
        }

        // Get GitHub access token
        const githubToken = await getGithubAppInstallationAccessToken();
        
        // Format class name for repository naming
        const formattedClassName = className
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
        
        console.log('🎯 BOT: Formatted class name:', formattedClassName);

        const results = {
            successful: [],
            unsuccessful: []
        };

        // Process each user individually to create their complete repository
        for (const username of users) {
            try {
                console.log(`🎯 BOT: Creating repository for user: ${username}`);
                
                // Create repository name using username-classname pattern
                const repoName = `${username}-${formattedClassName}`;
                console.log(`🎯 BOT: Repository name: ${repoName}`);
                
                // Step 1: Create the repository
                console.log(`🎯 BOT: Step 1 - Creating repository ${org}/${repoName}`);
                const repoResponse = await axios.post(
                    `https://api.github.com/orgs/${org}/repos`,
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
                console.log(`✅ BOT: Repository created: ${org}/${repoName}`);
                
                // Step 2: Add user as collaborator
                console.log(`🎯 BOT: Step 2 - Adding ${username} as collaborator`);
                await axios.put(
                    `https://api.github.com/repos/${org}/${repoName}/collaborators/${username}`,
                    { permission: "triage" },
                    {
                        headers: {
                            Authorization: `Bearer ${githubToken}`,
                            Accept: 'application/vnd.github.v3+json',
                        }
                    }
                );
                console.log(`✅ BOT: Collaborator added: ${username} to ${org}/${repoName}`);
                
                // Step 3: Add README file
                console.log(`🎯 BOT: Step 3 - Adding README file`);
                const readmeContent = `# 🎓 ${className} - OSS Management Course

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

                await axios.put(
                    `https://api.github.com/repos/${org}/${repoName}/contents/README.md`,
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
                console.log(`✅ BOT: README file added to ${org}/${repoName}`);
                
                // Step 4: Create initial setup issue to trigger quest system
                console.log(`🎯 BOT: Step 4 - Creating setup issue to trigger quest system`);
                const setupIssueResponse = await axios.post(
                    `https://api.github.com/repos/${org}/${repoName}/issues`,
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

                // Add /new_user comment to trigger OSS-Doorway quest system
                await axios.post(
                    `https://api.github.com/repos/${org}/${repoName}/issues/${setupIssueResponse.data.number}/comments`,
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

                // Close the setup issue to trigger the OSS-Doorway quest system
                await axios.patch(
                    `https://api.github.com/repos/${org}/${repoName}/issues/${setupIssueResponse.data.number}`,
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

                console.log(`✅ BOT: Quest system trigger completed for ${username}`);
                
                results.successful.push({
                    user: username,
                    repoName: repoName,
                    repoUrl: `https://github.com/${org}/${repoName}`,
                    status: 'success',
                    message: 'Repository created successfully'
                });
                
            } catch (error) {
                console.error(`❌ BOT: Error creating repository for ${username}:`, error);
                results.unsuccessful.push({
                    user: username,
                    error: error.message,
                    details: 'Repository creation failed',
                    status: 'error'
                });
            }
        }
        
        console.log('✅ BOT: createRepos completed:', results);
        
        res.status(200).json({ 
            success: true, 
            message: `Repository creation complete. Successful: ${results.successful.length}. Failed: ${results.unsuccessful.length}`,
            data: {
                org,
                users,
                groupId,
                className,
                results
            }
        });
    } catch (error) {
        console.error('❌ BOT: Error in createRepos:', error);
        res.status(500).json({ 
            error: "Error creating repositories", 
            details: error.message 
        });
    }
};

module.exports = {
    createRepos
}; 