const axios = require('axios');
const { Buffer } = require('buffer');
const { getGithubAppInstallationAccessToken } = require('./githubAppAuth');

const handleWebhook = async (req, res) => {
    try {
        const event = req.headers["x-github-event"];
        const payload = req.body;

        console.log('Received GitHub Webhook Event:', event);
        console.log('Payload:', JSON.stringify(payload, null, 2));

        if (event === "issue_comment") {
            console.log('Processing issue comment...');
            
            res.status(200).json({
                message: "Webhook processed successfully.",
            });
        } else {
            res.status(200).json({ message: "Event ignored." });
        }
    } catch (error) {
        console.error("Error processing webhook:", error.message);
        res.status(500).json({ error: error.message });
    }
};

const createRepo = async (req, res) => {
    const {org, repoName, repoDescription, privateRepo} = req.body;
    
    try {
        const githubToken = await getGithubAppInstallationAccessToken();
        const apiResponse = await axios.post(
            `https://api.github.com/orgs/${org}/repos`,
            {
                name: repoName,
                description: repoDescription,
                private: privateRepo
            },
            {
                headers: {
                    Authorization: `Bearer ${githubToken}`,
                    Accept: 'application/vnd.github.v3+json',
                }
            }
        );

        res.status(201).json(apiResponse.data);
    } catch (error) {
        console.error("Error creating issue:", error);
        res.status(500).json({ error: error.message });
    }
};

const dropRepo = async (req, res) => {
    const { org, repoName } = req.params;
    try {
        const githubToken = await getGithubAppInstallationAccessToken();
        const apiResponse = await axios.delete(
            `https://api.github.com/repos/${org}/${repoName}`,
            {
                headers: {
                    Authorization: `Bearer ${githubToken}`,
                    Accept: 'application/vnd.github.v3+json',
                },
            }
        );

        res.status(204).send();
    } catch (error) {
        console.error("Error deleting repository:", error.message);
        res.status(500).json({ error: error.message });
    }
};

const addUserToProject = async (req, res) => {
    const { org, repoName, username, role } = req.body;
    
    try {
        const githubToken = await getGithubAppInstallationAccessToken();
        const apiResponse = await axios.put(
            `https://api.github.com/repos/${org}/${repoName}/collaborators/${username}`,
            {
                permission: role, // Options: "pull" (read), "push" (write), "admin"
            },
            {
                headers: {
                    Authorization: `Bearer ${githubToken}`,
                    Accept: 'application/vnd.github.v3+json',
                },
            }
        );

        res.status(200).json(apiResponse.data);
    } catch (error) {
        console.error("Error adding user to repository:", error.message);
        res.status(500).json({ error: error.message });
    }
};

const createIssueInProject = async (req, res) => {
    const { org, repoName, title, body } = req.body;
    
    try {
        const githubToken = await getGithubAppInstallationAccessToken();
        const apiResponse = await axios.post(
            `https://api.github.com/repos/${org}/${repoName}/issues`,
            {
                title,
                body,
            },
            {
                headers: {
                    Authorization: `Bearer ${githubToken}`,
                    Accept: 'application/vnd.github.v3+json',
                },
            }
        );
        
        res.status(200).json(apiResponse.data);
    } catch (error) {
        console.error("Error creating issue in repository:", error.message);
        res.status(500).json({ error: error.message });
    }
};

const createCommentInIssue = async (req, res) => {
    const { org, repoName, issueNumber, commentBody } = req.body;
    try {
        const githubToken = await getGithubAppInstallationAccessToken();
        const apiResponse = await axios.post(
            `https://api.github.com/repos/${org}/${repoName}/issues/${issueNumber}/comments`,
            {
                body: commentBody,
            },
            {
                headers: {
                    Authorization: `Bearer ${githubToken}`,
                    Accept: 'application/vnd.github.v3+json',
                },
            }
        );

        res.status(200).json(apiResponse.data);
    } catch (error) {
        console.error("Error creating comment on issue:", error.message);
        res.status(500).json({ error: error.message });
    }
};

const closeIssue = async (req, res) => {
    const { org, repoName, issueNumber } = req.body;

    try {
        const githubToken = await getGithubAppInstallationAccessToken();
        
        const apiResponse = await axios.patch(
            `https://api.github.com/repos/${org}/${repoName}/issues/${issueNumber}`,
            { state: 'closed' },
            {
                headers: {
                    Authorization: `Bearer ${githubToken}`,
                    Accept: 'application/vnd.github.v3+json',
                },
            }
        );

        res.status(200).json(apiResponse.data);
    } catch (error) {
        console.error("Error closing the issue:", error.message);
        res.status(500).json({ error: error.message });
    }
};

const commitFile = async (req, res) => {
    const { org, repoName, filePath, fileContent, commitMessage, branch = 'main' } = req.body;

    try {
        const githubToken = await getGithubAppInstallationAccessToken();
        let fileSHA = null;

        // Log when committing README files specifically
        if (filePath.toLowerCase() === 'readme.md') {
            console.log(`📝 README COMMIT: Calling GitHub API to commit README.md to ${org}/${repoName}`);
            console.log(`📄 README COMMIT: File size: ${fileContent.length} characters`);
            console.log(`🔗 README COMMIT: Branch: ${branch}, Message: "${commitMessage}"`);
        }

        try {
            const fileResponse = await axios.get(
                `https://api.github.com/repos/${org}/${repoName}/contents/${filePath}?ref=${branch}`,
                {
                    headers: {
                        Authorization: `Bearer ${githubToken}`,
                        Accept: 'application/vnd.github.v3+json',
                    },
                }
            );
            fileSHA = fileResponse.data.sha;
            if (filePath.toLowerCase() === 'readme.md') {
                console.log(`📝 README COMMIT: File exists, will update (SHA: ${fileSHA.substring(0, 8)}...)`);
            }
        } catch (error) {
            if (error.response && error.response.status !== 404) { throw error; }
            if (filePath.toLowerCase() === 'readme.md') {
                console.log(`📝 README COMMIT: File does not exist, will create new README.md`);
            }
        }

        const apiResponse = await axios.put(
            `https://api.github.com/repos/${org}/${repoName}/contents/${filePath}`,
            {
                message: commitMessage,
                content: Buffer.from(fileContent).toString('base64'),
                sha: fileSHA, 
                branch: branch,
            },
            {
                headers: {
                    Authorization: `Bearer ${githubToken}`,
                    Accept: 'application/vnd.github.v3+json',
                },
            }
        );

        if (filePath.toLowerCase() === 'readme.md') {
            console.log(`✅ README COMMIT: Successfully committed README.md to ${org}/${repoName}`);
            console.log(`🔗 README COMMIT: GitHub URL: ${apiResponse.data.content.html_url}`);
        }

        res.status(200).json(apiResponse.data);
    } catch (error) {
        if (filePath.toLowerCase() === 'readme.md') {
            console.error(`❌ README COMMIT: Failed to commit README.md to ${org}/${repoName}:`, error.message);
        }
        console.error("Error committing the file:", error.message);
        res.status(500).json({ error: error.message });
    }
};

const checkCollaboration = async (req, res) => {
    const { org, repoName, username } = req.body;
    
    try {
        // First check if the repository exists
        const githubToken = await getGithubAppInstallationAccessToken();
        try {
            await axios.get(
                `https://api.github.com/repos/${org}/${repoName}`,
                {
                    headers: {
                        Authorization: `Bearer ${githubToken}`,
                        Accept: 'application/vnd.github.v3+json',
                    }
                }
            );
        } catch (error) {
            if (error.response && error.response.status === 404) {
                return res.status(200).json({ status: 'not_found' });
            }
            throw error;
        }

        // Then check if the user is a collaborator
        try {
            await axios.get(
                `https://api.github.com/repos/${org}/${repoName}/collaborators/${username}`,
                {
                    headers: {
                        Authorization: `Bearer ${githubToken}`,
                        Accept: 'application/vnd.github.v3+json',
                    }
                }
            );
            // If we get here, the user is a collaborator
            return res.status(200).json({ status: 'accepted' });
        } catch (error) {
            if (error.response) {
                if (error.response.status === 404) {
                    // User is not a collaborator
                    return res.status(200).json({ status: 'pending' });
                } else if (error.response.status === 403) {
                    // User has a pending invitation
                    return res.status(200).json({ status: 'pending' });
                }
            }
            throw error;
        }
    } catch (error) {
        console.error("Error checking collaboration:", error);
        res.status(500).json({ error: error.message });
    }
};

const listRepos = async (req, res) => {
    const { org } = req.body;
    console.log(`[BOT] listRepos called for organization: ${org}`);
    console.log(`[BOT] Request body:`, req.body);
    
    try {
        console.log(`[BOT] Getting GitHub App installation access token...`);
        const githubToken = await getGithubAppInstallationAccessToken();
        console.log(`[BOT] GitHub token received: ${githubToken ? githubToken.substring(0, 10) + '...' : 'null'}`);
        let allRepos = [];
        let page = 1;
        const perPage = 100;
        let keepFetching = true;
        
        while (keepFetching) {
        const apiResponse = await axios.get(
                `https://api.github.com/orgs/${org}/repos?per_page=${perPage}&page=${page}`,
            {
                headers: {
                    Authorization: `Bearer ${githubToken}`,
                    Accept: 'application/vnd.github.v3+json',
                }
            }
        );
            const fetched = apiResponse.data;
            console.log(`[BOT] Page ${page}: fetched ${Array.isArray(fetched) ? fetched.length : 0} repos`);
            allRepos = allRepos.concat(fetched);
            
            if (!Array.isArray(fetched) || fetched.length < perPage) {
                keepFetching = false;
            } else {
                page++;
            }
        }
        
        // After all pages are fetched, log all repo names and the total count
        console.log('[BOT] Final repo list:');
        allRepos.forEach(r => console.log('[BOT]   ', r.name));
        console.log(`[BOT] Total repos fetched: ${allRepos.length}`);
        console.log(`Fetched total ${allRepos.length} repositories for org: ${org}`);
        
        allRepos.forEach(repo => {
            if (repo.name.includes('-')) {
                console.log(`[CLASS?] ${repo.name}`);
            } else {
                console.log(repo.name);
            }
        });
        
        res.status(200).json(allRepos);
    } catch (error) {
        console.error("Error listing repositories:", error);
        res.status(500).json({ error: error.message });
    }
};

const checkReadmeExists = async (req, res) => {
    const { org, repoName } = req.body;
    
    try {
        const githubToken = await getGithubAppInstallationAccessToken();
        
        try {
            const fileResponse = await axios.get(
                `https://api.github.com/repos/${org}/${repoName}/contents/README.md`,
                {
                    headers: {
                        Authorization: `Bearer ${githubToken}`,
                        Accept: 'application/vnd.github.v3+json',
                    },
                }
            );
            
            // If we get here, the README exists
            res.status(200).json({ 
                exists: true, 
                sha: fileResponse.data.sha,
                size: fileResponse.data.size,
                url: fileResponse.data.html_url
            });
        } catch (error) {
            if (error.response && error.response.status === 404) {
                // README doesn't exist
                res.status(200).json({ exists: false });
            } else {
                throw error;
            }
        }
    } catch (error) {
        console.error("Error checking README existence:", error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    handleWebhook,
    createRepo, 
    dropRepo,
    addUserToProject,
    createIssueInProject,
    createCommentInIssue,
    closeIssue,
    commitFile,
    checkCollaboration,
    listRepos,
    checkReadmeExists
};
