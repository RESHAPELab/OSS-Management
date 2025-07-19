const Quest = require("../models/QuestModel");
const Task = require("../models/TaskModel");
const Hint = require("../models/HintModel");
const Professor = require("../models/ProfessorModel");

// Helper functions for generating responses
const generateAcceptResponse = (taskData) => {
    return `**Objective:** ${taskData.objective || 'Learn about this topic'}

**Task:** ${taskData.description || 'Complete the task as described'}

**Options:**
A) ${taskData.options[0] || 'Option A'}
B) ${taskData.options[1] || 'Option B'}
C) ${taskData.options[2] || 'Option C'}
D) ${taskData.options[3] || 'Option D'}

**Outcome:** ${taskData.outcome || 'You will understand this concept better'}

**Help:** ${taskData.helpText || 'Type "help" for hints if needed'}

Choose the option that best answers the question.`;
};

const generateErrorResponse = (taskData) => {
    return `❌ **Incorrect Answer**

That's not the right answer. Please review the question and try again.

**Hint:** ${taskData.helpText || 'Think carefully about the options provided'}

You can type "help" for additional hints (though it may cost you points).`;
};

const generateSuccessResponse = (taskData) => {
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
                answer: taskData.correctAnswer,
                answerType: 'singleAnswer',
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
            const baseURL = req.get('host') ? `http://${req.get('host')}` : 'http://localhost:8080';
            
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
                answer: taskData.correctAnswer,
                answerType: 'singleAnswer',
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
            const baseURL = req.get('host') ? `http://${req.get('host')}` : 'http://localhost:8080';
            
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

module.exports = {
    uploadMCQQuest,
    getQuestsByProfessor,
    deleteQuest,
    updateQuest
}; 