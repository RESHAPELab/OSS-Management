const mongoose = require("mongoose")

const TaskSchema = mongoose.Schema({
    taskTitle: {
        type: String,
        required: [true, "Please provide a task title"]
    },
    quest: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Quest"
    },
    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Group"
    },
    professor: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: "Professor"
    },
    desc:{
        type: String,
        required: [true, "Please provide a description for the task"]
    },
    points:{
        type: Number,
        required: [true, "Please provide the number of points for this task"]
    },
    xp:{
        type: Number,
        required: [true, "Please provide the xp for this task"]
    },
    hints: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Hint"
    }],
    responses: {
        accept: {
            type: String,
            required: [true, "Response must include 'accept' case"]
        },
        error: {
            type: String,
            required: [true, "Response must include 'error' case"],
        },
        success: {
            type: String,
            required: [true, "Response must include 'success' case"]
        }
    },
    
    /*
    An answer can have a dynamic answer, like:
        - How many issues are open in repo X?
        - How many members does repo X have?
    
    For answering this, we are going to save a reference for a specific function
    like, "numberOfIssues". 
    
    Allowing professors to incentive students to discover other open source 
    projects, we can save the reference for a repo (link). Using this we can request 
    for the bot the metric in real time for any repo.

    So, we can support different cases. 

    1. Answers using different repos
    {
        answer: numberOfMembers,
        answerType: metric,
        answerRepoReference: https://github.com/meta-llama/llama3,
    }

    2. Answers for Quizzes
    {
        answer: [A, B, C, C, D],
        answerType: multipleAnswers,
        answersRepoReference: null,
    }

    3. Simple Answers
    {
        answer: 4,
        answerType: singleAnswer,
        answersRepoReference: null,
    }
    */

    answer: {
        type: String,
        required: [false, "Please provide an answer for the task"],
        validate: {
            validator: function(value) {
                // Only require answer for MCQ and quiz types
                if (this.answerType === 'singleAnswer' || this.answerType === 'multipleAnswers') {
                    return value !== undefined && value !== null && value !== '';
                }
                // For metric and other types, answer can be empty
                return true;
            },
            message: "Please provide an answer for the task"
        }
    },
    answerType: {
        type: String, // singleAnswer, multipleAnswers, metric
        required: [true, "Please provide the type of answer"]
    },
    answerRepoReference: {
        type: String,
    },
    // Multiple choice question fields
    question: {
        type: String,
        required: false
    },
    correctAnswer: {
        type: String,
        required: false
    },
    options: [{
        label: {
            type: String,
            required: true
        },
        value: {
            type: String,
            required: true
        }
    }],
    // Custom API call fields
    apiEndpoint: {
        type: String,
    },
    responsePath: {
        type: String,
    },
    expectedAnswerType: {
        type: String,
        enum: ['Number', 'Text'],
        default: 'Number'
    },
    // Save validated data per user (for custom-api-call)
    saveValidatedData: {
        type: Boolean,
        default: false
    },
    savedDataName: {
        type: String,
        default: ''
    },
    // Tolerance fields for number answers
    enableTolerance: {
        type: Boolean,
        default: false
    },
    toleranceRange: {
        type: Number,
        default: 10,
        min: 0,
        max: 1000
    },
    repository: {
        type: String,
    },
    // Validate Fork URL fields
    repositoryToBeStored: {
        type: String,
        description: 'The upstream repository that should be forked (for validate-fork-url tasks)'
    },
    requireOwnership: {
        type: Boolean,
        default: true,
        description: 'Whether to require the fork to be owned by the student (for validate-fork-url tasks)'
    },
    allowForkOfFork: {
        type: Boolean,
        default: true,
        description: 'Whether to allow forks of forks (for validate-fork-url tasks)'
    },
    storeForkUrl: {
        type: Boolean,
        default: true,
        description: 'Whether to store the fork URL in user data (for validate-fork-url tasks)'
    },
    // Validate File Exists fields
    expectedFileName: {
        type: String,
        default: '',
        description: 'Expected exact file name (for validate-file-exists tasks). Leave empty for any file name.'
    },
    expectedFileType: {
        type: String,
        default: '',
        description: 'Expected file type/extension (for validate-file-exists tasks). E.g., .md, .pdf, .py. Leave empty for any type.'
    },
    // Validate PR URL fields
    targetRepository: {
        type: String,
        default: '',
        description: 'The repository the PR should target (base repo) - format: owner/repo (for validate-pr-url tasks)'
    },
    targetBranch: {
        type: String,
        default: 'main',
        description: 'The branch the PR should target (base branch) - defaults to "main" (for validate-pr-url tasks)'
    },
    sourceRepository: {
        type: String,
        default: '',
        description: 'The OG repo/fork the PR should come from (head repo) - format: owner/repo (for validate-pr-url tasks). Leave empty to skip this check.'
    },
    requireOwnership: {
        type: Boolean,
        default: true,
        description: 'Whether to require PR creator to be the student (for validate-pr-url tasks)'
    },
    requireOpenState: {
        type: Boolean,
        default: true,
        description: 'Whether to require PR to be open (reject closed/merged PRs) (for validate-pr-url tasks)'
    },
    // Validate Push/Commit fields
    requireRecentPush: {
        type: Boolean,
        default: false,
        description: 'Whether to require the commit to be recent (within time window) (for validate-push tasks)'
    },
    recentPushWindowHours: {
        type: Number,
        default: 24,
        min: 1,
        max: 168,
        description: 'Number of hours within which the commit must be made (for validate-push tasks)'
    },
    expectedFilePath: {
        type: String,
        default: '',
        description: 'Optional file path that should exist in the commit (for validate-push tasks). Leave empty to skip this check.'
    },
    // LLM Text Validation fields
    llmTextValidation: {
        question: {
            type: String,
            required: function() { return this.type === 'llm-text-validation'; }
        },
        validationParameters: [{
            type: String,
            required: function() { return this.type === 'llm-text-validation'; }
        }],
        temperature: {
            type: Number,
            default: 0.1,
            min: 0,
            max: 1
        },
        enableDetailedFeedback: {
            type: Boolean,
            default: false,
            description: 'Whether to provide detailed feedback (0, 1) instead of just (0, 1)'
        }
    },
    // LLM Image Validation fields
    imageValidation: {
        question: {
            type: String,
            required: function() { return this.type === 'imageValidation'; }
        },
        validationParameters: [{
            type: String,
            required: function() { return this.type === 'imageValidation'; }
        }],
        temperature: {
            type: Number,
            default: 0.1,
            min: 0,
            max: 1
        },
        enableDetailedFeedback: {
            type: Boolean,
            default: false,
            description: 'Whether to provide detailed feedback (0|detailed) instead of just (0, 1)'
        }
    },
    // LLM File Content Validation fields
    fileContentValidation: {
        question: {
            type: String,
            required: function() { return this.type === 'validate-file-content'; }
        },
        validationParameters: [{
            type: String,
            required: function() { return this.type === 'validate-file-content'; }
        }],
        temperature: {
            type: Number,
            default: 0.1,
            min: 0,
            max: 1
        },
        enableDetailedFeedback: {
            type: Boolean,
            default: false,
            description: 'Whether to provide detailed feedback (0|detailed) instead of just (0, 1)'
        }
    },
    // Iterative Code Review fields
    iterativeCodeReview: {
        reviewPrompt: {
            type: String,
            required: function() { return this.type === 'iterative-code-review'; },
            description: 'Detailed description of code requirements and review criteria'
        },
        reviewCriteria: [{
            type: String,
            required: function() { return this.type === 'iterative-code-review'; },
            description: 'Specific criteria that the code must meet'
        }],
        maxIterations: {
            type: Number,
            default: 5,
            min: 1,
            max: 20,
            description: 'Maximum number of review cycles allowed'
        },
        temperature: {
            type: Number,
            default: 0.3,
            min: 0,
            max: 2,
            description: 'LLM temperature for code review (higher = more creative)'
        },
        enableDetailedFeedback: {
            type: Boolean,
            default: true,
            description: 'Whether to provide detailed constructive feedback'
        },
        prFilePattern: {
            type: String,
            description: 'File pattern for PR reviews (e.g., "*.cpp,*.h"). Leave empty to review all files'
        },
        commentOnPR: {
            type: Boolean,
            default: true,
            description: 'Whether to post review feedback as comments on the PR (in addition to the task issue)'
        },
        approvePR: {
            type: Boolean,
            default: false,
            description: 'Whether to automatically approve the PR when code review passes (requires pull_requests: write permission)'
        },
        mergePR: {
            type: Boolean,
            default: false,
            description: 'Whether to automatically merge the PR when code review passes (requires pull_requests: write permission and merge access)'
        },
        mergeMethod: {
            type: String,
            enum: ['merge', 'squash', 'rebase'],
            default: 'merge',
            description: 'Merge method to use when auto-merging PRs (merge, squash, or rebase)'
        }
    },
    // Bot Code Review fields (student reviews bot's code)
    botCodeReview: {
        acceptMessage: {
            type: String,
            required: function() { return this.type === 'bot-code-review'; },
            description: 'Instructions for the student on how to review code'
        },
        originalCode: {
            type: String,
            required: function() { return this.type === 'bot-code-review'; },
            description: 'The initial (flawed) code that the bot presents for review'
        },
        codeLanguage: {
            type: String,
            default: 'cpp',
            description: 'Programming language for syntax highlighting (e.g., cpp, python, java)'
        },
        requirements: {
            type: String,
            required: function() { return this.type === 'bot-code-review'; },
            description: 'Description of what the code is supposed to do'
        },
        knownIssues: [{
            type: String,
            required: function() { return this.type === 'bot-code-review'; },
            description: 'List of known issues in the code that students should identify'
        }],
        maxIterations: {
            type: Number,
            default: 5,
            min: 1,
            max: 20,
            description: 'Maximum number of review cycles allowed'
        },
        temperature: {
            type: Number,
            default: 0.3,
            min: 0,
            max: 2,
            description: 'LLM temperature for code fixes (higher = more creative)'
        },
        enableDetailedFeedback: {
            type: Boolean,
            default: true,
            description: 'Whether bot provides detailed explanations of fixes'
        },
        awardPointsOnFailure: {
            type: Boolean,
            default: false,
            description: 'Whether to award points/XP even if max iterations reached without success'
        },
        createPR: {
            type: Boolean,
            default: false,
            description: 'Whether to create a PR with the bot\'s code for review (instead of posting in issue comments)'
        },
        validateOnApproval: {
            type: Boolean,
            default: true,
            description: 'Whether to validate code against requirements when student approves (even if student approved)'
        },
        fileName: {
            type: String,
            default: 'code.cpp',
            description: 'File name to use when creating PR (e.g., code.cpp, email_validator.cpp)'
        }
    },
    // GitHub Actions Validation fields
    githubActionsValidation: {
        workflowFilePath: {
            type: String,
            default: '.github/workflows/main.yml',
            description: 'Path to the workflow file to validate (e.g., .github/workflows/main.yml)'
        },
        question: {
            type: String,
            required: function() { return this.type === 'validate-github-actions'; },
            description: 'Question or description for the validation task'
        },
        validationParameters: [{
            type: String,
            required: function() { return this.type === 'validate-github-actions'; },
            description: 'List of checks to perform on the workflow file'
        }],
        temperature: {
            type: Number,
            default: 0.1,
            min: 0,
            max: 1,
            description: 'Temperature for LLM-based validation (if needed)'
        },
        enableDetailedFeedback: {
            type: Boolean,
            default: true,
            description: 'Whether to provide detailed feedback on validation failures'
        },
        waitForWorkflowCompletion: {
            type: Boolean,
            default: false,
            description: 'Whether to check workflow execution status. If enabled, bot checks if workflow is running and tells user to try again later if still running. If workflow failed, validation fails.'
        },
        maxWaitTimeSeconds: {
            type: Number,
            default: 120,
            min: 30,
            max: 600,
            description: 'Not currently used - kept for potential future use'
        }
    },
    // Repository Validation fields
    repositoryValidation: {
        requireRepositoryExists: {
            type: Boolean,
            default: true,
            description: 'Whether to check if the repository exists'
        },
        ownershipType: {
            type: String,
            enum: ['user', 'organization', 'any'],
            default: 'any',
            description: 'Required repository ownership type: user (personal account), organization, or any'
        },
        specificOwner: {
            type: String,
            default: '',
            description: 'Specific owner username/org name to check (e.g., "OSS-Doorway-Dev"). Leave empty to check student ownership for user type or any owner for org type.'
        },
        checkBotAuthorization: {
            type: Boolean,
            default: false,
            description: 'Whether to verify the bot has access to the repository (requires GitHub App installation)'
        },
        requirePublic: {
            type: Boolean,
            default: false,
            description: 'Whether to require the repository to be public'
        },
        requirePrivate: {
            type: Boolean,
            default: false,
            description: 'Whether to require the repository to be private'
        },
        saveValidatedData: {
            type: Boolean,
            default: false,
            description: 'Whether to save the validated repository URL for later use'
        },
        savedDataName: {
            type: String,
            default: 'validatedRepo',
            description: 'Key name to store the validated repository URL'
        }
    },
    prerequisite: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Task",
        default: null
    }],
})

module.exports = mongoose.model("Task", TaskSchema)
