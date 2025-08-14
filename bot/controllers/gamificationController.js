const { getGithubAppInstallationAccessToken } = require('./githubAppAuth');
const axios = require('axios');

// Initialize database connection and gamification functions
let gameFunction;
let db;

const initializeModules = async () => {
    try {
        // Try to import the gamification module, but handle missing config files gracefully
        console.log('🎯 BOT: Attempting to load real gamification module...');
        console.log('🎯 BOT: Current working directory:', process.cwd());
        console.log('🎯 BOT: Import path: ../../OSS-Doorway/src/gamification.js');
        
        // Fix the import path to correctly point to OSS-Doorway
        const gamificationModule = await import("../../../OSS-Doorway/src/gamification.js");
        console.log('✅ BOT: Gamification module loaded successfully');
        console.log('✅ BOT: Available exports:', Object.keys(gamificationModule));
        
        const databaseModule = await import("../../../OSS-Doorway/src/database.js");
        console.log('✅ BOT: Database module loaded successfully');
        
        gameFunction = gamificationModule.gameFunction;
        console.log('✅ BOT: gameFunction extracted:', typeof gameFunction);
        console.log('✅ BOT: gameFunction methods:', Object.keys(gameFunction || {}));
        
        const MongoDB = databaseModule.MongoDB;
        db = new MongoDB();
        
        console.log('✅ Bot gamification modules initialized successfully');
        console.log('✅ Using REAL gamification module with Q0-Q3 quests');
    } catch (error) {
        console.error('❌ Error initializing bot gamification modules:', error);
        console.error('❌ Error details:', error.message);
        console.error('❌ Error stack:', error.stack);
        
        // Create a fallback implementation that doesn't require config files
        console.log('🔄 Creating fallback gamification implementation...');
        
        // Simple fallback createRepos function that mimics the real bot behavior
        gameFunction = {
            createRepos: async (context, org, users, db) => {
                console.log('🎯 FALLBACK: Creating quest setup for users:', users);
                
                const results = {
                    successful: [],
                    unsuccessful: []
                };
                
                for (const username of users) {
                    try {
                        // Create a setup issue in the user's repo (same as real bot)
                        // Use the repo name from the context (which should be className-username format)
                        const repoName = context.repo().repo;
                        
                        console.log(`🔍 FALLBACK: Creating setup issue in ${org}/${repoName}`);
                        
                        // Create the setup issue
                        const issueResponse = await context.octokit.issues.create({
                            owner: org,
                            repo: repoName,
                            title: "New User Setup",
                            body: "Setting up new user repository with quest system.",
                        });
                        
                        console.log(`✅ FALLBACK: Created setup issue #${issueResponse.data.number} for ${username}`);
                        
                        // Add the /new_user comment to trigger quest setup (this is the key!)
                        await context.octokit.issues.createComment({
                            owner: org,
                            repo: repoName,
                            issue_number: issueResponse.data.number,
                            body: `/new_user ${username}`,
                        });
                        
                        console.log(`✅ FALLBACK: Added /new_user comment for ${username}`);
                        
                        // Close the setup issue to trigger the quest system
                        await context.octokit.issues.update({
                            owner: org,
                            repo: repoName,
                            issue_number: issueResponse.data.number,
                            state: "closed",
                        });
                        
                        console.log(`✅ FALLBACK: Closed setup issue for ${username} - quest system should now be triggered`);
                        
                        results.successful.push({
                            user: username,
                            repoName: `${username}-${className}`,
                            repoUrl: `https://github.com/${org}/${username}-${className}`,
                            status: 'success',
                            message: 'Quest setup completed successfully'
                        });
                        console.log(`✅ FALLBACK: Quest setup completed for ${username}`);
                    } catch (error) {
                        console.error(`❌ FALLBACK: Error setting up quest system for ${username}:`, error);
                        results.unsuccessful.push({
                            user: username,
                            error: error.message,
                            details: 'Quest setup failed',
                            status: 'error'
                        });
                    }
                }
                
                return `Fallback quest setup complete. Successful: ${results.successful.join(', ')}. Failed: ${results.unsuccessful.join(', ')}`;
            }
        };
        
        // Create a simple database connection
        try {
            const { MongoDB } = await import("../../../OSS-Doorway/src/database.js");
            db = new MongoDB();
            console.log('✅ Fallback database connection established');
        } catch (dbError) {
            console.error('❌ Could not establish database connection:', dbError);
            // Create a mock database object
            db = {
                userExists: async () => false,
                downloadUserData: async () => ({}),
                uploadUserData: async () => true
            };
        }
        
        console.log('✅ Fallback gamification implementation ready');
    }
};

// Initialize modules when this file is loaded
initializeModules();

const createRepos = async (req, res) => {
    try {
        // Ensure modules are initialized
        if (!gameFunction || !db) {
            await initializeModules();
        }
        
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
        
        // Create a real GitHub context that can make API calls
        const createGitHubContext = (org, repoName) => ({
            octokit: {
                users: {
                    getByUsername: async ({ username }) => {
                        const response = await axios.get(
                            `https://api.github.com/users/${username}`,
                            {
                                headers: {
                                    Authorization: `Bearer ${githubToken}`,
                                    Accept: 'application/vnd.github.v3+json',
                                }
                            }
                        );
                        return { status: response.status, data: response.data };
                    }
                },
                repos: {
                    createInOrg: async ({ org, name, private: isPrivate, auto_init }) => {
                        console.log(`🎯 BOT: Creating repository ${org}/${name}`);
                        const response = await axios.post(
                            `https://api.github.com/orgs/${org}/repos`,
                            {
                                name,
                                private: isPrivate,
                                auto_init: auto_init || true
                            },
                            {
                                headers: {
                                    Authorization: `Bearer ${githubToken}`,
                                    Accept: 'application/vnd.github.v3+json',
                                }
                            }
                        );
                        console.log(`✅ BOT: Repository created: ${org}/${name}`);
                        return { data: response.data };
                    },
                    addCollaborator: async ({ owner, repo, username, permission }) => {
                        console.log(`🎯 BOT: Adding collaborator ${username} to ${owner}/${repo}`);
                        const response = await axios.put(
                            `https://api.github.com/repos/${owner}/${repo}/collaborators/${username}`,
                            { permission },
                            {
                                headers: {
                                    Authorization: `Bearer ${githubToken}`,
                                    Accept: 'application/vnd.github.v3+json',
                                }
                            }
                        );
                        console.log(`✅ BOT: Collaborator added: ${username} to ${owner}/${repo}`);
                        return { status: response.status };
                    },
                    createOrUpdateFileContents: async ({ owner, repo, path, message, content, committer, author }) => {
                        console.log(`🎯 BOT: Creating/updating file ${path} in ${owner}/${repo}`);
                        const response = await axios.put(
                            `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
                            {
                                message,
                                content: Buffer.from(content).toString('base64'),
                                committer,
                                author
                            },
                            {
                                headers: {
                                    Authorization: `Bearer ${githubToken}`,
                                    Accept: 'application/vnd.github.v3+json',
                                }
                            }
                        );
                        console.log(`✅ BOT: File created/updated: ${path} in ${owner}/${repo}`);
                        return { status: response.status };
                    }
                },
                issues: {
                    create: async ({ owner, repo, title, body, labels }) => {
                        console.log(`🎯 BOT: Creating issue "${title}" in ${owner}/${repo}`);
                        const response = await axios.post(
                            `https://api.github.com/repos/${owner}/${repo}/issues`,
                            { title, body, labels },
                            {
                                headers: {
                                    Authorization: `Bearer ${githubToken}`,
                                    Accept: 'application/vnd.github.v3+json',
                                }
                            }
                        );
                        console.log(`✅ BOT: Issue created: "${title}" in ${owner}/${repo}`);
                        return { data: response.data };
                    },
                    createComment: async ({ owner, repo, issue_number, body }) => {
                        console.log(`🎯 BOT: Creating comment on issue #${issue_number} in ${owner}/${repo}`);
                        const response = await axios.post(
                            `https://api.github.com/repos/${owner}/${repo}/issues/${issue_number}/comments`,
                            { body },
                            {
                                headers: {
                                    Authorization: `Bearer ${githubToken}`,
                                    Accept: 'application/vnd.github.v3+json',
                                }
                            }
                        );
                        console.log(`✅ BOT: Comment created on issue #${issue_number} in ${owner}/${repo}`);
                        return { status: response.status };
                    },
                    update: async ({ owner, repo, issue_number, state }) => {
                        console.log(`🎯 BOT: Updating issue #${issue_number} state to ${state} in ${owner}/${repo}`);
                        const response = await axios.patch(
                            `https://api.github.com/repos/${owner}/${repo}/issues/${issue_number}`,
                            { state },
                            {
                                headers: {
                                    Authorization: `Bearer ${githubToken}`,
                                    Accept: 'application/vnd.github.v3+json',
                                }
                            }
                        );
                        console.log(`✅ BOT: Issue #${issue_number} state updated to ${state} in ${owner}/${repo}`);
                        return { status: response.status };
                    }
                }
            },
            repo: () => ({ owner: org, repo: repoName }),
            issue: () => ({ issue_number: 1 })
        });

        const results = {
            successful: [],
            unsuccessful: []
        };

        // Process each user individually to create their complete repository and quest system
        for (const username of users) {
            try {
                console.log(`🎯 BOT: Creating complete repository and quest system for user: ${username}`);
                
                // Create repository name using new username-classname pattern
                const repoName = `${username}-${formattedClassName}`;
                console.log(`🎯 BOT: Repository name: ${repoName}`);
                
                // Step 1: Create the repository
                console.log(`🎯 BOT: Step 1 - Creating repository ${org}/${repoName}`);
                await axios.post(
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
                
                // Step 4: Create context and call gamification createRepos (same as /create_repos)
                console.log(`🎯 BOT: Step 4 - Setting up quest system (same as /create_repos)`);
                const context = createGitHubContext(org, repoName);
                
                // Call the gamification createRepos function for this single user
                const result = await gameFunction.createRepos(context, org, [username], db);
                
                console.log(`✅ BOT: Quest system created for ${username}:`, result);
                results.successful.push({
                    user: username,
                    repoName: repoName,
                    repoUrl: `https://github.com/${org}/${repoName}`,
                    status: 'success',
                    message: 'Repository and quest system created successfully'
                });
                
            } catch (error) {
                console.error(`❌ BOT: Error creating repository and quest system for ${username}:`, error);
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
            message: `Repository and quest system creation complete. Successful: ${results.successful.join(', ')}. Failed: ${results.unsuccessful.join(', ')}`,
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
            error: "Error creating repositories with quest system", 
            details: error.message 
        });
    }
};

module.exports = {
    createRepos
}; 