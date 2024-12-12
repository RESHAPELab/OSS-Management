const express = require("express");
const dotenv = require("dotenv").config();
const {errorHandler} = require("./middleware/errorMiddleware");
const connectDB = require("./config/db");
const port = process.env.port || 8080;
const cors = require('cors')

connectDB(); 

const app = express();
app.use(cors())

app.use(express.json()); 
app.use(express.urlencoded({extended: false}));

app.use("/api/auth", require ("./routes/authRoutes"));
app.use("/api/group", require("./routes/groupRoutes"));
app.use("/api/student", require('./routes/studentRoutes'));
app.use(errorHandler);

app.listen(port, () => console.log(`Server has started on port ${port}`))



