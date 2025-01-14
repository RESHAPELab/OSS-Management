/*
const app = require('../../server');
const supertest = require('supertest');
const request = supertest(app);
const axios = require('axios');
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

const mongoose = require("mongoose");
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;
let professor;
let student;
let group;
let quest;
let task;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  professor = await createProfessor({ name: "Professor RepoManagement Test", email: "custom_repomanagement_test@mail.com" });
  student = await createStudent();
  group = await createGroup({ professor: [professor.id], students: [student.id] });
  quest = await createQuest({ groups: [group.id] });
  task = await createTask({ quest: quest.id });
  hintA = await createHint({ task: task.id, sequence: 1 });
  hintB = await createHint({ task: task.id, sequence: 2 });
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) { await mongoServer.stop(); }
});


describe("Repository Management", () => {
  
  test('Should create a repository for student', async () => {
    const organizationGh = 'OSS-Doorway-Development';
    const studentId = student.id;
    const studentGithubUsername = student.githubUsername;
    const groupId = group.id;
    const groupName = group.groupName.replace(/ /g, '_');

    try {
      const response = await request
      .post("/api/repo/repository") 
      .send({ organizationGh, studentId, studentGithubUsername, groupId, groupName });

      expect(response.status).toBe(201);

    } catch (error) {
      console.error('Error during test:', error.message);
      
      if (error.response) {
        console.error('Error details:', error.response.data);
      }
      
      throw error;
    }
  });

  test('Should create a task inside the repository for student'

  )
})
*/