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

// Health check endpoint for Railway
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', port: port });
});

// Export app for testing purposes
if (process.env.NODE_ENV !== "test") {
  const server = app.listen(port, '0.0.0.0', () => {
    console.log(`Server has started on port ${port}`);
  });
  
  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
      console.log('Process terminated');
    });
  });
}

module.exports = app;
