const crypto = require("crypto");
require("dotenv").config(); 

exports.verifyWebhook = (req, res, next) => {
    const signature = req.headers["x-hub-signature"];
    const payload = JSON.stringify(req.body);
    const secret = process.env.WEBHOOK_SECRET; 

    if (!secret) {
        console.error("GitHub webhook secret is not defined in the environment variables.");
        return res.status(500).send("Server configuration error");
    }

    const hmac = crypto.createHmac("sha1", secret);
    const digest = "sha1=" + hmac.update(payload).digest("hex");

    if (signature === digest) {
        next();
    } else {
        res.status(403).send("Forbidden"); 
    }
};
