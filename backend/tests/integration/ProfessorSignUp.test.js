const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../../server');
const request = require('supertest');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create(); 
  const uri = mongoServer.getUri();

  process.env.MONGO_URI = uri; 

  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("POST /signup", () => {
  it("Registering a New Professor", async () => {
    const professorData = {
      email: "professor7@example.com",
      name: "Test Professor 1",
      password: "testpassword123",
    };

    const response = await request(app)
      .post("/api/auth/")
      .send(professorData)
      .expect(201); 
    
    expect(response.body.name).toBe(professorData.name);
    expect(response.body.email).toBe(professorData.email);
    expect(response.body.password).not.toBe(professorData.password);
  });

  it("Registering a Professor Without Email", async () => {
    const response = await request(app)
      .post("/api/auth/")
      .send({ name: "Test Professor", password: "testpassword123" })
      .expect(400);
  });

  it("Registering a Professor Without Password", async () => {
    const response = await request(app)
      .post("/api/auth/")
      .send({ name: "Test Professor", email: "test@mail.com", password: "" })
      .expect(400);
  });

  it("Registering a Professor that Already Exists", async () => {
    const professorData = {
      email: "existingprofessor7@example.com",
      name: "Existing Professor 2",
      password: "testpassword123",
    };

    await request(app)
      .post("/api/auth/")
      .send(professorData)
      .expect(201);

    const response = await request(app)
      .post("/api/auth/")
      .send(professorData)
      .expect(400);
  });
});
