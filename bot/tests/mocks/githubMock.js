const nock = require("nock");

const mockGithubAPI = () => {
    const baseURL = "https://api.github.com";

    // Mock for creating an issue
    nock(baseURL)
        .post("/repos/test-org/test-repo/issues")
        .reply(201, (uri, requestBody) => {
            return {
                id: 1,
                title: requestBody.title,
                body: requestBody.body,
                state: "open",
                user: { login: "contributor1" },
                created_at: "2024-01-01T00:00:00Z"
            };
        });

    // Mock for updating an issue
    nock(baseURL)
        .patch("/repos/test-org/test-repo/issues/1")
        .reply(200, (uri, requestBody) => {
            return {
                id: 1,
                title: requestBody.title,
                body: requestBody.body,
                state: "open",
                user: { login: "contributor1" },
                updated_at: "2024-01-01T01:00:00Z"
            };
        });

    // Mock for closing an issue
    nock(baseURL)
        .patch("/repos/test-org/test-repo/issues/1")
        .reply(200, {
            id: 1,
            title: "First Issue",
            body: "Issue body",
            state: "closed",
            user: { login: "contributor1" },
            updated_at: "2024-01-01T01:00:00Z"
        });

    // Mock for creating a comment
    nock(baseURL)
        .post("/repos/test-org/test-repo/issues/1/comments")
        .reply(201, (uri, requestBody) => {
            return {
                id: 1,
                body: requestBody.body,
                user: { login: "contributor1" },
                created_at: "2024-01-01T01:00:00Z"
            };
        });

    // Mock for updating a comment
    nock(baseURL)
        .patch("/repos/test-org/test-repo/issues/comments/1")
        .reply(200, (uri, requestBody) => {
            return {
                id: 1,
                body: requestBody.body,
                user: { login: "contributor1" },
                updated_at: "2024-01-01T02:00:00Z"
            };
        });

    // Mock for deleting a comment
    nock(baseURL)
        .delete("/repos/test-org/test-repo/issues/comments/1")
        .reply(204);

    // Mock for creating a file
    nock(baseURL)
        .put("/repos/test-org/test-repo/contents/test.txt")
        .reply(201, (uri, requestBody) => {
            return {
                content: requestBody.content,
                message: requestBody.message,
                sha: "sha12345",
                url: "https://api.github.com/repos/test-org/test-repo/contents/test.txt"
            };
        });

    // Mock for updating a file
    nock(baseURL)
        .put("/repos/test-org/test-repo/contents/test.txt")
        .reply(200, (uri, requestBody) => {
            return {
                content: requestBody.content,
                message: requestBody.message,
                sha: "sha12345",
                url: "https://api.github.com/repos/test-org/test-repo/contents/test.txt"
            };
        });

    // Mock for deleting a file
    nock(baseURL)
        .delete("/repos/test-org/test-repo/contents/test.txt")
        .reply(200, {
            message: "File deleted successfully"
        });

    // Mock for getting the number of issues
    nock(baseURL)
        .get("/repos/test-org/test-repo/issues")
        .reply(200, [
            { id: 1, title: "First Issue", state: "open" },
            { id: 2, title: "Second Issue", state: "open" }
        ]);

    // Mock for getting the number of pull requests
    nock(baseURL)
        .get("/repos/test-org/test-repo/pulls")
        .reply(200, [
            { id: 1, title: "First PR", state: "open" },
            { id: 2, title: "Second PR", state: "open" }
        ]);

    // Mock for getting the top contributor
    nock(baseURL)
        .get("/repos/test-org/test-repo/contributors")
        .reply(200, [
            { login: "contributor1", contributions: 5 },
            { login: "contributor2", contributions: 3 }
        ]);
};

module.exports = mockGithubAPI;
