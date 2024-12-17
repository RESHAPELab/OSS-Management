/*const nock = require('nock');
const axios = require('axios');
const { createIssue, updateIssue, closeIssue, createComment, updateComment, deleteComment, createFile, updateFile, deleteFile, getNumberPullRequests, getTopContributor, getNumberIssues} = require('../../controllers/githubController');
const mockGithubAPI = require('../mocks/githubMock');
const { getGithubAppInstallationAccessToken } = require('../../controllers/githubAppAuth');

jest.mock('../../controllers/githubAppAuth', () => ({
    getGithubAppInstallationAccessToken: jest.fn().mockResolvedValue('mock-access-token')
}));

describe('GitHub Controller', () => {
    beforeAll(() => {
        mockGithubAPI();
    });

    afterAll(() => {
        nock.cleanAll();
    });

    test('should update an issue', async () => {
        const req = {
            body: { org: 'test-org', repo: 'test-repo', issueNumber: 1, title: 'Updated Issue', body: 'Updated body' }
        };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await updateIssue(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            title: 'Updated Issue',
            body: 'Updated body'
        }));
    });

    test('should close an issue', async () => {
        const req = { body: { org: 'test-org', repo: 'test-repo', issueNumber: 1 } };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await closeIssue(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            state: 'closed'
        }));
    });

    test('should create a comment', async () => {
        const req = {
            body: { org: 'test-org', repo: 'test-repo', issueNumber: 1, comment: 'This is a comment' }
        };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await createComment(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            body: 'This is a comment'
        }));
    });

    test('should update a comment', async () => {
        const req = {
            body: { org: 'test-org', repo: 'test-repo', commentId: 1, comment: 'Updated comment' }
        };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await updateComment(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            body: 'Updated comment'
        }));
    });

    test('should delete a comment', async () => {
        const req = { body: { org: 'test-org', repo: 'test-repo', commentId: 1 } };
        const res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn()
        };

        await deleteComment(req, res);

        expect(res.status).toHaveBeenCalledWith(204);
        expect(res.send).toHaveBeenCalled();
    });

    test('should get number of pull requests', async () => {
        const req = { body: { org: 'test-org', repo: 'test-repo' } };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await getNumberPullRequests(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ numberOfPullRequests: 2 });
    });

    test('should get number of issues', async () => {
        const req = { params: { org: 'test-org', repo: 'test-repo' } };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await getNumberIssues(req, res);
        
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ numberOfIssues: 2 });
    });

    test('should get top contributor', async () => {
        const req = { body: { org: 'test-org', repo: 'test-repo' } };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await getTopContributor(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            login: 'contributor1'
        }));
    });
});
*/