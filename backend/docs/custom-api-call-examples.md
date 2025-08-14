# Custom API Call Task Type Examples

The `custom-api-call` task type allows professors to create dynamic quests that call GitHub APIs and validate student answers against the API responses.

## Form Configuration

When creating a quest with the `custom-api-call` task type, professors need to provide:

1. **API Endpoint**: The GitHub API endpoint to call
2. **Response Path**: How to extract the answer from the API response
3. **Expected Answer Type**: Whether the answer should be a Number or Text
4. **Question**: The question to ask students

## Example Configurations

### 1. Count Stargazers
```
API Endpoint: /repos/{owner}/{repo}/stargazers
Response Path: length
Expected Answer Type: Number
Question: How many stargazers does this repository have?
```

### 2. Count Forks
```
API Endpoint: /repos/{owner}/{repo}/forks
Response Path: length
Expected Answer Type: Number
Question: How many forks does this repository have?
```

### 3. Get Language
```
API Endpoint: /repos/{owner}/{repo}
Response Path: language
Expected Answer Type: Text
Question: What is the primary language of this repository?
```

### 4. Count Issues
```
API Endpoint: /repos/{owner}/{repo}/issues
Response Path: length
Expected Answer Type: Number
Question: How many open issues does this repository have?
```

### 5. Count PRs
```
API Endpoint: /repos/{owner}/{repo}/pulls
Response Path: length
Expected Answer Type: Number
Question: How many open pull requests does this repository have?
```

### 6. Get Description
```
API Endpoint: /repos/{owner}/{repo}
Response Path: description
Expected Answer Type: Text
Question: What is the description of this repository?
```

## How It Works

1. **Placeholder Replacement**: The system automatically replaces `{owner}` and `{repo}` with the actual repository values
2. **API Call**: Makes a GET request to the GitHub API using the authenticated context
3. **Response Processing**: Extracts the answer using the specified response path
4. **Validation**: Compares the student's answer against the extracted value
5. **Answer Types**: 
   - **Number**: Supports both exact string match and numeric comparison
   - **Text**: Uses case-insensitive string comparison

## Response Path Examples

- `length`: For arrays, returns the number of items
- `language`: For repository objects, returns the primary language
- `description`: For repository objects, returns the description
- `stargazers_count`: For repository objects, returns star count
- `forks_count`: For repository objects, returns fork count

## Error Handling

The system handles various error scenarios:
- Invalid API endpoints
- Missing response paths
- API rate limiting
- Network errors
- Invalid response formats

## Benefits

- **Flexibility**: Professors can create any GitHub API-based quest
- **Real-time Data**: Answers are always current
- **Consistency**: Uses the same validation and gamification framework
- **Extensibility**: Easy to add new API endpoints and response paths 