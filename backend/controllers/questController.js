const Quest = require("../models/QuestModel");
const Task = require("../models/TaskModel");
const Hint = require("../models/HintModel");
const Professor = require("../models/ProfessorModel");

// Helper functions for generating responses
const generateAcceptResponse = (taskData) => {
    // Handle quiz tasks with multiple questions
    if (taskData.type === 'quiz') {
        let quizContent = `**Objective:** ${taskData.objective || 'Test your knowledge'}\n\n**Task:** ${taskData.description || 'Answer the following questions to test your knowledge'}\n\n`;
        
        // Add instructions for quiz format
        quizContent += `**Instructions:** Answer all questions and submit your answers in the format [a,b,c,d,e] where each letter corresponds to your answer for each question.\n\n**Example:** If you think the answers are A, C, B, D, E, type: [a,c,b,d,e]\n\n`;
        
        // Process each question
        if (taskData.questions && Array.isArray(taskData.questions)) {
            taskData.questions.forEach((question, index) => {
                if (question.question) {
                    quizContent += `**Question ${index + 1}:** ${question.question}\n\n`;
                    if (question.optionA) quizContent += `A) ${question.optionA}\n`;
                    if (question.optionB) quizContent += `B) ${question.optionB}\n`;
                    if (question.optionC) quizContent += `C) ${question.optionC}\n`;
                    if (question.optionD) quizContent += `D) ${question.optionD}\n`;
                    quizContent += `\n`;
                }
            });
        }
        
        quizContent += `**Outcome:** ${taskData.outcome || 'You will demonstrate your understanding of the material'}\n\n**Help:** ${taskData.helpText || 'Type "help" for hints if needed'}\n\nSubmit your answers in the format [a,b,c,d,e] where each letter is your answer choice.`;
        return quizContent;
    }
    
    // Handle get-issue-count and similar metric-based tasks
    if (taskData.type === 'get-issue-count' || taskData.type === 'get-open-issue') {
        const repository = taskData.ossRepository || taskData.config?.ossRepository || '[repository]';
        return `**Objective:** ${taskData.objective || 'Analyze a GitHub repository'}\n\n**Task:** Go to the repository ${repository} and count the number of open issues. Reply with the number.\n\n**Help:** Look for the 'Issues' tab on the repository page. Make sure you're counting issues, not pull requests.`;
    }
    if (taskData.type === 'get-pr-count') {
        const repository = taskData.ossRepository || taskData.config?.ossRepository || '[repository]';
        return `**Objective:** ${taskData.objective || 'Analyze a GitHub repository'}\n\n**Task:** Go to the repository ${repository} and count the number of open pull requests. Reply with the number.\n\n**Help:** Look for the 'Pull requests' tab on the repository page. Make sure you're counting pull requests, not issues.`;
    }
    if (taskData.type === 'get-issue-title') {
        const repository = taskData.ossRepository || taskData.config?.ossRepository || '[repository]';
        const issueNumber = taskData.issueNumber || taskData.config?.issueNumber || '[issue number]';
        return `**Objective:** ${taskData.objective || 'Explore GitHub issues'}\n\n**Task:** Go to the repository ${repository} and find the title of the issue with number ${issueNumber}. Reply with the exact title.\n\n**Help:** Use the Issues tab and search for the issue number.`;
    }
    if (taskData.type === 'get-top-contributor') {
        const repository = taskData.ossRepository || taskData.config?.ossRepository || '[repository]';
        return `**Objective:** ${taskData.objective || 'Analyze repository contributors'}\n\n**Task:** Go to the repository ${repository} and find the top contributor (the user with the most commits). Reply with their GitHub username.\n\n**Help:** Use the Insights > Contributors page on GitHub.`;
    }
    if (taskData.type === 'llm-text-validation') {
        const question = taskData.llmTextValidation?.question || taskData.config?.llmTextValidation?.question || taskData.question || 'Answer the following question:';
        const parameters = taskData.llmTextValidation?.validationParameters || taskData.config?.llmTextValidation?.validationParameters || [];
        let parameterText = '';
        if (parameters && parameters.length > 0) {
            parameterText = '\n\n**Required Criteria:**\n' + parameters.map((param, idx) => `${idx + 1}. ${param}`).join('\n');
        }
        return `**Objective:** ${taskData.objective || 'Answer the question using AI validation'}\n\n**Task:** ${question}${parameterText}\n\n**Instructions:** Provide a detailed answer that addresses all the required criteria. The AI will evaluate your response based on the specified parameters.\n\n**Help:** Make sure your answer is comprehensive and covers all the required points.`;
    }
    if (taskData.type === 'collect-info') {
        const question = taskData.question || taskData.config?.question || 'Provide the requested information';
        return `**Objective:** ${taskData.objective || 'Collect information'}\n\n**Task:** ${question}\n\n**Instructions:** This is a non-graded information collection task. Simply provide the requested information in the comment box below.\n\n**Note:** Any response will be accepted. This task is designed to collect information and does not require a specific answer format.`;
    }
    // Default (MCQ)
    return `**Objective:** ${taskData.objective || 'Learn about this topic'}\n\n**Task:** ${taskData.description || 'Complete the task as described'}\n\n**Options:**\nA) ${taskData.options?.[0] || 'Option A'}\nB) ${taskData.options?.[1] || 'Option B'}\nC) ${taskData.options?.[2] || 'Option C'}\nD) ${taskData.options?.[3] || 'Option D'}\n\n**Outcome:** ${taskData.outcome || 'You will understand this concept better'}\n\n**Help:** ${taskData.helpText || 'Type "help" for hints if needed'}\n\nChoose the option that best answers the question.`;
};

const generateErrorResponse = (taskData) => {
    if (taskData.type === 'quiz') {
        return `❌ **Quiz Submission Error**

Please check your answer format and try again.

**Required format:** [a,b,c,d,e] where each letter is your answer choice.

**Example:** [a,c,b,d,e]

**Hint:** ${taskData.helpText || 'Make sure you have the correct number of answers and they are in the right format'}

You can type "help" for additional hints (though it may cost you points).`;
    }
    
    if (taskData.type === 'llm-text-validation') {
        const parameters = taskData.llmTextValidation?.validationParameters || taskData.config?.llmTextValidation?.validationParameters || [];
        let parameterText = '';
        if (parameters && parameters.length > 0) {
            parameterText = '\n\n**Required Criteria:**\n' + parameters.map((param, idx) => `${idx + 1}. ${param}`).join('\n');
        }
        return `❌ **Answer Validation Failed**

Your answer didn't meet all the required criteria. Please review the question and try again.

**Required Criteria:**${parameterText}

**Hint:** ${taskData.helpText || 'Make sure your answer addresses all the required points comprehensively'}

You can type "help" for additional hints (though it may cost you points).`;
    }
    
    if (taskData.type === 'collect-info') {
        return `❌ **No Response Detected**

It looks like you haven't provided any information yet.

**Please:** Type your response in the comment box below.

**Note:** This is a non-graded task - any response will be accepted.

**Hint:** ${taskData.helpText || 'Simply provide the requested information in any format'}

You can type "help" for additional guidance.`;
    }
    
    return `❌ **Incorrect Answer**

That's not the right answer. Please review the question and try again.

**Hint:** ${taskData.helpText || 'Think carefully about the options provided'}

You can type "help" for additional hints (though it may cost you points).`;
};

const generateSuccessResponse = (taskData) => {
    if (taskData.type === 'quiz') {
        return `✅ **Quiz Completed!**

Excellent work! You've completed the quiz.

**What you learned:** ${taskData.outcome || 'You now understand this concept better'}

**Points earned:** ${taskData.points || 100}

You correctly answered {correctCount} out of ${taskData.questions?.length || 0} questions! 🎯

You're making excellent progress! 🎉`;
    }
    
    if (taskData.type === 'llm-text-validation') {
        return `✅ **Answer Validated Successfully!**

Excellent work! Your answer has been validated by AI and meets all the required criteria.

**What you learned:** ${taskData.outcome || 'You now understand this concept better'}

**Points earned:** ${taskData.points || 100}

**AI Validation:** Your response was comprehensive and addressed all the required points! 🤖✨

You're making excellent progress! 🎉`;
    }
    
    if (taskData.type === 'collect-info') {
        return `✅ **Information Collected!**

Thank you for providing the requested information!

**What you learned:** ${taskData.outcome || 'Information sharing is an important part of collaborative work'}

**Points earned:** ${taskData.points || 100}

**Task Type:** This was a non-graded information collection task.

Great contribution! 📋

You're making excellent progress! 🎉`;
    }
    
    return `✅ **Correct Answer!**

Great job! You've successfully completed this task.

**What you learned:** ${taskData.outcome || 'You now understand this concept better'}

**Points earned:** ${taskData.points || 100}

You're making excellent progress! 🎉`;
};

// Default response templates that mirror response.json style
const responseTemplates = {
    accept: (taskData) => generateAcceptResponse(taskData),
    error: (taskData) => generateErrorResponse(taskData),
    success: (taskData) => generateSuccessResponse(taskData),
    hints: () => "💡 **Hint Available**\n\nYou can use hints to get help, but they will cost you points. Type 'hint' to see the first hint.",
    noHints: () => "❌ **No Hints Available**\n\nNo hints are available for this task. Try your best to figure it out!"
};

// Upload MCQ Quest to Database
const uploadMCQQuest = async (req, res) => {
    try {
        const { questTitle, professorId, tasks } = req.body;

        if (!questTitle || !professorId || !tasks || !Array.isArray(tasks)) {
            return res.status(400).json({ 
                success: false, 
                message: "Missing required fields: questTitle, professorId, and tasks array" 
            });
        }

        // Create the quest
        const newQuest = new Quest({
            questTitle,
            professor: professorId,
            tasks: []
        });

        await newQuest.save();

        // Create tasks for the quest
        for (const taskData of tasks) {
            // Determine answer and answerType based on task type
            let answer = '';
            let answerType = '';
            if (taskData.type === 'multiple-choice' || !taskData.type) {
                answer = taskData.correctAnswer;
                answerType = 'singleAnswer';
            } else if (taskData.type === 'quiz') {
                answer = Array.isArray(taskData.correctAnswers) ? taskData.correctAnswers.join(',') : (taskData.correctAnswers || '');
                answerType = 'multipleAnswers';
            } else if (taskData.type === 'get-issue-count' || taskData.type === 'get-pr-count' || taskData.type === 'get-open-issue' || taskData.type === 'get-top-contributor' || taskData.type === 'get-issue-title') {
                answer = '';
                answerType = 'metric';
            } else if (taskData.type === 'text-input') {
                answer = taskData.expectedAnswer || '';
                answerType = 'singleAnswer';
            } else if (taskData.type === 'custom-api-call') {
                answer = '';
                answerType = 'custom';
            } else if (taskData.type === 'llm-text-validation') {
                answer = '';
                answerType = 'llm-validation';
                http://localhost:3000/class/68aa7f5a8a69e6a01577e368            } else if (taskData.type === 'collect-info') {
                answer = '';
                answerType = 'text';
            } else {
                answer = taskData.correctAnswer || '';
                answerType = 'singleAnswer';
            }
            const newTask = new Task({
                taskTitle: taskData.title,
                quest: newQuest._id,
                professor: professorId,
                desc: taskData.description,
                objective: taskData.objective,
                outcome: taskData.outcome,
                helpText: taskData.helpText,
                points: taskData.points || 100,
                xp: taskData.points || 100,
                answer,
                answerType,
                type: taskData.type,
                ossRepository: taskData.ossRepository || taskData.config?.ossRepository,
                issueNumber: taskData.issueNumber || taskData.config?.issueNumber,
                // Custom API call fields
                apiEndpoint: taskData.apiEndpoint || taskData.config?.apiEndpoint || '',
                responsePath: taskData.responsePath || taskData.config?.responsePath || '',
                expectedAnswerType: taskData.expectedAnswerType || taskData.config?.expectedAnswerType || 'Number',
                repository: taskData.repository || taskData.config?.repository || '',
                // Tolerance fields
                enableTolerance: taskData.enableTolerance || taskData.config?.enableTolerance || false,
                toleranceRange: taskData.toleranceRange || taskData.config?.toleranceRange || 10,
                // LLM Text Validation fields
                llmTextValidation: {
                    question: taskData.llmTextValidation?.question || taskData.config?.llmTextValidation?.question || '',
                    validationParameters: taskData.llmTextValidation?.validationParameters || taskData.config?.llmTextValidation?.validationParameters || [],
                    temperature: taskData.llmTextValidation?.temperature || taskData.config?.llmTextValidation?.temperature || 0.1,
                    enableDetailedFeedback: taskData.llmTextValidation?.enableDetailedFeedback || taskData.config?.llmTextValidation?.enableDetailedFeedback || false
                },
                responses: {
                    accept: generateAcceptResponse(taskData),
                    error: generateErrorResponse(taskData),
                    success: generateSuccessResponse(taskData)
                }
            });

            await newTask.save();
            newQuest.tasks.push(newTask._id);

            // Save hints if provided
            if (taskData.hints && Array.isArray(taskData.hints) && taskData.hints.length > 0) {
                for (const hintData of taskData.hints) {
                    const newHint = new Hint({
                        quest: newQuest._id,
                        task: newTask._id,
                        professor: professorId,
                        sequence: hintData.sequence,
                        penalty: hintData.penalty,
                        content: hintData.content
                    });
                    await newHint.save();
                    newTask.hints.push(newHint._id);
                }
                await newTask.save();
            }
        }

        await newQuest.save();

        // Update professor's quests
        await Professor.findByIdAndUpdate(professorId, {
            $push: { quests: newQuest._id }
        });

        // Automatically generate dynamic config for all groups owned by this professor
        try {
            const DynamicQuestConfigGenerator = require('../services/DynamicQuestConfigGenerator');
            const baseURL = req.get('host') ? `https://${req.get('host')}` : 'https://oss-michael-production.up.railway.app';
            
            // Get all groups owned by this professor
            const professor = await Professor.findById(professorId).populate('ownedGroups');
            if (professor && professor.ownedGroups) {
                for (const group of professor.ownedGroups) {
                    try {
                        const generator = new DynamicQuestConfigGenerator(group._id.toString(), baseURL);
                        const config = await generator.generateDynamicConfig();
                        console.log(`✅ Auto-generated dynamic config for group ${group._id} after quest creation:`, config.metadata);
                    } catch (groupConfigError) {
                        console.error(`⚠️ Auto-config generation failed for group ${group._id}:`, groupConfigError.message);
                    }
                }
            }
        } catch (configError) {
            console.error(`⚠️ Auto-config generation failed after quest creation:`, configError.message);
            // Don't fail the entire request if config generation fails
        }

        res.status(201).json({
            success: true,
            message: "MCQ Quest uploaded successfully",
            data: {
                questId: newQuest._id,
                questTitle: newQuest.questTitle,
                taskCount: newQuest.tasks.length
            }
        });

    } catch (error) {
        console.error("Error uploading MCQ quest:", error);
        res.status(500).json({
            success: false,
            message: "Error uploading MCQ quest",
            error: error.message
        });
    }
};

// Get all quests for a professor
const getQuestsByProfessor = async (req, res) => {
    try {
        const { professorId } = req.params;
        
        const quests = await Quest.find({ professor: professorId })
            .populate('tasks')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: quests
        });

    } catch (error) {
        console.error("Error fetching quests:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Get all quests from database (for importing)
const getAllQuests = async (req, res) => {
    try {
        const quests = await Quest.find({})
            .populate('tasks')
            .populate('professor', 'name email')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: quests
        });

    } catch (error) {
        console.error("Error fetching all quests:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Delete a quest
const deleteQuest = async (req, res) => {
    try {
        const { questId } = req.params;

        // Find the quest to get professor ID for config regeneration
        const quest = await Quest.findById(questId);
        if (!quest) {
            return res.status(404).json({
                success: false,
                message: "Quest not found"
            });
        }

        const professorId = quest.professor;

        // Delete the quest and all associated tasks and hints
        await Task.deleteMany({ quest: questId });
        await Hint.deleteMany({ quest: questId });
        await Quest.findByIdAndDelete(questId);

        // Remove quest from professor's quests array
        await Professor.findByIdAndUpdate(professorId, {
            $pull: { quests: questId }
        });

        // Automatically generate dynamic config for all groups owned by this professor
        try {
            const DynamicQuestConfigGenerator = require('../services/DynamicQuestConfigGenerator');
            const baseURL = req.get('host') ? `http://${req.get('host')}` : 'http://localhost:8080';
            
            // Get all groups owned by this professor
            const professor = await Professor.findById(professorId).populate('ownedGroups');
            if (professor && professor.ownedGroups) {
                for (const group of professor.ownedGroups) {
                    try {
                        const generator = new DynamicQuestConfigGenerator(group._id.toString(), baseURL);
                        const config = await generator.generateDynamicConfig();
                        console.log(`✅ Auto-generated dynamic config for group ${group._id} after quest deletion:`, config.metadata);
                    } catch (groupConfigError) {
                        console.error(`⚠️ Auto-config generation failed for group ${group._id}:`, groupConfigError.message);
                    }
                }
            }
        } catch (configError) {
            console.error(`⚠️ Auto-config generation failed after quest deletion:`, configError.message);
            // Don't fail the entire request if config generation fails
        }

        res.status(200).json({
            success: true,
            message: "Quest deleted successfully"
        });

    } catch (error) {
        console.error("Error deleting quest:", error);
        res.status(500).json({
            success: false,
            message: "Error deleting quest",
            error: error.message
        });
    }
};

// Update MCQ Quest
const updateQuest = async (req, res) => {
    try {
        const { questId } = req.params;
        const { questTitle, professorId, tasks } = req.body;

        if (!questTitle || !professorId || !tasks || !Array.isArray(tasks)) {
            return res.status(400).json({ 
                success: false, 
                message: "Missing required fields: questTitle, professorId, and tasks array" 
            });
        }

        // Find and update the quest
        const quest = await Quest.findById(questId);
        if (!quest) {
            return res.status(404).json({
                success: false,
                message: "Quest not found"
            });
        }

        quest.questTitle = questTitle;
        await quest.save();

        // Delete existing tasks and hints
        await Task.deleteMany({ quest: questId });
        await Hint.deleteMany({ quest: questId });

        // Create new tasks
        for (const taskData of tasks) {
            // Determine answer and answerType based on task type
            let answer = '';
            let answerType = '';
            if (taskData.type === 'multiple-choice' || !taskData.type) {
                answer = taskData.correctAnswer;
                answerType = 'singleAnswer';
            } else if (taskData.type === 'quiz') {
                answer = Array.isArray(taskData.correctAnswers) ? taskData.correctAnswers.join(',') : (taskData.correctAnswers || '');
                answerType = 'multipleAnswers';
            } else if (taskData.type === 'get-issue-count' || taskData.type === 'get-pr-count' || taskData.type === 'get-open-issue' || taskData.type === 'get-top-contributor' || taskData.type === 'get-issue-title') {
                answer = '';
                answerType = 'metric';
            } else if (taskData.type === 'text-input') {
                answer = taskData.expectedAnswer || '';
                answerType = 'singleAnswer';
            } else if (taskData.type === 'custom-api-call') {
                answer = '';
                answerType = 'custom';
            } else if (taskData.type === 'llm-text-validation') {
                answer = '';
                answerType = 'llm-validation';
            } else if (taskData.type === 'collect-info') {
                answer = '';
                answerType = 'text';
            } else {
                answer = taskData.correctAnswer || '';
                answerType = 'singleAnswer';
            }
            const newTask = new Task({
                taskTitle: taskData.title,
                quest: questId,
                professor: professorId,
                desc: taskData.description,
                objective: taskData.objective,
                outcome: taskData.outcome,
                helpText: taskData.helpText,
                points: taskData.points || 100,
                xp: taskData.points || 100,
                answer,
                answerType,
                type: taskData.type,
                ossRepository: taskData.ossRepository || taskData.config?.ossRepository,
                issueNumber: taskData.issueNumber || taskData.config?.issueNumber,
                // Custom API call fields
                apiEndpoint: taskData.apiEndpoint || taskData.config?.apiEndpoint || '',
                responsePath: taskData.responsePath || taskData.config?.responsePath || '',
                expectedAnswerType: taskData.expectedAnswerType || taskData.config?.expectedAnswerType || 'Number',
                repository: taskData.repository || taskData.config?.repository || '',
                // Tolerance fields
                enableTolerance: taskData.enableTolerance || taskData.config?.enableTolerance || false,
                toleranceRange: taskData.toleranceRange || taskData.config?.toleranceRange || 10,
                // LLM Text Validation fields
                llmTextValidation: {
                    question: taskData.llmTextValidation?.question || taskData.config?.llmTextValidation?.question || '',
                    validationParameters: taskData.llmTextValidation?.validationParameters || taskData.config?.llmTextValidation?.validationParameters || [],
                    temperature: taskData.llmTextValidation?.temperature || taskData.config?.llmTextValidation?.temperature || 0.1,
                    enableDetailedFeedback: taskData.llmTextValidation?.enableDetailedFeedback || taskData.config?.llmTextValidation?.enableDetailedFeedback || false
                },
                responses: {
                    accept: generateAcceptResponse(taskData),
                    error: generateErrorResponse(taskData),
                    success: generateSuccessResponse(taskData)
                }
            });

            await newTask.save();
            quest.tasks.push(newTask._id);

            // Save hints if provided
            if (taskData.hints && Array.isArray(taskData.hints) && taskData.hints.length > 0) {
                for (const hintData of taskData.hints) {
                    const newHint = new Hint({
                        quest: questId,
                        task: newTask._id,
                        professor: professorId,
                        sequence: hintData.sequence,
                        penalty: hintData.penalty,
                        content: hintData.content
                    });
                    await newHint.save();
                    newTask.hints.push(newHint._id);
                }
                await newTask.save();
            }
        }

        await quest.save();

        // Automatically generate dynamic config for all groups owned by this professor
        try {
            const DynamicQuestConfigGenerator = require('../services/DynamicQuestConfigGenerator');
            const baseURL = req.get('host') ? `https://${req.get('host')}` : 'https://oss-michael-production.up.railway.app';
            
            // Get all groups owned by this professor
            const professor = await Professor.findById(professorId).populate('ownedGroups');
            if (professor && professor.ownedGroups) {
                for (const group of professor.ownedGroups) {
                    try {
                        const generator = new DynamicQuestConfigGenerator(group._id.toString(), baseURL);
                        const config = await generator.generateDynamicConfig();
                        console.log(`✅ Auto-generated dynamic config for group ${group._id} after quest update:`, config.metadata);
                    } catch (groupConfigError) {
                        console.error(`⚠️ Auto-config generation failed for group ${group._id}:`, groupConfigError.message);
                    }
                }
            }
        } catch (configError) {
            console.error(`⚠️ Auto-config generation failed after quest update:`, configError.message);
            // Don't fail the entire request if config generation fails
        }

        res.status(200).json({
            success: true,
            message: "Quest updated successfully",
            data: {
                questId: quest._id,
                questTitle: quest.questTitle,
                taskCount: quest.tasks.length
            }
        });

    } catch (error) {
        console.error("Error updating quest:", error);
        res.status(500).json({
            success: false,
            message: "Error updating quest",
            error: error.message
        });
    }
};

// Get quest by ID with populated tasks
const getQuestById = async (req, res) => {
    try {
        const { questId } = req.params;
        
        const quest = await Quest.findById(questId).populate({
            path: 'tasks',
            model: 'Task'
        });
        
        if (!quest) {
            return res.status(404).json({
                success: false,
                message: "Quest not found"
            });
        }
        
        res.status(200).json({
            success: true,
            data: quest
        });
    } catch (error) {
        console.error("Error fetching quest by ID:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching quest",
            error: error.message
        });
    }
};

// Get quest task types analysis
const getQuestTaskTypes = async (req, res) => {
    try {
        const { questId } = req.params;
        
        const quest = await Quest.findById(questId).populate({
            path: 'tasks',
            model: 'Task'
        });
        
        if (!quest) {
            return res.status(404).json({
                success: false,
                message: "Quest not found"
            });
        }
        
        // Analyze task types
        const taskTypes = quest.tasks.map(task => ({
            taskId: task._id,
            taskTitle: task.taskTitle,
            type: task.type,
            answerType: task.answerType,
            ossRepository: task.ossRepository
        }));
        
        // Count task types
        const typeCounts = {};
        quest.tasks.forEach(task => {
            const type = task.type || 'unknown';
            typeCounts[type] = (typeCounts[type] || 0) + 1;
        });
        
        // Determine overall quest type
        const uniqueTypes = Object.keys(typeCounts);
        let questType = 'unknown';
        if (uniqueTypes.length === 1) {
            const singleType = uniqueTypes[0];
            if (singleType === 'multiple-choice') questType = 'mcq';
            else if (['get-issue-count', 'get-pr-count', 'get-open-issue', 'get-top-contributor', 'get-issue-title'].includes(singleType)) questType = 'metric';
            else questType = singleType;
        } else if (uniqueTypes.length > 1) {
            questType = 'mixed';
        }
        
        res.status(200).json({
            success: true,
            data: {
                questId: quest._id,
                questTitle: quest.questTitle,
                totalTasks: quest.tasks.length,
                questType: questType,
                taskTypes: taskTypes,
                typeCounts: typeCounts,
                uniqueTypes: uniqueTypes
            }
        });
    } catch (error) {
        console.error("Error analyzing quest task types:", error);
        res.status(500).json({
            success: false,
            message: "Error analyzing quest task types",
            error: error.message
        });
    }
};

module.exports = {
    uploadMCQQuest,
    getQuestsByProfessor,
    getAllQuests,
    deleteQuest,
    updateQuest,
    getQuestById,
    getQuestTaskTypes
}; 