const crypto = require("crypto");
const config = require("../config/config");

exports.verifyWebhook = (req, res, next) => {
    const signature = req.headers["x-hub-signature"];
    const payload = JSON.stringify(req.body);
    const secret = config.githubWebhookSecret;

    const hmac = crypto.createHmac("sha1", secret);
    const digest = "sha1=" + hmac.update(payload).digest("hex");

    if (signature === digest) {
        next();
    } else {
        res.status(403).send("Forbidden");
    }
};
