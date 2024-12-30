const supertest = require('supertest');
const app = require('../../server'); // Adjust the path to your Express app
const axios = require('axios');
const REPOSITORY_NAME = `integration-test-repo-${Date.now()}`;
const request = supertest(app); // Request instance for testing

describe('GitHub Routes Integration Tests', () => {
    let org = 'OSS-Doorway-Development';
    let repoName = REPOSITORY_NAME;
    let githubToken;

    beforeAll(async () => {
        // Get the GitHub App token before tests run
        githubToken = await require('../../controllers/githubAppAuth').getGithubAppInstallationAccessToken();
    });

    test('Should create a repository using /createRepo route', async () => {
        const repoDescription = 'Repository created during live testing without mocks';
        const privateRepo = true;

        const response = await request.post('/github/createRepo').send({
            org,
            repoName,
            repoDescription,
            privateRepo
        });

        expect(response.status).toBe(201);

        // Verify that the repository was created via GitHub API
        const githubApiResponse = await axios.get(
            `https://api.github.com/repos/${org}/${repoName}`,
            {
                headers: {
                    Authorization: `Bearer ${githubToken}`,
                    Accept: 'application/vnd.github.v3+json',
                },
            }
        );

        expect(githubApiResponse.status).toBe(200);
        expect(githubApiResponse.data.name).toBe(repoName);
    });

    test('Should add a user to the repository using /addUserToRepo route', async () => {
        const username = 'pedrorodriguesarantes';
        const role = 'push';

        const response = await request.post('/github/addUserToRepo').send({
            org,
            repoName,
            username,
            role
        });

        expect(response.status).toBe(200);

        // Verify that the user was added to the repository
        const githubResponse = await axios.get(
            `https://api.github.com/repos/${org}/${repoName}/collaborators`,
            {
                headers: {
                    Authorization: `Bearer ${githubToken}`,
                    Accept: 'application/vnd.github.v3+json',
                },
            }
        );

        const collaborator = githubResponse.data.find(user => user.login === username);
        expect(collaborator).toBeDefined();
    });

    test('Should create an issue using /createIssue route', async () => {
        const title = 'Test issue title';
        const body = 'This is a test issue created for testing purposes.';

        const response = await request.post('/github/createIssue').send({
            org,
            repoName,
            title,
            body
        });

        expect(response.status).toBe(200);

        // Verify that the issue was created
        const githubResponse = await axios.get(
            `https://api.github.com/repos/${org}/${repoName}/issues`,
            {
                headers: {
                    Authorization: `Bearer ${githubToken}`,
                    Accept: 'application/vnd.github.v3+json',
                },
            }
        );

        const issue = githubResponse.data.find(issue => issue.title === title);
        expect(issue).toBeDefined();
        expect(issue.body).toBe(body);
    });

    test('Should create a comment on an issue using /commentIssue route', async () => {
        const issueNumber = 1; // Use an existing issue number
        const commentBody = 'This is a test comment for the issue.';

        const response = await request.post('/github/commentIssue').send({
            org,
            repoName,
            issueNumber,
            commentBody
        });

        expect(response.status).toBe(200);

        // Verify that the comment was created
        const githubResponse = await axios.get(
            `https://api.github.com/repos/${org}/${repoName}/issues/${issueNumber}/comments`,
            {
                headers: {
                    Authorization: `Bearer ${githubToken}`,
                    Accept: 'application/vnd.github.v3+json',
                },
            }
        );

        const comment = githubResponse.data.find(comment => comment.body === commentBody);
        expect(comment).toBeDefined();
        expect(comment.body).toBe(commentBody);
    });

    test('Should close the issue using /closeIssue route', async () => {
        const issueNumber = 1; // Use an existing issue number

        const response = await request.patch('/github/closeIssue').send({
            org,
            repoName,
            issueNumber
        });

        expect(response.status).toBe(200);

        // Verify that the issue is closed
        const githubResponse = await axios.get(
            `https://api.github.com/repos/${org}/${repoName}/issues/${issueNumber}`,
            {
                headers: {
                    Authorization: `Bearer ${githubToken}`,
                    Accept: 'application/vnd.github.v3+json',
                },
            }
        );

        expect(githubResponse.status).toBe(200);
        expect(githubResponse.data.state).toBe('closed');
    });
});
