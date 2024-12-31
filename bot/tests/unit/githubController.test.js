const { createRepo, addUserToProject, createIssueInProject, createCommentInIssue, closeIssue } = require('../../controllers/githubController'); // Adjust the path to your controller
const axios = require('axios');
const REPOSITORY_NAME = `test-repo-${Date.now()}`

describe('GitHub Controller - createRepo (Live Test without Mocks)', () => {
    test('Should create a repository using live GitHub API', async () => {
        const org = 'OSS-Doorway-Development';
        const repoName = REPOSITORY_NAME;
        const repoDescription = 'Repository created during live testing without mocks';
        const privateRepo = true;

        const req = {
            body: {
                org,
                repoName,
                repoDescription,
                privateRepo,
            },
        };

        const res = {
            status: (statusCode) => {
                return res;
            },
            json: (data) => {
                return data;
            },
        };

        try {
            await createRepo(req, res);

            const githubApiResponse = await axios.get(
                `https://api.github.com/repos/${org}/${repoName}`,
                {
                    headers: {
                        Authorization: `Bearer ${await require('../../controllers/githubAppAuth').getGithubAppInstallationAccessToken()}`,
                        Accept: 'application/vnd.github.v3+json',
                    },
                }
            );

            expect(githubApiResponse.status).toBe(200);
            expect(githubApiResponse.data.name).toBe(repoName);

        } catch (error) {
            console.error('Error during test:', error.message);

            if (error.response) {
                console.error('Error details:', error.response.data);
            }

            throw error;
        }
    });

    test('Should add an user for the previous created repository', async () => {
        const org = 'OSS-Doorway-Development';
        const repoName = REPOSITORY_NAME;
        const username = 'pedrorodriguesarantes';
        const role = "push";

        const req = {
            body: {
                org,
                repoName,
                username,
                role,
            },
        };

        const res = {
            status: (statusCode) => {
                return res;
            },
            json: (data) => {
                return data;
            },
        };

        try {
            await addUserToProject(req, res);
            const githubToken = await require('../../controllers/githubAppAuth').getGithubAppInstallationAccessToken();
            const response = await axios.get(
                `https://api.github.com/repos/${org}/${repoName}/collaborators`,
                {
                    headers: {
                        Authorization: `Bearer ${githubToken}`,
                        Accept: 'application/vnd.github.v3+json',
                    },
                }
            );

            const collaborator = response.data.find((user) => user.login === username);
            expect(response.status).toBe(200);
        } catch (error) {
            console.error('Error during test:', error.message);

            if (error.response) {
                console.error('Error details:', error.response.data);
            }

            throw error;
        }
    });

    test('Should create an issue in the previously created repository', async () => {
        const org = 'OSS-Doorway-Development';
        const repoName = REPOSITORY_NAME;
        const title = 'Test issue title';
        const body = 'This is a test issue created for testing purposes.';
    
        const req = {
            body: {
                org,
                repoName,
                title,
                body,
            },
        };
    
        const res = {
            status: (statusCode) => {
                return res;
            },
            json: (data) => {
                return data;
            },
        };
    
        try {
            await createIssueInProject(req, res);
    
            const githubToken = await require('../../controllers/githubAppAuth').getGithubAppInstallationAccessToken();
            const response = await axios.get(
                `https://api.github.com/repos/${org}/${repoName}/issues`,
                {
                    headers: {
                        Authorization: `Bearer ${githubToken}`,
                        Accept: 'application/vnd.github.v3+json',
                    },
                }
            );
            
            const issue = response.data.find((issue) => issue.title === title);
            
            expect(response.status).toBe(200);
            expect(issue).toBeDefined();
            expect(issue.body).toBe(body);
        } catch (error) {
            console.error('Error during test:', error.message);
    
            if (error.response) {
                console.error('Error details:', error.response.data);
            }
    
            throw error;
        }
    });
    
    test('Should create a comment on the specified issue in the previously created repository', async () => {
        const org = 'OSS-Doorway-Development';
        const repoName = REPOSITORY_NAME;
        const issueNumber = 1; // Replace with the actual issue number where you want to add the comment
        const commentBody = 'This is a test comment for the issue.';
    
        const req = {
            body: {
                org,
                repoName,
                issueNumber,
                commentBody,
            },
        };
    
        const res = {
            status: (statusCode) => {
                return res;
            },
            json: (data) => {
                return data;
            },
        };
    
        try {
            // Call the function to create a comment
            await createCommentInIssue(req, res);
    
            const githubToken = await require('../../controllers/githubAppAuth').getGithubAppInstallationAccessToken();
            const response = await axios.get(
                `https://api.github.com/repos/${org}/${repoName}/issues/${issueNumber}/comments`,
                {
                    headers: {
                        Authorization: `Bearer ${githubToken}`,
                        Accept: 'application/vnd.github.v3+json',
                    },
                }
            );
    
            // Check if the comment was created by searching for the comment body
            const comment = response.data.find((comment) => comment.body === commentBody);
    
            // Assert the status and that the comment exists
            expect(response.status).toBe(200);
            expect(comment).toBeDefined(); // Ensure the comment is defined
    
            // Optionally, check the body of the comment
            expect(comment.body).toBe(commentBody);
        } catch (error) {
            console.error('Error during test:', error.message);
    
            if (error.response) {
                console.error('Error details:', error.response.data);
            }
    
            throw error;
        }
    });

    test('Should close the specified issue in the previously created repository', async () => {
        const org = 'OSS-Doorway-Development';
        const repoName = REPOSITORY_NAME;
        const issueNumber = 1; // Replace with the actual issue number you want to close
    
        const req = {
            body: {
                org,
                repoName,
                issueNumber,
            },
        };
    
        const res = {
            status: (statusCode) => {
                return res;
            },
            json: (data) => {
                return data;
            },
        };
    
        try {
            // Call the function to close the issue
            await closeIssue(req, res);
    
            // Retrieve the issue to verify its state
            const githubToken = await require('../../controllers/githubAppAuth').getGithubAppInstallationAccessToken();
            const response = await axios.get(
                `https://api.github.com/repos/${org}/${repoName}/issues/${issueNumber}`,
                {
                    headers: {
                        Authorization: `Bearer ${githubToken}`,
                        Accept: 'application/vnd.github.v3+json',
                    },
                }
            );
    
            // Assert the status and that the issue is closed
            expect(response.status).toBe(200);
            expect(response.data.state).toBe('closed'); // Ensure the issue's state is 'closed'
        } catch (error) {
            console.error('Error during test:', error.message);
    
            if (error.response) {
                console.error('Error details:', error.response.data);
            }
    
            throw error;
        }
    });    
    
});
