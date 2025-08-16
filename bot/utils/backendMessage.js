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
    
    // Use Railway backend URL in production, localhost in development
    const baseURL = process.env.NODE_ENV === 'production' 
        ? "https://oss-michael-production.up.railway.app" 
        : "http://localhost:8080";
    
    const fullUrl = url.startsWith('http') ? url : `${baseURL}${url}`;

    try {
        const response = await axios.post(fullUrl, payload, {
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