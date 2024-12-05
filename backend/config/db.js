const mongoose = require("mongoose");
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

const connectDB = async () => {
  try {
    if (process.env.NODE_ENV === 'test') {
      mongoServer = await MongoMemoryServer.create();
      const uri = mongoServer.getUri(); 

      await mongoose.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });

      console.log("In-memory MongoDB connected for testing. URI: ", mongoServer.getUri());
    } else {
      
      await mongoose.connect(process.env.URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });

      console.log("MongoDB connected successfully. URI: ");
    }
  } catch (err) {
    console.error("Error connecting to the database:", err);
    // console.error("Error connecting to the database");
    process.exit(1);
  }
};

module.exports = connectDB;