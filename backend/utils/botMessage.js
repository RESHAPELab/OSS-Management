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

// Get bot service URL based on environment
function getBotServiceUrl() {
    // Check if we're in production
    if (process.env.NODE_ENV === 'production' || process.env.BOT_SERVICE_URL) {
        return process.env.BOT_SERVICE_URL || 'https://oss-timi.up.railway.app';
    }
    // Default to localhost for development
    return 'http://localhost:10000';
}

async function sendMessageToBot(url, payload) {
    const signature = signPayload(payload);
    // Use Railway bot URL in production, localhost in development
    const botUrl = (process.env.NODE_ENV === 'production' 
        ? "https://oss-timi.up.railway.app/" 
        : "http://localhost:10000/") + url;

    try {
        const response = await axios.post(
            botUrl, payload, 
            { headers: { "Content-Type": "application/json", "x-bot-signature": signature } }
        );
        console.log('responsesendmessage', response);

        return response;
    } catch (error) {
        console.error("Error sending message to bot:", error.message);
        throw error; // Re-throw the error so the calling function can handle it
    }
}

module.exports = {
    sendMessageToBot, 
    signPayload,
    getGithubAppInstallationAccessToken,
    getBotServiceUrl
};
