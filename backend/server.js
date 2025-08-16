const express = require("express");
const path = require("path");
const dotenv = require("dotenv").config({
  path: path.join(__dirname, "..", ".env"),
});
const { errorHandler } = require("./middleware/errorMiddleware");
const { connectDB, closeDB } = require("./config/db");
const port = process.env.PORT || 8080;
const cors = require("cors");
const generatejsonRoutes = require("./routes/generatejsonRoutes");

// Prevent multiple instances
if (process.env.NODE_ENV !== "test") {
  console.log(`Starting server with PID: ${process.pid}`);
}

connectDB();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/group", require("./routes/groupRoutes"));
app.use("/api/student", require("./routes/studentRoutes"));
app.use("/api/repo", require("./routes/repoRoutes"));
app.use("/api/gamification", require("./routes/gamificationRoutes"));
app.use("/api/quest", require("./routes/questRoutes"));
app.use("/api/quest-config", require("./routes/questConfigRoutes"));
app.use("/api/generatejson", generatejsonRoutes);
app.use(errorHandler);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    port: port,
    pid: process.pid,
    uptime: process.uptime()
  });
});

// Export app for testing purposes
if (process.env.NODE_ENV !== "test") {
  const server = app.listen(port, '0.0.0.0', () => {
    console.log(`Server has started on port ${port} with PID ${process.pid}`);
  });
  
  // Handle graceful shutdown
  const gracefulShutdown = () => {
    console.log('Received shutdown signal, closing server...');
    server.close(() => {
      console.log('Server closed');
      closeDB().then(() => {
        console.log('Database connection closed');
        process.exit(0);
      });
    });
  };
  
  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);
}

module.exports = app;
