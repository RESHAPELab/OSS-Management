const crypto = require("crypto");
require("dotenv").config(); // Load environment variables from .env file

exports.verifyWebhook = (req, res, next) => {
    const signature = req.headers["x-hub-signature"]; // GitHub's HMAC signature
    const payload = JSON.stringify(req.body); // The request body
    const secret = process.env.WEBHOOK_SECRET; // Load the secret from .env

    if (!secret) {
        console.error("GitHub webhook secret is not defined in the environment variables.");
        return res.status(500).send("Server configuration error");
    }

    // Create HMAC digest
    const hmac = crypto.createHmac("sha1", secret);
    const digest = "sha1=" + hmac.update(payload).digest("hex");

    // Compare the signature with the digest
    if (signature === digest) {
        next(); // Signature is valid; proceed to the next middleware/controller
    } else {
        res.status(403).send("Forbidden"); // Signature is invalid
    }
};
