# MCQ Quest Structure Documentation

## Overview
This document explains how Multiple Choice Question (MCQ) quests are structured and uploaded to the database, following the same format as existing quests like Q0T1 and Q1T3.

## Response System

### Rich Response Generation
The system automatically generates rich, story-driven responses that mirror the style and sense of the hard-coded responses in `response.json`. These responses include:

#### **Accept Response (Initial Question)**
- **Format**: Rich markdown with emojis, objectives, task description, and options
- **Variety**: Adapts based on question type (find/locate vs. general questions)
- **Structure**: 
  - 🎯 Task title
  - **Objective** explanation
  - **Task** description
  - Multiple choice options (A, B, C, D)
  - **Outcome** explanation
  - **Help** instructions

#### **Error Response (Wrong Answer)**
- **Format**: Encouraging error messages with metaphors and guidance
- **Variety**: Random metaphors (treasure hunt, detective work, puzzle, navigation)
- **Structure**:
  - 🚨 Error header
  - Encouraging message about learning from mistakes
  - Help instructions
  - Random metaphor
  - Educational context
  - Retry instructions with options

#### **Success Response (Correct Answer)**
- **Format**: Celebratory messages with progress tracking
- **Variety**: Random achievement messages
- **Structure**:
  - 🌟 Success header
  - Random achievement message
  - Points earned
  - Progress tracking (current points, level progress)
  - Quest completion percentage
  - Encouragement for next challenges

#### **Hints Response**
- **Format**: Hint usage tracking with point penalties
- **Structure**: Shows hints used, penalty cost, and current points

#### **No Hints Response**
- **Format**: Congratulatory message for completing without hints

### Response Templates
The system uses configurable templates that can be easily customized:

```javascript
const responseTemplates = {
    accept: (taskData) => { /* Generates initial question */ },
    error: (taskData) => { /* Generates error message with variety */ },
    success: (taskData) => { /* Generates success message with variety */ },
    hints: () => { /* Generates hint usage message */ },
    noHints: () => { /* Generates no-hint completion message */ }
};
```

## Database Structure

### Quest Model
```javascript
{
  questTitle: String,           // Required: Title of the quest
  professor: ObjectId,          // Required: Reference to professor who created it
  tasks: [ObjectId],            // Array of task IDs
  sequenceNumber: Number        // Optional: Order of quests
}
```

### Task Model
```javascript
{
  taskTitle: String,            // Required: Title of the task
  quest: ObjectId,              // Required: Reference to parent quest
  professor: ObjectId,          // Required: Reference to professor
  desc: String,                 // Required: Task description
  points: Number,               // Required: Points for completion
  xp: Number,                   // Required: Experience points (same as points)
  responses: {                  // Required: Rich response content
    accept: String,             // Initial question display
    error: String,              // Wrong answer response
    success: String,            // Correct answer response
    hints: String,              // Hint usage message
    noHints: String             // No-hint completion message
  },
  answer: String,               // Required: Correct answer (a, b, c, or d)
  answerType: String,           // Required: "singleAnswer" for MCQ
  answerRepoReference: String,  // Optional: Repository reference
  prerequisite: [ObjectId]      // Optional: Prerequisite tasks
}
```

### Hint Model
```javascript
{
  task: ObjectId,               // Required: Reference to task
  content: String,              // Required: Hint text
  penalty: Number,              // Required: Points deducted for using hint
  sequence: Number              // Required: Order of hints (1, 2, 3)
}
```

## Upload Format

### Request Body Structure
```javascript
{
  questTitle: "GitHub Fundamentals MCQ Quiz",
  professorId: "507f1f77bcf86cd799439011",
  tasks: [
    {
      title: "Locate the Fork Button",
      objective: "Forking is a cornerstone of GitHub collaboration...",
      description: "Go to the GitHub repository using the link below...",
      outcome: "By completing this task, you'll gain insight into...",
      helpText: "If you need help with this task, type 'help'...",
      points: 20,
      correctAnswer: "b",
      options: [
        "In the top-left corner of the repository page",
        "In the top-right corner of the repository page, next to the Watch and Star buttons",
        "In the bottom-right corner of the repository page",
        "In the middle of the repository page, below the description"
      ],
      hints: [
        {
          content: "Look for a button that says 'Fork' - it's usually near other action buttons.",
          penalty: 5,
          sequence: 1
        }
      ]
    }
  ]
}
```

## API Endpoints

### Upload MCQ Quest
- **POST** `/api/quest/upload-mcq`
- **Body**: Quest data structure (see above)
- **Response**: Success status and quest ID

### Get Quests by Professor
- **GET** `/api/quest/professor/:professorId`
- **Response**: Array of quests created by the professor

### Delete Quest
- **DELETE** `/api/quest/:questId`
- **Response**: Success status

## Integration with GitHub Bot

### Task Mapping
The uploaded MCQ tasks are automatically integrated with the GitHub bot system:

1. **Task Creation**: Tasks are stored in the database with rich responses
2. **Issue Generation**: GitHub issues are created with the `accept` response content
3. **Answer Validation**: Bot validates student answers against the stored `answer` field
4. **Response Display**: Bot displays appropriate responses (`error`, `success`, `hints`) based on student interaction
5. **Progress Tracking**: Points and XP are awarded based on task completion

### Response Flow
1. **Initial Display**: Students see the `accept` response when they first view the issue
2. **Wrong Answer**: Students see the `error` response with encouragement and retry options
3. **Correct Answer**: Students see the `success` response with points and progress
4. **Hint Usage**: Students see the `hints` response showing penalty and current points
5. **No Hints**: Students see the `noHints` response for completing without help

## Testing

### Manual Testing
1. Start both frontend and backend servers
2. Log in as a professor
3. Navigate to a class
4. Click "Create Quest"
5. Fill out the MCQ form with all required fields
6. Click "Upload MCQ Quest to Database"
7. Verify success message and quest ID

### Response Testing
1. Create a test quest with multiple tasks
2. Verify that responses are generated with variety
3. Check that error messages use different metaphors
4. Confirm success messages use different achievement phrases
5. Test hint functionality and penalty system

## Customization

### Modifying Response Templates
To customize the response style, edit the `responseTemplates` object in `questController.js`:

```javascript
// Add new metaphors for error messages
const metaphors = [
    "This is a bit like a treasure hunt 🗺️.",
    "Think of this as detective work 🔍.",
    "This is like solving a puzzle 🧩.",
    "Consider this a navigational exercise 🧭.",
    "This is like exploring a new city 🏙️."  // Add your own
];

// Add new achievement messages for success
const achievements = [
    "You've correctly identified the answer...",
    "You've successfully mastered this concept...",
    "You've nailed this question...",
    "You've aced this task...",
    "You've conquered this challenge..."  // Add your own
];
```

### Adding New Response Types
To add new response types, extend the templates and database schema:

```javascript
// Add new template
const responseTemplates = {
    // ... existing templates
    partial: (taskData) => `### 🎯 Partial Credit!\n\nYou're on the right track...`,
    bonus: (taskData) => `### 🎁 Bonus Points!\n\nExtra credit for quick completion...`
};

// Update Task model to include new responses
responses: {
    accept: String,
    error: String,
    success: String,
    hints: String,
    noHints: String,
    partial: String,  // New response type
    bonus: String     // New response type
}
``` 