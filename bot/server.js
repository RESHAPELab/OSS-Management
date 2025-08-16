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

// Use a different port for the bot service
const port = process.env.BOT_PORT || (process.env.PORT ? parseInt(process.env.PORT) + 1 : 8081);
app.listen(port, '0.0.0.0', () => {
    console.log(`Bot server is running on port ${port}`);
});

module.exports = app;

