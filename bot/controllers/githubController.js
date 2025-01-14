const axios = require('axios');
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
    console.log(req.body);
    
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
        
        console.log(apiResponse.data);
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
            {
                state: 'closed',
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
        console.error("Error closing the issue:", error.message);
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
    closeIssue
};
