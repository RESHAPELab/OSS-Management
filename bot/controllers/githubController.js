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
        } catch (error) {
            if (error.response && error.response.status !== 404) { throw error; }
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

        res.status(200).json(apiResponse.data);
    } catch (error) {
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
    
    try {
        const githubToken = await getGithubAppInstallationAccessToken();
        const apiResponse = await axios.get(
            `https://api.github.com/orgs/${org}/repos`,
            {
                headers: {
                    Authorization: `Bearer ${githubToken}`,
                    Accept: 'application/vnd.github.v3+json',
                }
            }
        );

        res.status(200).json(apiResponse.data);
    } catch (error) {
        console.error("Error listing repositories:", error);
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
    listRepos
};
