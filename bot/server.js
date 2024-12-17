const express = require("express");
const bodyParser = require("body-parser");
const githubRoutes = require("./routes/githubRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use("/github", githubRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});