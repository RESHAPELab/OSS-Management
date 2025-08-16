const express = require("express");
const bodyParser = require("body-parser");
const githubRoutes = require("./routes/githubRoutes");
const gamificationRoutes = require("./routes/gamificationRoutes");

const app = express();
// const PORT = process.env.PORT || 10000;

app.use(bodyParser.json());
app.use("/github", githubRoutes);
app.use("/gamification", gamificationRoutes);

// app.listen(PORT, () => {
//     console.log(`Server is running on port ${PORT}`);
// });

const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
    console.log(`Server is running on port ${port}`);
});

module.exports = app;

