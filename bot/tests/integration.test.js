const { createRepo, addUserToProject } = require('../controllers/githubController'); // Adjust the path to your controller
const axios = require('axios');
const REPOSITORY_NAME = `test-repo-${Date.now()}`

describe('GitHub Controller - createRepo (Live Test without Mocks)', () => {
    test('Should create a repository using live GitHub API', async () => {
        const org = 'OSS-Doorway-Development';
        const repoName = REPOSITORY_NAME;
        const repoDescription = 'Repository created during live testing without mocks';
        const privateRepo = true;

        const req = {
            params: {
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
                        Authorization: `Bearer ${await require('../controllers/githubAppAuth').getGithubAppInstallationAccessToken()}`,
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
        const username = 'jadynlaila';
        const role = "push";

        const req = {
            params: {
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
            const githubToken = await require('../controllers/githubAppAuth').getGithubAppInstallationAccessToken();
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
});
