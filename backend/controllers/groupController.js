const Professor = require("../models/ProfessorModel");
const Group = require("../models/GroupModel");
const Quest = require("../models/QuestModel");
const Task = require("../models/TaskModel")
const Hint = require('../models/HintModel');


//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

const getProfessor = async(req, res) => {
    const {professorID} = req.params;
    if (!professorID) { 
        return res.status(404).json({error: "No professor provided"})
    }
    try{ 
        const professor = await Professor.findById(professorID)
        if (!professor) { 
            return res.status(401).json({error: `No professor with id ${professorID} found`})
        }
        
        return res.status(200).json({
            profName: professor.name,
            email: professor.email,
            groups: professor.ownedGroups,
            quests: professor.quests
        });
    } catch(error) {
        console.debug(`Error in getProfessor function: ${error}`)
        return res.status(500).json({error})
    }
}

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// the following functions are specifically for group creation
// and displaying the groups on the professor's profile

//create a group for a professor
const createGroup = async (req, res) =>  { 
    const {professorID} = req.params;
    const {groupName} = req.body; 

    if (!professorID) { 
        return res.status(404).json({error: "No professor provided"})
    }
    if (!groupName) { 
        return res.status(404).json({error: "Please provide a group name"})
    }

    try{ 
        const professor = await Professor.findById(professorID)
        if (!professor) { 
            return res.status(401).json({error: `No professor with id ${professorID} found`})
        }

        let newGroup = new Group({ 
            groupName,
            professor: professorID
        })

        await newGroup.save()

        professor.ownedGroups.push(newGroup._id); 
        await professor.save()

        if (newGroup) {
            res.status(201).json({
                professorID: newGroup.professor, 
                groupName: newGroup.groupName
            })
        } else { 
            return res.status(400).json({error: `Error creating new group for professor with id ${professorID}`})
        }
    }catch(error) {
        console.debug(`Error in newGroup function: ${error}`)
        return res.status(500).json({error})
    }
}


// given professorID
// get a list of all the professor's groups
const getGroups = async (req, res) => {
    const { professorID } = req.params;

    try{ 
        console.log(professorID)
        const prof = await Professor.findById(professorID)
        console.log(prof)
        if (!prof) { 
            return res.status(400).json({error: "No professor provided"})
        }

        res.status(200).json({
            groups: prof.ownedGroups
        });
        
    } catch(error) { 
        console.debug(`Error in getGroups function: ${error}`)
        return res.status(500).json({error})
    }
}

// given professorID and groupID
//return info for one of professor's groups
const getGroup = async (req, res ) => {
    const { professorID, groupID } = req.params;

    try{ 
        const professorExists = await Professor.findById(professorID)
        if (!professorExists) { 
            return res.status(400).json({error: "No professor provided"})
        }

        if (!professorExists.ownedGroups.includes(groupID)) {
            return res.status(403).json({ error: `Group with ID ${groupID} is not owned by professor ${professorID}` });
        }

        const group = await Group.findById(groupID);
        if (!group) {
            return res.status(404).json({ error: `Group with ID ${groupID} not found` });
        }

        res.status(200).json({
            groupID: group._id,
            groupName: group.groupName,
            professorID: group.professor,
            members: group.members,
            admin: group.admin,
            quests: group.quests,
        });
        
    } catch(error) { 
        console.debug(`Error in getGroup function: ${error}`)
        return res.status(500).json({error})
    }
}

// delete a group and all its quests, tasks, and hints
const deleteGroup = async(req, res) => { 
    const { professorID, groupID } = req.params;

    try {
        const professor = await Professor.findById(professorID)
        if (!professor) { 
            return res.status(400).json({error: `Professor with ID ${professorID} not found`})
        }

        if (!professor.ownedGroups.includes(groupID)) {
            return res.status(400).json({ error: `Group with ID ${groupID} is not owned by professor ${professorID}` });
        }

        const group = await Group.findByIdAndDelete(groupID);
        if (!group) { 
            return res.status(400).json({error: `Group with ID ${groupID} not found`})
        }

        professor.ownedGroups = professor.ownedGroups.filter(groupID => groupID !== groupID);
        await professor.save(); 

        res.status(200).json({message: `Group with ID ${groupID} successfully deleted`})
    } catch(error) { 
        console.debug(`Error in deleteGroup function: ${error}`)
        return res.status(500).json({error})
    }
}

const addStudentToGroup = async(req, res) => {

}

const addAdministrator = async (req, res ) => { 
    //! determine what access they will have 
}


// create a code to give students to register with
const generateGroupCode = async(req, res) => {

}

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// these functions are for dealing with quests

// create a new quest, independent of a group
const createQuest = async(req, res) => {
    const {professorID} = req.params;
    const {questTitle, prerequisites} = req.body; 

    try{ 
        const professor = await Professor.findById(professorID)
        if (!professor) { 
            return res.status(400).json({error: "No professor found"})
        }

        let newQuest = new Quest ({ 
            questTitle, 
            prerequisites,
            professor: professorID
        })

        await newQuest.save()

        professor.quests.push(newQuest._id)
        await professor.save(); 

        res.status(201).json({ 
            questID: newQuest._id,
            questTitle: newQuest.questTitle,
            prerequisites: newQuest.prerequisites
        })
    } catch(error) {
        console.debug(`Error in createQuest function: ${error}`)
        return res.status(500).json({error})
    }
}

// add a quest to a group 
const addQuestToGroup = async(req, res) => { 
    const {professorID, groupID, questID} = req.params;

    try{ 
        const professor = await Professor.findById( professorID )
        if (!professor) { 
            return res.status(400).json({error: "No professor provided"})
        }
        if (!professor.ownedGroups.includes(groupID)) { 
            return res.status(400).json({error: `Group with ID ${groupID} is not owned by professor ${professorID}`})
        }
        const group = await Group.findById(groupID)
        if (!group) {
            return res.status(400).json({error: `No group with id ${groupID} found`})
        }

        const quest = await Quest.findById(questID);
        if (!quest) {
            return res.status(400).json({ error: `No quest with id ${questID} found` });
        }
        if (group.quests.includes(questID)) {
            return res.status(400).json({ error: `Quest with ID ${questID} is already added to this group` });
        }

        group.quests.push(questID);
        await group.save();

        quest.groups.push(groupID);
        await quest.save();

        res.status(201).json({ 
            questID: quest._id,
            questTitle: quest.questTitle,
            groupID: quest.group,
            prerequisites: quest.prerequisites
        })
    } catch(error) { 
        console.debug(`Error in addQuest function: ${error}`)
        return res.status(500).json({error})
    }
}

// get all quests from a professor
const getQuests = async(req, res) => {
    const {professorID} = req.params;
    try{ 
        const professor = await Professor.findById(professorID).populate('quests')
        if (!professor) { 
            return res.status(400).json({error: "No professor found"})
        }

        res.status(200).json({
            quests: professor.quests
        })
    } catch(error) { 
        console.debug(`Error in getQuests function: ${error}`)
        return res.status(500).json({error})
    }
}

const getQuestsInGroup = async(req, res) => { 

}

const removeQuestFromGroup = async(req, res) => {

}

// update a specific quest
const updateQuest = async(req, res) => { 
    const { professorID, questID } = req.params;
    const { questTitle, prerequisites } = req.body; 

    try{ 
        const professor = await Professor.findById(professorID)
        if (!professor) { 
            return res.status(400).json({error: "No professor provided"})
        }
        if (!professor.ownedGroups.includes(groupID)) { 
            return res.status(400).json({error: `Group with ID ${groupID} is not owned by professor ${professorID}`})
        }

        const quest = await Quest.findById(questID)
        if (!quest) { 
            return res.status(400).json({error: `Quest ${questID} not found`})
        }

        quest.questTitle  = questTitle || quest.questTitle
        quest.prerequisites = prerequisites || quest.prerequisites

        await quest.save()

        res.status(200).json({
            questID: quest._id,
            questTitle: quest.questTitle,
            groupID: quest.group,
            prerequisites: quest.prerequisites
        })
    } catch(error) {
        console.debug(`Error in updateQuest function: ${error}`)
        return res.status(500).json({error})
    }
}

// delete a quest and all of its tasks and hints
const deleteQuest = async(req, res) => { 
    const {professorID, groupID, questID} = req.params

    try{ 
        const professor = await Professor.findById(professorID)
        if (!professor) { 
            return res.status(400).json({error: "No professor provided"})
        }
        if (!professor.ownedGroups.includes(groupID)) { 
            return res.status(400).json({error: `Group with ID ${groupID} is not owned by professor ${professorID}`})
        }

        const quest = await Quest.findById(questID) 
        if (!quest) {
            return res.status(400).json({error: `Quest ${questID} not found`})
        }

        await Task.deleteMany({quest: questID})
        await Hint.deleteMany({quest: questID})
        await Quest.findByIdAndDelete({questID})

        res.status(200).json({message: `Quest ${questID} and associated tasks/hints have been deleted`})
    } catch(error) { 
        console.debug(`Error in deleteQuest function: ${error}`)
        return res.status(500).json({error})
    }
}

// get all info of a specific quest
const getQuest = async(req, res) => { 
    const { professorID, groupID, questID } = req.params;

    try{ 
        const professor = await Professor.findById(professorID)
        if (!professor) { 
            return res.status(400).json({error: "No professor provided"})
        }
        if (!professor.ownedGroups.includes(groupID)) { 
            return res.status(400).json({error: `Group with ID ${groupID} is not owned by professor ${professorID}`})
        }

        const quest = await Quest.findById(questID)
        if (!quest) {
            return res.status(400).json({error: `Quest ${questID} not found`})
        }

        res.status(200).json({
            questID: newQuest._id,
            questTitle: newQuest.questTitle,
            groupID: newQuest.group,
            prerequisites: newQuest.prerequisites
        })
    } catch(error) { 
        console.debug(`Error in getQuest function: ${error}`)
        return res.status(500).json({error})
    }
}




//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// these functions are for dealing with tasks

// add a task to a specific quest
const addTask = async(req, res) => { 
    const {questID} = req.params
    const { groupID, professorID, taskTitle, desc, points, xp, hints, responses, answer } = req.body;
    try{ 
        const professor = await Professor.findById(professorID)
        if (!professor) { 
            return res.status(400).json({error: "No professor provided"})
        }
        if (!professor.ownedGroups.includes(groupID)) { 
            return res.status(400).json({error: `Group with ID ${groupID} is not owned by professor ${professorID}`})
        }

        const quest = await Quest.findById(questID)
        if (!quest) {
            return res.status(400).json({error: `Quest ${questID} not found`})
        }

        const group = await Group.findById(groupID)
        if (!group) {
            return res.status(400).json({error: `No group with id ${groupID} found`})
        }

        const newTask = new Task({
            taskTitle,
            quest: questID,
            group: groupID,
            professor: professorID,
            desc,
            points,
            xp,
            hints: hints || [],
            responses,
            answer
        });

        await newTask.save()

        quest.tasks.push(newTask._id)
        await quest.save()

        res.status(201).json({
            taskID: newTask._id,
            taskTitle: newTask.taskTitle,
            description: newTask.desc,
            points: newTask.points,
            xp: newTask.xp
        });
    } catch(error) { 
        console.debug(`Error in addTask function: ${error}`)
        return res.status(500).json({error})
    }
}

// get all tasks from a specific quest
const getTasks = async(req, res) => { 
    const {questID} = req.params
    try { 
        const quest = await Quest.findById(questID)
        if (!quest) { 
            return res.status(400).json({error: `Quest with ID ${questID} not found`})
        }
        
        const tasks = await Task.find({quest: questID});

        res.status(200).json({
            tasks: tasks
        })
    } catch(error) { 
        console.debug(`Error in getTasks function: ${error}`)
        return res.status(500).json({error})
    }
}

// update one task
const updateTask = async(req, res) => { 
    const {taskID} = req.params;
    const {taskTitle, desc, points, xp, hints, responses, answer} = req.body

    try{ 
        const task = await Task.findById(taskID);
        if(!task) { 
            return res.status(400).json({error: `Task with ID ${taskID} not found`})
        }
        task.taskTitle = taskTitle || task.taskTitle;
        task.desc = desc || task.desc;
        task.points = points || task.points;
        task.xp = xp || task.xp;
        task.hints = hints || task.hints;
        task.responses = responses || task.responses;
        task.answer = answer || task.answer;

        await task.save(); 
        res.status(200).json({ 
            taskID: task._id,
            taskTitle: task.taskTitle,
            description: task.desc,
            points: task.points,
            xp: task.xp
        })
    } catch(error) { 
        console.debug(`Error in updateTask function: ${error}`);
        return res.status(500).json({ error });
    }
}

// delete a task and all its hints
const deleteTask = async(req, res) => { 
    const {taskID} = req.params; 
    try {
        const task = await Task.findByIdAndDelete(taskID)
        if (!task) { 
            return res.status(400).json({error: `Task with ID ${taskID} not found`})
        }

        await Hint.deleteMany({task: taskID})
        res.status(200).json({message: `Task with ID ${taskID} successfully deleted`})
    } catch(error) { 
        console.debug(`Error in deleteTask function: ${error}`);
        return res.status(500).json({ error });
    }
}

// get all the info of a specific task 
const getTask = async(req, res) => { 
    const {taskID} = req.params; 
    try{ 
        const task = await Task.findById(taskID)
        if (!task) { 
            return res.status(400).json({error: `Task with ID ${taskID} not found`})
        }

        res.status(200).json({
            taskID: task._id,
            taskTitle: task.taskTitle,
            description: task.desc,
            points: task.points,
            xp: task.xp,
            hints: task.hints,  // Return the populated hints
            responses: task.responses,
            answer: task.answer
        })
    } catch(error) { 
        console.debug(`Error in getTask function: ${error}`);
        return res.status(500).json({ error });
    }
}




//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// these functions are for dealing with hints



// given a prof, group, quest, and task, add a hint
const addHint = async(req, res) => {
    const {questID, taskID , groupID, professorID} = req.params;
    const {temporaryID, sequence, penalty, content} = req.body; 

    try{ 
        const quest = await Quest.findById(questID);
        if (!quest) {
            return res.status(404).json({ error: `Quest with ID ${questID} not found` });
        }

        const task = await Task.findById(taskID);
        if (!task) {
            return res.status(404).json({ error: `Task with ID ${taskID} not found` });
        }

        const group = await Group.findById(groupID);
        if (!group) {
            return res.status(404).json({ error: `Group with ID ${groupID} not found` });
        }

        const professor = await Professor.findById(professorID);
        if (!professor) {
            return res.status(404).json({ error: `Professor with ID ${professorID} not found` });
        }

        const newHint = new Hint({ 
            quest: questID,
            task: taskID,
            group: groupID,
            professor: professorID,
            temporaryID,
            sequence,
            penalty,
            content
        })

        await newHint.save()

        tasks.hints.push(newHint._id)
        await task.save()

        res.status(201).json({
            hintID: newHint._id,
            temporaryID: newHint.temporaryID,
            sequence: newHint.sequence,
            content: newHint.content
        });
    } catch(error) {
        console.debug(`Error in addHint function: ${error}`);
        return res.status(500).json({ error });
    }
}


const getHints = async(req, res) => {
    const {taskID} = req.params;
    try { 
        const task = await Task.findById(taskID);
        if (!task) {
            return res.status(404).json({ error: `Task with ID ${taskID} not found` });
        }

        const hints = await Hint.find({ task: taskID }).sort({ sequence: 1 });

        res.status(200).json({ 
            hints: hints
        })
    } catch(error) { 
        console.debug(`Error in getHints function: ${error}`);
        return res.status(500).json({ error });
    }
}


const updateHint = async(req, res) => {
    const {hintID} = req.params;
    const {sequence, penalty, content} = req.body

    try{ 
        const hint = await Hint.findById(hintID);
        if (!hint) {
            return res.status(404).json({ error: `Hint with ID ${hintID} not found` });
        }

        hint.sequence = sequence || hint.sequence;
        hint.penalty = penalty || hint.penalty;
        hint.content = content || hint.content;

        await hint.save(); 

        res.status(200).json({ 
            hintID: hint._id,
            sequence: hint.sequence,
            penalty: hint.penalty,
            content: hint.content
        })
    } catch(error) { 
        console.debug(`Error in updateHint function: ${error}`);
        return res.status(500).json({ error });
    }
}


const deleteHint = async(req, res) => {
    const { hintID } = req.params;

    try {
        const hint = await Hint.findByIdAndDelete(hintID);
        if (!hint) {
            return res.status(400).json({ error: `Hint with ID ${hintID} not found` });
        }

        res.status(200).json({ message: `Hint with ID ${hintID} successfully deleted` });
    } catch (error) {
        console.debug(`Error in deleteHint function: ${error}`);
        return res.status(500).json({ error });
    }
}


const getHint = async(req, res) => {
    const { hintID } = req.params;

    try {
        const hint = await Hint.findById(hintID);
        if (!hint) {
            return res.status(400).json({ error: `Hint with ID ${hintID} not found` });
        }

        res.status(200).json({
            hintID: hint._id,
            temporaryID: hint.temporaryID,
            sequence: hint.sequence,
            penalty: hint.penalty,
            content: hint.content,
            task: hint.task,
            professor: hint.professor,
            group: hint.group
        });
    } catch (error) {
        console.debug(`Error in getHint function: ${error}`);
        return res.status(500).json({ error });
    }
}



module.exports = {
    getProfessor, 
    createGroup,
    getGroup,
    getGroups,
    deleteGroup,
    createQuest,
    addQuestToGroup,
    removeQuestFromGroup,
    getQuests, 
    getQuestsInGroup,
    updateQuest, 
    deleteQuest, 
    getQuest, 
    addTask,
    getTasks, 
    updateTask, 
    deleteTask, 
    getTask, 
    addHint, 
    getHints, 
    updateHint, 
    deleteHint, 
    getHint,
}