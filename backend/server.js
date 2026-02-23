const express = require("express");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");
const dotenv = require("dotenv").config({
  path: path.join(__dirname, "..", ".env"),
});

// Add environment variable validation
if (!process.env.URI) {
  console.error('❌ Missing required environment variable: URI');
  console.error('Please set the URI environment variable in your Render dashboard');
  process.exit(1);
}

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
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Make io accessible to route handlers
app.set('io', io);

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
app.use("/api/admin", require("./routes/adminRoutes"));
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

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);
  
  // Join class-specific room
  socket.on('join-class', (classId) => {
    socket.join(`class:${classId}`);
    console.log(`📚 Socket ${socket.id} joined class room: class:${classId}`);
  });
  
  // Leave class room
  socket.on('leave-class', (classId) => {
    socket.leave(`class:${classId}`);
    console.log(`📚 Socket ${socket.id} left class room: class:${classId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
  });
});

// Export app for testing purposes
if (process.env.NODE_ENV !== "test") {
  server.listen(port, '0.0.0.0', () => {
    console.log(`Server has started on port ${port} with PID ${process.pid}`);
    console.log(`🔌 Socket.io server is ready`);
  });
  
  // Handle graceful shutdown
  const gracefulShutdown = () => {
    console.log('Received shutdown signal, closing server...');
    io.close(() => {
      console.log('Socket.io closed');
      server.close(() => {
        console.log('Server closed');
        closeDB().then(() => {
          console.log('Database connection closed');
          process.exit(0);
        });
      });
    });
  };
  
  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);
}

module.exports = app;
