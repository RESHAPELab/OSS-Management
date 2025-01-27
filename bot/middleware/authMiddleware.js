const crypto = require("crypto");
require("dotenv").config();

exports.verifyBackendRequest = (req, res, next) => {
    const signature = req.headers["x-bot-signature"]; 
    const payload = JSON.stringify(req.body);
    const secret = process.env.BOT_SECRET;

    if (!secret) {
        console.error("Bot secret is not defined in the environment variables.");
        return res.status(500).send("Server configuration error");
    }

    const hmac = crypto.createHmac("sha256", secret);
    const digest = "sha256=" + hmac.update(payload).digest("hex");

    if (signature === digest) {
        next();
    } else {
        console.warn("Invalid signature received.");
        res.status(403).send("Forbidden");
    }
};