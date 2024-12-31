const crypto = require("crypto");
const axios = require("axios");
require("dotenv").config();

function signPayload(payload) {
    const secret = process.env.BOT_SECRET;
    if (!secret) {
        throw new Error("Bot secret is not defined in the environment variables.");
    }
    const hmac = crypto.createHmac("sha256", secret); 
    return "sha256=" + hmac.update(JSON.stringify(payload)).digest("hex");
}

async function sendMessageToBackend(url, payload) {
    const signature = signPayload(payload);

    try {
        const response = await axios.post(url, payload, {
            headers: {
                "Content-Type": "application/json",
                "x-bot-signature": signature,
            }
        });

        return response
    } catch (error) {
        console.error("Error sending message to bot:", error.message);
    }
}

module.exports = {
    sendMessageToBackend,
    signPayload
}