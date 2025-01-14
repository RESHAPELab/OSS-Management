const app = require('../../server');
const supertest = require('supertest');
const request = supertest(app);
const axios = require('axios');
const { connectDB, closeDB } = require('../../config/db');

const { createRepo } = require('../../controllers/repoController');
const Professor = require("../../models/ProfessorModel");
const { createProfessor } = require("../factories/ProfessorFactory");
const Group = require("../../models/GroupModel");
const { createGroup } = require("../factories/GroupFactory");
const Quest = require("../../models/QuestModel");
const { createQuest } = require("../factories/QuestFactory");
const Student = require("../../models/StudentModel");
const { createStudent } = require("../factories/StudentFactory");
const Task = require("../../models/TaskModel");
const { createTask } = require("../factories/TaskFactory");
const UserTaskProgress = require("../../models/UserTaskProgressModel");
const { createUserTaskProgress } = require("../factories/UserTaskProgressFactory");
const Hint = require("../../models/HintModel");
const { createHint } = require("../factories/HintFactory");
const UserRepo = require("../../models/UserRepoModel");
const { createUserRepo } = require("../factories/UserRepoFactory");

let professor;
let student;
let group;
let quest;
let task;
let hint;

beforeAll(async () => {
  organizationGh = 'OSS-Doorway-Development';

  professor = await createProfessor({ name: "Professor RepoManagement Test", email: "custom_repomanagement_test@mail.com" });
  student = await createStudent();
  group = await createGroup({ professor: [professor.id], students: [student.id] });
  quest = await createQuest({ group: group.id });
  taskA = await createTask({ quest: quest.id });
  hint = await createHint({ task: taskA.id });
  
  taskB = await createTask({ quest: quest.id,  prerequisite: [taskA.id]});
  taskC = await createTask({ quest: quest.id,  prerequisite: [taskB.id]});
  
  const studentId = student.id;
  const studentGithubUsername = student.githubUsername
  const groupId = group.id;
  const groupName = group.groupName.replace(/ /g, '_');

  const response = await request
  .post("/api/repo/repository")
  .send({ organizationGh, studentId, studentGithubUsername, groupId, groupName });
});

describe("Gamification Features", () => {
  test('Should create a new task for a student', async () => {
    try {
      const userId = student.id;
      const questId = quest.id;

      const response = await request
      .post("/api/gamification/createTask")
      .send({ userId, questId });

      expect(response.status).toBe(201);
      
    } catch (error) {
      console.error('Error during test:', error.message);
      
      if (error.response) {
        console.error('Error details:', error.response.data);
      }
      
      throw error;
    }
  });
})