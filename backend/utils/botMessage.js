const crypto = require("crypto");
const axios = require("axios");
// Remove this line: const { getGithubAppInstallationAccessToken } = require("../../../bot/controllers/githubAppAuth");
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

// GitHub App authentication functions
const jwt = require('jsonwebtoken');

// Use consolidated GitHub App configuration
let privateKey;
let GITHUB_APP_ID;
let USER_AGENT;

// Use OSS_DOORWAY environment variables (consolidated approach)
if (process.env.OSS_DOORWAY_PRIVATE_KEY && process.env.OSS_DOORWAY_APP_ID) {
    // Primary: Use consolidated environment variables
    privateKey = process.env.OSS_DOORWAY_PRIVATE_KEY;
    GITHUB_APP_ID = process.env.OSS_DOORWAY_APP_ID;
    USER_AGENT = 'OSS-Management-Backend';
    
    // Convert \n characters to actual newlines if they exist
    if (privateKey && privateKey.includes('\\n')) {
        privateKey = privateKey.replace(/\\n/g, '\n');
    }
    
    console.log('✅ [BOT-MESSAGE-AUTH] Using consolidated OSS_DOORWAY configuration');
} else {
    // Fallback: Use legacy environment variables for backwards compatibility
    const fs = require('fs');
    const path = require('path');
    
    let privateKeyPath = null;
    
    if (process.env.NODE_ENV === "production") {
        privateKeyPath = path.resolve(__dirname, '../../github-app-private-key-prod.pem');
        if (fs.existsSync(privateKeyPath)) {
            privateKey = fs.readFileSync(privateKeyPath, 'utf8');
            GITHUB_APP_ID = process.env.APP_ID_PROD;
            USER_AGENT = process.env.USER_AGENT_PROD;
            console.log('⚠️ [BOT-MESSAGE-AUTH] Using legacy PEM file configuration (production)');
        }
    } else {
        privateKeyPath = path.resolve(__dirname, '../../github-app-private-key-dev.pem');
        if (fs.existsSync(privateKeyPath)) {
            privateKey = fs.readFileSync(privateKeyPath, 'utf8');
            GITHUB_APP_ID = process.env.APP_ID_DEV;
            USER_AGENT = process.env.USER_AGENT_DEV;
            console.log('⚠️ [BOT-MESSAGE-AUTH] Using legacy PEM file configuration (development)');
        }
    }
    
    if (!privateKey) {
        console.error('❌ [BOT-MESSAGE-AUTH] No GitHub App private key found');
        console.error('Please set OSS_DOORWAY_PRIVATE_KEY and OSS_DOORWAY_APP_ID environment variables');
    }
}

const generateJWT = () => {
    if (!privateKey || !GITHUB_APP_ID) {
        throw new Error('GitHub App configuration not available');
    }
    
    const payload = {
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (5 * 60), // 5 minutes
        iss: GITHUB_APP_ID,
    };

    return jwt.sign(payload, privateKey, { algorithm: 'RS256' });
};

const getGithubAppInstallationAccessToken = async () => {
    if (!privateKey || !GITHUB_APP_ID) {
        throw new Error('GitHub App configuration not available. Please check OSS_DOORWAY_PRIVATE_KEY and OSS_DOORWAY_APP_ID environment variables.');
    }
    
    const jwtToken = generateJWT();

    try {
        console.log('🔑 [BOT-MESSAGE-AUTH] Getting GitHub App installations...');
        const installationsResponse = await axios.get('https://api.github.com/app/installations', {
            headers: {
                Authorization: `Bearer ${jwtToken}`,
                Accept: 'application/vnd.github.v3+json',
                'User-Agent': USER_AGENT,
            },
        });

        if (!installationsResponse.data || installationsResponse.data.length === 0) {
            throw new Error('No installations found for this GitHub App');
        }

        const installationId = installationsResponse.data[0].id;
        console.log(`🔑 [BOT-MESSAGE-AUTH] Found installation ID: ${installationId}`);
        
        console.log('🔑 [BOT-MESSAGE-AUTH] Getting installation access token...');
        const tokenResponse = await axios.post(
            `https://api.github.com/app/installations/${installationId}/access_tokens`,
            {},
            {
                headers: {
                    Authorization: `Bearer ${jwtToken}`,
                    Accept: 'application/vnd.github.v3+json',
                },
            }
        );

        if (tokenResponse.data && tokenResponse.data.token) {
            console.log('✅ [BOT-MESSAGE-AUTH] Installation access token obtained successfully');
            return tokenResponse.data.token;  
        } else {
            throw new Error('Installation access token not received');
        }
    } catch (error) {
        console.error('❌ [BOT-MESSAGE-AUTH] Error getting installation access token:', error.message);
        if (error.response) {
            console.error('❌ [BOT-MESSAGE-AUTH] Error response data:', error.response.data);
            console.error('❌ [BOT-MESSAGE-AUTH] Error response status:', error.response.status);
        }
        throw error;
    }
};

module.exports = {
    sendMessageToBot, 
    signPayload,
    // Remove this line: getGithubAppInstallationAccessToken,
    getBotServiceUrl
};
