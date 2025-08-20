const express = require("express");
const path = require("path");
const dotenv = require("dotenv").config({
  path: path.join(__dirname, "..", ".env"),
});
const { errorHandler } = require("./middleware/errorMiddleware");
const { connectDB, closeDB } = require("./config/db");
const port = process.env.port || 8080;
const cors = require("cors");
const generatejsonRoutes = require("./routes/generatejsonRoutes");

connectDB();

const app = express();

// Enhanced CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      "http://localhost:3000",
      "http://localhost:8080",
      "http://localhost:10000",
      "https://oss-michael.up.railway.app",
      "https://oss-timi.up.railway.app",
      "https://ossdoorway.vercel.app",  // Add this line
    ];

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-bot-signature"],
};

app.use(cors(corsOptions));
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

// Export app for testing purposes
if (process.env.NODE_ENV !== "test") {
  app.listen(port, () => console.log(`Server has started on port ${port}`));
}

module.exports = app;
