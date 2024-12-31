const mongoose = require("mongoose");
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;
global.isConnecting = false; // Global lock to prevent multiple concurrent connections

const connectDB = async () => {
  try {
    if (process.env.NODE_ENV === 'test') {
      if (mongoose.connection.readyState === 0 && !global.isConnecting) {
        global.isConnecting = true;

        if (!mongoServer) {
          mongoServer = await MongoMemoryServer.create();
        }

        global.__MONGO_URI__ = global.__MONGO_URI__ || mongoServer.getUri();

        if (!mongoose.connection.db) {
          await mongoose.connect(global.__MONGO_URI__, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
          });
        }

        global.isConnecting = false;
      }
    } else {
      await mongoose.connect(process.env.URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
    }
  } catch (err) {
    console.error("Error connecting to the database:", err);
    throw err;
  }
};

module.exports = connectDB;
