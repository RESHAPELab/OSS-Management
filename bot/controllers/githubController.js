const axios = require('axios');
const { getGithubAppInstallationAccessToken } = require('./githubAppAuth');
const GITHUB_API_URL = 'https://api.github.com';

const createRepo = async (req, res) => {
    const {org, repoName, repoDescription, privateRepo} = req.params;
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

        res.status(201).json(apiResponse);
    } catch (error) {
        console.error("Error creating issue:", error.message);
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
    const { org, repoName, username, role } = req.params;
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
    const { org, repoName, issueNumber, commentBody } = req.body; // Extract parameters from the request body
    try {
        const githubToken = await getGithubAppInstallationAccessToken();
        const apiResponse = await axios.post(
            `https://api.github.com/repos/${org}/${repoName}/issues/${issueNumber}/comments`,
            {
                body: commentBody, // The content of the comment
            },
            {
                headers: {
                    Authorization: `Bearer ${githubToken}`,
                    Accept: 'application/vnd.github.v3+json',
                },
            }
        );

        res.status(200).json(apiResponse.data); // Send the response back with the comment data
    } catch (error) {
        console.error("Error creating comment on issue:", error.message);
        res.status(500).json({ error: error.message });
    }
};

const closeIssue = async (req, res) => {
    const { org, repoName, issueNumber } = req.body; // Extract parameters from the request body
    try {
        const githubToken = await getGithubAppInstallationAccessToken();
        const apiResponse = await axios.patch(
            `https://api.github.com/repos/${org}/${repoName}/issues/${issueNumber}`,
            {
                state: 'closed', // Update the issue state to 'closed'
            },
            {
                headers: {
                    Authorization: `Bearer ${githubToken}`,
                    Accept: 'application/vnd.github.v3+json',
                },
            }
        );

        res.status(200).json(apiResponse.data); // Send the response back with the updated issue data
    } catch (error) {
        console.error("Error closing the issue:", error.message);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    createRepo, 
    dropRepo,
    addUserToProject,
    createIssueInProject,
    createCommentInIssue,
    closeIssue
};
