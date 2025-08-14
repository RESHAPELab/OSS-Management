const Quest = require("../models/QuestModel");
const Task = require("../models/TaskModel");

// POST /api/generatejson/quest
exports.createQuest = async (req, res) => {
  try {
    const { questTitle, professorId, tasks } = req.body;
    if (!questTitle || !professorId || !tasks || !Array.isArray(tasks)) {
      return res.status(400).json({ success: false, message: "Missing required fields: questTitle, professorId, and tasks array" });
    }
    const newQuest = new Quest({ questTitle, professor: professorId, tasks: [] });
    await newQuest.save();
    for (const taskData of tasks) {
      // Handle task types and answer/answerType mapping
      let answer = '';
      let answerType = '';
      
      if (taskData.type === 'custom-api-call') {
        answer = '';
        answerType = 'custom';
      } else if (taskData.type === 'llm-text-validation') {
        // LLM validation tasks have no static answer; use dedicated type to bypass answer requirement
        answer = '';
        answerType = 'llm-validation';
      } else if (taskData.type === 'multiple-choice' || !taskData.type) {
        answer = taskData.correctAnswer || '';
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
      } else {
        answer = taskData.correctAnswer || '';
        answerType = 'singleAnswer';
      }
      
      const newTask = new Task({ 
        ...taskData, 
        quest: newQuest._id, 
        professor: professorId,
        answer,
        answerType
      });
      await newTask.save();
      newQuest.tasks.push(newTask._id);
    }
    await newQuest.save();
    res.status(201).json({ success: true, data: newQuest });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/generatejson/quests/:professorId
exports.getQuestsByProfessor = async (req, res) => {
  try {
    const { professorId } = req.params;
    const quests = await Quest.find({ professor: professorId }).populate('tasks');
    res.status(200).json({ success: true, data: quests });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/generatejson/quest/:questId
exports.getQuestById = async (req, res) => {
  try {
    const { questId } = req.params;
    const quest = await Quest.findById(questId).populate('tasks');
    if (!quest) return res.status(404).json({ success: false, message: "Quest not found" });
    res.status(200).json({ success: true, data: quest });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/generatejson/quest/:questId
exports.updateQuest = async (req, res) => {
  try {
    const { questId } = req.params;
    const { questTitle, tasks } = req.body;
    const quest = await Quest.findById(questId);
    if (!quest) return res.status(404).json({ success: false, message: "Quest not found" });
    if (questTitle) quest.questTitle = questTitle;
    if (tasks && Array.isArray(tasks)) {
      // Remove old tasks
      await Task.deleteMany({ _id: { $in: quest.tasks } });
      quest.tasks = [];
      for (const taskData of tasks) {
        // Handle task types and answer/answerType mapping
        let answer = '';
        let answerType = '';
        
        if (taskData.type === 'custom-api-call') {
          answer = '';
          answerType = 'custom';
        } else if (taskData.type === 'llm-text-validation') {
          answer = '';
          answerType = 'llm-validation';
        } else if (taskData.type === 'multiple-choice' || !taskData.type) {
          answer = taskData.correctAnswer || '';
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
        } else {
          answer = taskData.correctAnswer || '';
          answerType = 'singleAnswer';
        }
        
        const newTask = new Task({ 
          ...taskData, 
          quest: quest._id, 
          professor: quest.professor,
          answer,
          answerType
        });
        await newTask.save();
        quest.tasks.push(newTask._id);
      }
    }
    await quest.save();
    res.status(200).json({ success: true, data: quest });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/generatejson/quest/:questId
exports.deleteQuest = async (req, res) => {
  try {
    const { questId } = req.params;
    const quest = await Quest.findById(questId);
    if (!quest) return res.status(404).json({ success: false, message: "Quest not found" });
    await Task.deleteMany({ _id: { $in: quest.tasks } });
    await quest.deleteOne();
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}; 