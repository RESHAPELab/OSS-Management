const express = require("express");
const path = require("path");
const dotenv = require("dotenv").config({ path: path.join(__dirname, '..', '.env') });
const { errorHandler } = require("./middleware/errorMiddleware");
const { connectDB, closeDB } = require("./config/db");
const port = process.env.port || 8080;
const cors = require('cors');
const generatejsonRoutes = require('./routes/generatejsonRoutes');

connectDB(); 

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/group", require("./routes/groupRoutes"));
app.use("/api/student", require('./routes/studentRoutes'));
app.use("/api/repo", require("./routes/repoRoutes"));
app.use("/api/gamification", require("./routes/gamificationRoutes"));
app.use("/api/quest", require("./routes/questRoutes"));
app.use("/api/quest-config", require("./routes/questConfigRoutes"));
app.use('/api/generatejson', generatejsonRoutes);
app.use(errorHandler);

// Export app for testing purposes
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => console.log(`Server has started on port ${port}`));
}

module.exports = app;
