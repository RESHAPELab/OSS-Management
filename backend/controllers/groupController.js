const Quest = require("../models/QuestModel");
const Task = require("../models/TaskModel")
const Hint = require('../models/HintModel');
const Student = require("../models/StudentModel");
const Professor = require('../models/ProfessorModel')
const Group = require('../models/GroupModel')
const Readme = require("../models/ReadmeModel");
const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');
const UserStoredData = require('../models/UserStoredData');

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
            _id: professor._id,
            profName: professor.name,
            email: professor.email,
            groups: professor.ownedGroups,
            quests: professor.quests,
            verified: professor.verified
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

        let hash = 0; 
        for (let i = 0; i < groupName.length; i++ ) {
            hash = (hash<<5) - hash + groupName.charCodeAt(i);
            hash &= hash; 
        }
        const randomFactor = Math.floor(Math.random() * 1000);
        const combined = Math.abs(hash + randomFactor); 
        let classCode = combined % 1000000;
        classCode = classCode.toString().padStart(6, '0');

        let newGroup = new Group({ 
            groupName,
            professor: professorID,
            classCode
        })

        await newGroup.save()

        professor.ownedGroups.push(newGroup._id); 
        await professor.save()

        if (newGroup) {
            res.status(201).json({
                _id: newGroup._id, // Add the _id field
                professorID: newGroup.professor, 
                groupName: newGroup.groupName,
                classCode: newGroup.classCode,
                active: true
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
        const prof = await Professor.findById(professorID).populate({
            path: 'ownedGroups',
            select: 'groupName classCode active students createdAt updatedAt',
            options: { sort: { createdAt: -1 } } // Sort by creation date descending
        });
        
        if (!prof) { 
            return res.status(400).json({error: "No professor provided"})
        }

        // Add student count to each group
        const groupsWithCount = prof.ownedGroups.map(group => ({
            ...group.toObject(),
            studentCount: group.students ? group.students.length : 0
        }));

        res.status(200).json({
            groups: groupsWithCount
        });
        
    } catch(error) { 
        console.debug(`Error in getGroups function: ${error}`)
        return res.status(500).json({error})
    }
}

const getGroupByCode = async (req, res) => {
    const {classCode} = req.params; 
    try {

        const group = await Group.findOne({classCode})
        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        console.log('group', group)
        res.status(200).json(group);
    } catch (error) { 
        console.debug(`Error in getGroupByCode function: ${error}`)
        return res.status(500).json({error})
    }
}

// given professorID and groupID
//return info for one of professor's groups
const getGroup = async (req, res ) => {
    const { groupID } = req.params;
    try{ 
        const group = await Group.findById(groupID).populate('students');
        if (!group) {
            return res.status(404).json({ error: `Group with ID ${groupID} not found` });
        }

        res.status(200).json({
            groupID: group._id,
            groupName: group.groupName,
            professorID: group.professor,
            students: group.students,
            admin: group.admin,
            quests: group.quests,
            classCode: group.classCode
        });
        
    } catch(error) { 
        console.debug(`Error in getGroup function: ${error}`)
        return res.status(500).json({error})
    }
}

// delete a group and all its quests, tasks, and hints
const deleteGroup = async(req, res) => { 
    const { professorID, groupID } = req.params;

    //! change this to disable group
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

const addAdministrator = async (req, res ) => { 
    //! determine what access they will have 
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
    const { professorID, groupID, questID } = req.params;
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




//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
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

const saveGroupReadme = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { content, fileName } = req.body;

        if (!content) {
            return res.status(400).json({ message: "README content is required" });
        }

        // Check if group exists
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        // Find existing README or create new one
        let readme = await Readme.findOne({ group: groupId });
        
        if (readme) {
            // Update existing README
            readme.content = content;
            readme.fileName = fileName || 'README.md';
        } else {
            // Create new README
            readme = new Readme({
                group: groupId,
                content: content,
                fileName: fileName || 'README.md'
            });
        }

        await readme.save();

        res.status(200).json({
            message: "README saved successfully",
            readme: {
                id: readme._id,
                fileName: readme.fileName,
                contentLength: readme.content.length
            }
        });
    } catch (error) {
        console.error("Error saving README:", error);
        res.status(500).json({ message: "Error saving README", error: error.message });
    }
};

const getGroupReadme = async (req, res) => {
    try {
        const { groupId } = req.params;

        // Check if group exists
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        // Find existing README
        const readme = await Readme.findOne({ group: groupId });
        
        if (!readme) {
            return res.status(404).json({ message: "No README found for this group" });
        }

        res.status(200).json({
            readme: {
                id: readme._id,
                fileName: readme.fileName,
                contentLength: readme.content.length,
                content: readme.content
            }
        });
    } catch (error) {
        console.error("Error fetching README:", error);
        res.status(500).json({ message: "Error fetching README", error: error.message });
    }
};

// Quest Order Management Functions
const saveQuestOrder = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { questOrder } = req.body;

        if (!questOrder || !Array.isArray(questOrder)) {
            return res.status(400).json({ message: "Quest order array is required" });
        }

        // Generate dynamic prerequisites based on quest order
        const questOrderWithPrerequisites = questOrder.map((quest, index) => {
            const prerequisites = generateDynamicPrerequisites(questOrder, index);
            
            return {
                questId: quest.questId || quest.id || quest._id,
                questType: quest.questType || quest.type || 'custom',
                sequenceNumber: quest.sequenceNumber || index,
                title: quest.title || quest.questTitle || quest.content || 'Unknown Quest',
                isQ0: quest.isQ0 || false,
                prerequisites: prerequisites
            };
        });

        // Try to update with retry logic for version conflicts
        let updatedGroup = null;
        let retryCount = 0;
        const maxRetries = 3;

        while (retryCount < maxRetries) {
            try {
                // Use findByIdAndUpdate to avoid version conflicts
                updatedGroup = await Group.findByIdAndUpdate(
                    groupId,
                    {
                        questOrder: questOrderWithPrerequisites,
                        questOrderLastUpdated: new Date()
                    },
                    { 
                        new: true, 
                        runValidators: true,
                        // Add optimistic concurrency control
                        versionKey: false
                    }
                );

                if (updatedGroup) {
                    break; // Success, exit retry loop
                }
            } catch (updateError) {
                retryCount++;
                console.log(`Retry ${retryCount}/${maxRetries} for group ${groupId}:`, updateError.message);
                
                if (retryCount >= maxRetries) {
                    throw updateError;
                }
                
                // Wait a bit before retrying
                await new Promise(resolve => setTimeout(resolve, 100 * retryCount));
            }
        }

        if (!updatedGroup) {
            return res.status(404).json({ message: "Group not found" });
        }

        // Automatically generate dynamic config after saving quest order
        try {
            const DynamicQuestConfigGenerator = require('../services/DynamicQuestConfigGenerator');
            const baseURL = req.get('host') ? `http://${req.get('host')}` : 'http://localhost:8080';
            const generator = new DynamicQuestConfigGenerator(groupId, baseURL);
            const config = await generator.generateDynamicConfig();
            
            console.log(`✅ Auto-generated dynamic config for group ${groupId}:`, config.metadata);
        } catch (configError) {
            console.error(`⚠️ Auto-config generation failed for group ${groupId}:`, configError.message);
            // Don't fail the entire request if config generation fails
        }

        res.status(200).json({
            message: "Quest order and prerequisites saved successfully",
            questOrder: updatedGroup.questOrder,
            lastUpdated: updatedGroup.questOrderLastUpdated
        });
    } catch (error) {
        console.error("Error saving quest order:", error);
        
        // Provide more specific error messages
        if (error.name === 'VersionError') {
            res.status(409).json({ 
                message: "Quest order was modified by another operation. Please try again.",
                error: "Version conflict detected"
            });
        } else {
            res.status(500).json({ 
                message: "Error saving quest order", 
                error: error.message 
            });
        }
    }
};

// Helper function to generate dynamic prerequisites
const generateDynamicPrerequisites = (questOrder, currentIndex) => {
    const prerequisites = [];
    
    // Q0 has no prerequisites
    if (currentIndex === 0) {
        return [];
    }
    
    // For all other quests, prerequisite is the previous quest
    if (currentIndex > 0) {
        const previousQuest = questOrder[currentIndex - 1];
        prerequisites.push({
            questId: previousQuest.questId || previousQuest.id || previousQuest._id,
            type: 'completion',
            required: true,
            description: `Complete ${previousQuest.title || previousQuest.questTitle || previousQuest.content} first`,
            minScore: 0
        });
    }
    
    return prerequisites;
};

const getQuestOrder = async (req, res) => {
    try {
        const { groupId } = req.params;

        // Check if group exists
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        // Return quest order if it exists, otherwise return default order
        if (group.questOrder && group.questOrder.length > 0) {
            res.status(200).json({
                questOrder: group.questOrder,
                lastUpdated: group.questOrderLastUpdated,
                hasCustomOrder: true
            });
        } else {
            // Return default quest order with prerequisites
            const defaultQuestOrder = [
                { 
                    questId: 'Q0', 
                    questType: 'fixed', 
                    sequenceNumber: 0, 
                    title: 'Q0: Introduction to Open Source', 
                    isQ0: true,
                    prerequisites: []
                },
                { 
                    questId: 'Q1', 
                    questType: 'fixed', 
                    sequenceNumber: 1, 
                    title: 'Q1: Understanding OSS Projects and GitHub Basics', 
                    isQ0: false,
                    prerequisites: [{
                        questId: 'Q0',
                        type: 'completion',
                        required: true,
                        description: 'Complete Q0: Introduction to Open Source first',
                        minScore: 0
                    }]
                },
                { 
                    questId: 'Q2', 
                    questType: 'fixed', 
                    sequenceNumber: 2, 
                    title: 'Q2: Forking and Contributing to Repositories', 
                    isQ0: false,
                    prerequisites: [{
                        questId: 'Q1',
                        type: 'completion',
                        required: true,
                        description: 'Complete Q1: Understanding OSS Projects and GitHub Basics first',
                        minScore: 0
                    }]
                },
                { 
                    questId: 'Q3', 
                    questType: 'fixed', 
                    sequenceNumber: 3, 
                    title: 'Q3: Creating Pull Requests and Code Reviews', 
                    isQ0: false,
                    prerequisites: [{
                        questId: 'Q2',
                        type: 'completion',
                        required: true,
                        description: 'Complete Q2: Forking and Contributing to Repositories first',
                        minScore: 0
                    }]
                }
            ];
            
            res.status(200).json({
                questOrder: defaultQuestOrder,
                lastUpdated: null,
                hasCustomOrder: false
            });
        }
    } catch (error) {
        console.error("Error fetching quest order:", error);
        res.status(500).json({ message: "Error fetching quest order", error: error.message });
    }
};

const resetQuestOrder = async (req, res) => {
    try {
        const { groupId } = req.params;

        // Reset to default quest order using findByIdAndUpdate to avoid version conflicts
        const defaultQuestOrder = [
            { 
                questId: 'Q0', 
                questType: 'fixed', 
                sequenceNumber: 0, 
                title: 'Q0: Introduction to Open Source', 
                isQ0: true,
                prerequisites: []
            },
            { 
                questId: 'Q1', 
                questType: 'fixed', 
                sequenceNumber: 1, 
                title: 'Q1: Understanding OSS Projects and GitHub Basics', 
                isQ0: false,
                prerequisites: [{
                    questId: 'Q0',
                    type: 'completion',
                    required: true,
                    description: 'Complete Q0: Introduction to Open Source first',
                    minScore: 0
                }]
            },
            { 
                questId: 'Q2', 
                questType: 'fixed', 
                sequenceNumber: 2, 
                title: 'Q2: Forking and Contributing to Repositories', 
                isQ0: false,
                prerequisites: [{
                    questId: 'Q1',
                    type: 'completion',
                    required: true,
                    description: 'Complete Q1: Understanding OSS Projects and GitHub Basics first',
                    minScore: 0
                }]
            },
            { 
                questId: 'Q3', 
                questType: 'fixed', 
                sequenceNumber: 3, 
                title: 'Q3: Creating Pull Requests and Code Reviews', 
                isQ0: false,
                prerequisites: [{
                    questId: 'Q2',
                    type: 'completion',
                    required: true,
                    description: 'Complete Q2: Forking and Contributing to Repositories first',
                    minScore: 0
                }]
            }
        ];

        const updatedGroup = await Group.findByIdAndUpdate(
            groupId,
            {
                questOrder: defaultQuestOrder,
                questOrderLastUpdated: new Date()
            },
            { new: true, runValidators: true }
        );

        if (!updatedGroup) {
            return res.status(404).json({ message: "Group not found" });
        }

        // Automatically generate dynamic config after resetting quest order
        try {
            const DynamicQuestConfigGenerator = require('../services/DynamicQuestConfigGenerator');
            const baseURL = req.get('host') ? `http://${req.get('host')}` : 'http://localhost:8080';
            const generator = new DynamicQuestConfigGenerator(groupId, baseURL);
            const config = await generator.generateDynamicConfig();
            
            console.log(`✅ Auto-generated dynamic config for group ${groupId} after reset:`, config.metadata);
        } catch (configError) {
            console.error(`⚠️ Auto-config generation failed for group ${groupId} after reset:`, configError.message);
            // Don't fail the entire request if config generation fails
        }

        res.status(200).json({
            message: "Quest order reset to default successfully",
            questOrder: updatedGroup.questOrder,
            lastUpdated: updatedGroup.questOrderLastUpdated
        });
    } catch (error) {
        console.error("Error resetting quest order:", error);
        res.status(500).json({ message: "Error resetting quest order", error: error.message });
    }
};

// Get class ID from repository name
const getClassIdFromRepo = async (req, res) => {
    try {
        const { repoName } = req.params;
        
        // Extract class code from repository name pattern: cs-277-oss-in-theory-username
        const match = repoName.match(/^cs-(\d+)-(\w+)-(\w+)-(.+)$/);
        
        if (!match) {
            // Fallback: resolve by group name suffix pattern '<anything>-<groupNameLower>'
            const parts = String(repoName).split('-');
            if (parts.length >= 2) {
                const groupNameLower = parts[parts.length - 1];
                // Try to find a group whose name matches case-insensitively
                const group = await Group.findOne({ groupName: new RegExp(`^${groupNameLower}$`, 'i') }).select('_id groupName');
                if (group) {
                    return res.status(200).json({ success: true, data: { classId: group._id, groupName: group.groupName } });
                }
            }
            return res.status(404).json({ success: false, message: 'Unable to resolve class from repository name' });
        }
        
        const [, courseNumber, subject, courseName] = match;
        const classCode = `${courseNumber}-${subject}-${courseName}`;
        
        // Find the group with this class code
        const group = await Group.findOne({ classCode });
        if (!group) {
            return res.status(404).json({ success: false, message: 'Class not found for repo' });
        }
        
        return res.status(200).json({ success: true, data: { classId: group._id, classCode } });
    } catch (error) {
        console.error('Error resolving class ID from repo:', error);
        return res.status(500).json({ success: false, message: 'Error resolving class ID', error: error.message });
    }
};

// Save quest JSON configuration for a class
const saveQuestJsonConfig = async (req, res) => {
    try {
        const { classId } = req.params;
        const { questJsonConfig } = req.body;

        console.log(`💾 [saveQuestJsonConfig] Saving quest JSON for class: ${classId}`);
        console.log(`📊 [saveQuestJsonConfig] JSON size: ${JSON.stringify(questJsonConfig).length} characters`);

        if (!questJsonConfig) {
            return res.status(400).json({
                success: false,
                message: 'Quest JSON configuration is required'
            });
        }

        // Validate JSON structure
        if (!questJsonConfig.questSequence || !Array.isArray(questJsonConfig.questSequence)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid JSON structure: questSequence array is required'
            });
        }

        // Find and update the group
        const group = await Group.findById(classId);
        if (!group) {
            return res.status(404).json({
                success: false,
                message: 'Class not found'
            });
        }

        // Update quest JSON configuration
        group.questJsonConfig = questJsonConfig;
        group.questJsonLastUpdated = new Date();
        await group.save();

        // Also write a legacy-compatible config file for the bot
        try {
            const outputDir = path.join(__dirname, '../../../OSS-Doorway/src/config/generated');
            const outputPath = path.join(outputDir, `quest_config_${classId}.json`);
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }

            // Transform questJsonConfig.questSequence into legacy format expected by the bot
            const legacyConfig = { map_repo_link: questJsonConfig.map_repo_link || "https://raw.githubusercontent.com/caiton1/OSS-Doorway/main/map" };
            for (const quest of questJsonConfig.questSequence) {
                const questId = quest.questId;
                const meta = quest.metadata || {};
                const tasks = quest.tasks || {};
                legacyConfig[questId] = { metadata: meta, ...tasks };
            }

            fs.writeFileSync(outputPath, JSON.stringify(legacyConfig, null, 2));
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            fs.writeFileSync(`${outputPath}.${timestamp}`, JSON.stringify(legacyConfig, null, 2));
            console.log(`✅ [saveQuestJsonConfig] Wrote legacy config to ${outputPath}`);
        } catch (fileErr) {
            console.error('⚠️ Failed to write legacy config file:', fileErr.message);
            // Do not fail the API response for file write issues
        }

        console.log(`✅ [saveQuestJsonConfig] Successfully saved quest JSON for class: ${group.groupName}`);

        res.status(200).json({
            success: true,
            message: 'Quest JSON configuration saved successfully',
            data: {
                classId: group._id,
                className: group.groupName,
                questCount: questJsonConfig.questSequence.length,
                lastUpdated: group.questJsonLastUpdated
            }
        });

    } catch (error) {
        console.error('Error saving quest JSON config:', error);
        res.status(500).json({
            success: false,
            message: 'Error saving quest JSON configuration',
            error: error.message
        });
    }
};

// Get quest JSON configuration for a class
const getQuestJsonConfig = async (req, res) => {
    try {
        const { classId } = req.params;

        console.log(`📖 [getQuestJsonConfig] Retrieving quest JSON for class: ${classId}`);

        // Find the group and return quest JSON config
        const group = await Group.findById(classId);
        if (!group) {
            return res.status(404).json({
                success: false,
                message: 'Class not found'
            });
        }

        if (!group.questJsonConfig) {
            console.log(`📭 [getQuestJsonConfig] No quest JSON found for class: ${group.groupName}`);
            return res.status(200).json({
                success: true,
                message: 'No quest JSON configuration found',
                data: {
                    questJsonConfig: null,
                    lastUpdated: null,
                    hasConfig: false
                }
            });
        }

        console.log(`✅ [getQuestJsonConfig] Successfully retrieved quest JSON for class: ${group.groupName}`);
        console.log(`📊 [getQuestJsonConfig] Quest count: ${group.questJsonConfig.questSequence?.length || 0}`);

        res.status(200).json({
            success: true,
            message: 'Quest JSON configuration retrieved successfully',
            data: {
                questJsonConfig: group.questJsonConfig,
                lastUpdated: group.questJsonLastUpdated,
                hasConfig: true,
                questCount: group.questJsonConfig.questSequence?.length || 0,
                className: group.groupName,
                classCode: group.classCode
            }
        });

    } catch (error) {
        console.error('Error getting quest JSON config:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving quest JSON configuration',
            error: error.message
        });
    }
};

// Upsert a stored value for a user in a class
const upsertStoredValue = async (req, res) => {
    try {
        const { classId } = req.params;
        const { githubUsername, key } = req.body;
        let { value } = req.body;
        if (!githubUsername || !key) {
            return res.status(400).json({ success: false, message: 'githubUsername and key are required' });
        }
        const group = await Group.findById(classId);
        if (!group) return res.status(404).json({ success: false, message: 'Class not found' });

        // Coerce value type based on quest JSON config (expectedAnswerType for the savedDataName)
        try {
            const questJson = group.questJsonConfig || {};
            const seq = Array.isArray(questJson.questSequence) ? questJson.questSequence : [];
            let expectedType = null;
            for (const quest of seq) {
                const tasks = quest?.tasks || {};
                for (const [taskId, task] of Object.entries(tasks)) {
                    const save = task?.saveValidatedData || task?.config?.saveValidatedData;
                    const name = task?.savedDataName || task?.config?.savedDataName;
                    const typeHint = task?.expectedAnswerType || task?.config?.expectedAnswerType;
                    if (save && name && name === key) {
                        expectedType = typeHint || 'String';
                        break;
                    }
                }
                if (expectedType) break;
            }
            if (expectedType === 'Number') {
                const coerced = Number(value);
                if (!Number.isNaN(coerced)) value = coerced;
            }
        } catch (coerceErr) {
            console.warn('[upsertStoredValue] Failed to coerce value type:', coerceErr?.message || coerceErr);
        }

        const doc = await UserStoredData.findOneAndUpdate(
            { group: classId, githubUsername },
            { $set: { [`storedValues.${key}`]: value } },
            { upsert: true, new: true }
        );
        return res.status(200).json({ success: true, data: { githubUsername: doc.githubUsername, storedValues: doc.storedValues } });
    } catch (error) {
        console.error('Error upserting stored value:', error);
        return res.status(500).json({ success: false, message: 'Error upserting stored value', error: error.message });
    }
};

// Fetch stored values for a class from backend storage
const getStoredValuesBackend = async (req, res) => {
    try {
        const { classId } = req.params;
        const docs = await UserStoredData.find({ group: classId });
        const valuesByUser = {};
        for (const d of docs) {
            valuesByUser[d.githubUsername] = Object.fromEntries(d.storedValues || []);
        }
        return res.status(200).json({ success: true, data: { valuesByUser } });
    } catch (error) {
        console.error('Error fetching backend stored values:', error);
        return res.status(500).json({ success: false, message: 'Error fetching backend stored values', error: error.message });
    }
};

// Fetch stored data keys from quest JSON and per-student values
const getStoredValuesForClass = async (req, res) => {
    try {
        const { classId } = req.params;
        const group = await Group.findById(classId).populate('students');
        if (!group) {
            return res.status(404).json({ success: false, message: 'Class not found' });
        }
        const questJson = group.questJsonConfig || {};
        const keys = [];
        // Walk questSequence to find custom-api-call tasks with saveValidatedData
        const seq = Array.isArray(questJson.questSequence) ? questJson.questSequence : [];
        for (const quest of seq) {
            const tasks = quest?.tasks || {};
            for (const [taskId, task] of Object.entries(tasks)) {
                if (task?.taskType === 'custom-api-call' || task?.type === 'custom-api-call') {
                    const save = task.saveValidatedData || task.config?.saveValidatedData;
                    const name = task.savedDataName || task.config?.savedDataName;
                    const expected = task.expectedAnswerType || task.config?.expectedAnswerType || 'Number';
                    if (save && name) {
                        keys.push({ questId: quest.questId, taskId, dataName: name, expectedType: expected });
                    }
                } else if (task?.taskType === 'get-issue-count' || task?.type === 'get-issue-count') {
                    const save = task.saveValidatedData || task.config?.saveValidatedData;
                    const name = task.savedDataName || task.config?.savedDataName;
                    if (save && name) {
                        keys.push({ questId: quest.questId, taskId, dataName: name, expectedType: 'Number' });
                    }
                } else if (task?.taskType === 'issue-no' || task?.type === 'issue-no') {
                    const save = task.saveValidatedData || task.config?.saveValidatedData;
                    const name = task.savedDataName || task.config?.savedDataName;
                    if (save && name) {
                        keys.push({ questId: quest.questId, taskId, dataName: name, expectedType: 'Number' });
                    }
                }
            }
        }

        // Attempt to fetch per-user values from bot DB (user_data collection)
        const valuesByUser = {};
        try {
            const uri = process.env.URI;
            const dbName = process.env.DB_NAME;
            if (!uri || !dbName) {
                console.warn('[getStoredValuesForClass] URI or DB_NAME env not set; skipping values fetch');
            } else {
                const client = new MongoClient(uri);
                await client.connect();
                const db = client.db(dbName);
                const collection = db.collection('user_data');
                let githubUsernames = (group.students || []).map(s => s.githubUsername).filter(Boolean);
                if (githubUsernames.length > 0) {
                    const docs = await collection.find({ _id: { $in: githubUsernames } }, { projection: { user_data: 1 } }).toArray();
                    for (const doc of docs) {
                        const stored = (doc.user_data && doc.user_data.storedValues) || {};
                        valuesByUser[doc._id] = stored;
                    }
                } else {
                    // Fallback: find users by classId (customGroupId) if students not linked on backend
                    const docs = await collection.find({ 'user_data.customGroupId': classId }, { projection: { user_data: 1, _id: 1 } }).toArray();
                    for (const doc of docs) {
                        const stored = (doc.user_data && doc.user_data.storedValues) || {};
                        valuesByUser[doc._id] = stored;
                    }
                    if (Object.keys(valuesByUser).length === 0 && group.groupName) {
                        // Fallback 2: match by repo naming pattern (username-<groupNameLower>)
                        const groupSuffix = `-${String(group.groupName).toLowerCase()}`;
                        const regex = new RegExp(`${groupSuffix}$`, 'i');
                        const docsByName = await collection.find({ _id: { $regex: regex } }, { projection: { user_data: 1, _id: 1 } }).toArray();
                        for (const doc of docsByName) {
                            const stored = (doc.user_data && doc.user_data.storedValues) || {};
                            valuesByUser[doc._id] = stored;
                        }
                    }
                }
                await client.close();
            }
        } catch (dbErr) {
            console.error('[getStoredValuesForClass] Failed to fetch per-user values:', dbErr.message);
        }

        // Merge backend-stored values (from our own collection) for this class
        try {
            const backendDocs = await (require('../models/UserStoredData')).find({ group: classId });
            for (const d of backendDocs) {
                const obj = Object.fromEntries(d.storedValues || []);
                valuesByUser[d.githubUsername] = { ...(valuesByUser[d.githubUsername] || {}), ...obj };
            }
        } catch (mergeErr) {
            console.warn('[getStoredValuesForClass] Failed to merge backend stored values:', mergeErr?.message || mergeErr);
        }

        return res.status(200).json({ success: true, data: { keys, valuesByUser } });
    } catch (error) {
        console.error('Error fetching stored values for class:', error);
        return res.status(500).json({ success: false, message: 'Error fetching stored values', error: error.message });
    }
};

module.exports = {
    getProfessor, 
    createGroup,
    getGroup,
    getGroupByCode,
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
    saveGroupReadme,
    getGroupReadme,
    saveQuestOrder,
    getQuestOrder,
    resetQuestOrder,
    getClassIdFromRepo,
    saveQuestJsonConfig,
    getQuestJsonConfig,
    getStoredValuesForClass,
    upsertStoredValue,
    getStoredValuesBackend
}