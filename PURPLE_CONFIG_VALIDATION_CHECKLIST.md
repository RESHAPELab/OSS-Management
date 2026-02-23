# Purple Config Validation Checklist

## Required Fields by Task Type

### ✅ validate-fork-url
**Required:**
- `repositoryToBeStored`: String (e.g., "igorsteinmacher/CS499-OSS")
  - The upstream repository that students must fork

**Optional:**
- `requireOwnership`: Boolean (default: true)
- `allowForkOfFork`: Boolean (default: true)
- `saveValidatedData`: Boolean
- `savedDataName`: String

**Example:**
```json
{
  "type": "validate-fork-url",
  "repositoryToBeStored": "igorsteinmacher/CS499-OSS",
  "requireOwnership": true,
  "allowForkOfFork": true
}
```

---

### ✅ validate-file-content
**Required:**
- `fileContentValidation`: Object
  - `validationParameters`: Array of strings (at least 1 required)
  - `question`: String (optional but recommended)
  - `temperature`: Number (default: 0.1)
  - `enableDetailedFeedback`: Boolean

**Example:**
```json
{
  "type": "validate-file-content",
  "fileContentValidation": {
    "question": "Validate that the markdown file contains a paper report with the required information.",
    "validationParameters": [
      "The file must contain a Title section or heading",
      "The file must contain a Venue section or heading",
      "The file must contain information about the number of pages",
      "The file must contain a link to the paper online"
    ],
    "temperature": 0.1,
    "enableDetailedFeedback": true
  }
}
```

---

### ✅ validate-file-exists
**Optional (but recommended):**
- `expectedFileName`: String (exact file name to match)
- `expectedFileType`: String (file extension, e.g., ".md", ".txt")

**Note:** If both are empty, any file will be accepted.

**Example:**
```json
{
  "type": "validate-file-exists",
  "expectedFileName": "README.md",
  "expectedFileType": ".md"
}
```

---

### ✅ validate-pr-url
**Required:**
- `targetRepository`: String (e.g., "OSS-Doorway-Dev/repo-name" or GitHub URL)

**Optional:**
- `targetBranch`: String (default: "main")
- `sourceRepository`: String (if checking PR from a specific fork)
- `requireOwnership`: Boolean (default: true)
- `requireOpenState`: Boolean (default: true)

**Example:**
```json
{
  "type": "validate-pr-url",
  "targetRepository": "OSS-Doorway-Dev/target-repo",
  "targetBranch": "main",
  "requireOpenState": true
}
```

---

### ✅ validate-push
**Required:**
- `targetRepository`: String (e.g., "misanetc/CS499-OSS" or wildcard pattern like "*/CS499-OSS")

**Optional:**
- `targetBranch`: String (default: "main")
- `expectedFilePath`: String (specific file path to check)
- `requireOwnership`: Boolean (default: true)
- `requireRecentPush`: Boolean (default: false)
- `recentPushWindowHours`: Number (default: 24)

**Example:**
```json
{
  "type": "validate-push",
  "targetRepository": "misanetc/CS499-OSS",
  "targetBranch": "main",
  "expectedFilePath": "students/ETCHIE_MISAN.md"
}
```

---

### ✅ llm-text-validation
**Required:**
- `llmTextValidation`: Object
  - `validationParameters`: Array of strings (at least 1 required)
  - `question`: String (optional but recommended)
  - `temperature`: Number (default: 0.1)
  - `enableDetailedFeedback`: Boolean

**Example:**
```json
{
  "type": "llm-text-validation",
  "llmTextValidation": {
    "question": "Validate the student's answer",
    "validationParameters": [
      "The answer must include X",
      "The answer must mention Y"
    ],
    "temperature": 0.1,
    "enableDetailedFeedback": true
  }
}
```

---

### ✅ mcq / multiple-choice
**Required:**
- `options`: Array of objects with `label` and `value`
- `correctAnswer`: String (must match one of the option labels)

**Example:**
```json
{
  "type": "mcq",
  "options": [
    { "label": "A", "value": "Option A text" },
    { "label": "B", "value": "Option B text" }
  ],
  "correctAnswer": "A"
}
```

---

## Common Issues Found

### ❌ Q3.T1: Missing `repositoryToBeStored`
**Error:** `Error: repositoryToBeStored is not configured for this task`
**Fix:** Add `"repositoryToBeStored": "igorsteinmacher/CS499-OSS"`

### ❌ Q3.T3: Missing `fileContentValidation`
**Error:** `Error: No file content validation configuration found for this task`
**Fix:** Add `fileContentValidation` object with `validationParameters` array

---

## Validation Script

Run the validation script to check all tasks:

```bash
cd OSS-Management
node validate-purple-config.js
```

This will:
1. Find the latest purple config for class `696ebe63b1aef30efd02e0f8`
2. Check each task for required fields
3. Report all errors and warnings

---

## Fix Scripts

### Fix Q3.T1 (repositoryToBeStored)
```bash
node fix-purple-config-q3t1-repository.js
```

### Fix Q3.T3 (fileContentValidation)
```bash
node fix-purple-config-q3t3-file-content.js
```

---

## Response Messages

All tasks should have:
- `accept`: String (shown when task is accepted)
- `success`: String (shown when validation passes)
- `error`: String (shown when validation fails)

These are not strictly required but recommended for better UX.
