const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const { createProfessor } = require("../factories/ProfessorFactory");
const Professor = require("../../models/ProfessorModel");

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create(); // Creates a new in-memory MongoDB instance
  const uri = mongoServer.getUri(); // Get the URI to connect to this in-memory server

  // Set the MONGO_URI for testing, this ensures mongoose connects to the fake database.
  process.env.MONGO_URI = uri; 

  // If no connection exists, we connect to the in-memory database.
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

describe("Professor Model Tests", () => {
  it("Default Professor Values", async () => {
    const professor = await createProfessor();

    expect(professor.name).toBe("Pedro Oliveira");
    expect(professor.email).toMatch("pro32@nau.edu");
    expect(professor.verified).toBe(false);
  });

  it("Custom Professor Values", async () => {
    const professor = await createProfessor({
      name: "Custom Name",
      email: "custom@example.com",
      password: "22013039209320",
      verified: true,
    });

    expect(professor.name).toBe("Custom Name");
    expect(professor.email).toBe("custom@example.com");
    expect(professor.password).toBe("22013039209320");
    expect(professor.verified).toBe(true);
  });

  it("Invalid Professor with Empty Name", async () => {
    try {
      await createProfessor({ name: "", email: "invalid@example.com", password: "testtest" });
    } catch (error) {
      expect(error).toBeTruthy();
      expect(error.errors.name).toBeDefined();
    }
  });

  it("Invalid Professor with Empty Password", async () => {
    try {
      await createProfessor({ name: "Invalid Professor", email: "invalid@example.com", password: "" });
    } catch (error) {
      expect(error).toBeTruthy();
      expect(error.errors.password).toBeDefined();
    }
  });

  it("Invalid Professor with Empty Email", async () => {
    try {
      await createProfessor({ name: "Invalid Professor", email: "", password: "somepassword123" });
    } catch (error) {
      expect(error).toBeTruthy();
      expect(error.errors.email).toBeDefined();
    }
  });

});