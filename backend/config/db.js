const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

let mongoServer = null; // Singleton for the in-memory server
let mongoConnection = null; // Singleton for the database connection

const connectDB = async () => {
  try {
    // Return the existing connection if it exists
    if (mongoConnection && mongoose.connection.readyState !== 0) {
      return mongoose.connection;
    }

    if (process.env.NODE_ENV === "test") {
      // Create a new in-memory MongoDB server if it doesn't exist
      if (!mongoServer) {
        mongoServer = await MongoMemoryServer.create();
      }

      const uri = mongoServer.getUri();

      // Establish the connection
      mongoConnection = await mongoose.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });

      console.log("Connected to in-memory MongoDB");
    } else {
      // For production or development environments, use a real MongoDB URI
      if (!mongoConnection) {
        mongoConnection = await mongoose.connect(process.env.URI, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
        });

        console.log("Connected to MongoDB");
      }
    }

    return mongoose.connection;
  } catch (err) {
    console.error("Error connecting to the database:", err);
    throw err;
  }
};

const closeDB = async () => {
  if (process.env.NODE_ENV === "test" && mongoServer) {
    await mongoose.connection.dropDatabase(); // Clean up the in-memory database
    await mongoose.connection.close(); // Close the connection
    await mongoServer.stop(); // Stop the in-memory MongoDB server
    mongoServer = null; // Reset the singleton
    mongoConnection = null; // Reset the connection singleton
    console.log("In-memory MongoDB server stopped");
  } else {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close(); // Close the connection
      console.log("MongoDB connection closed");
    }
  }
};

module.exports = { connectDB, closeDB };
