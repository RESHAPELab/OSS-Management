const { connectDB } = require('../config/db');

module.exports = async () => {
  console.log("Global setup: Connecting to database...");
  await connectDB(); // Connect to the in-memory database
};
