require("dotenv").config();

const jwt = require('jsonwebtoken');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

let privateKey;
let GITHUB_APP_ID;
let USER_AGENT;

// Use environment variables for private key in Railway, fallback to files for local development
if (process.env.NODE_ENV === "production") {
	// In Railway, use environment variable
	privateKey = process.env.GITHUB_APP_PRIVATE_KEY;
	// Normalize escaped newlines when provided via env var UI
	if (privateKey && privateKey.includes('\\n')) {
		privateKey = privateKey.replace(/\\n/g, '\n');
	}
	if (!privateKey) {
		// Fallback to file if env var not set
		try {
			const privateKeyPath = path.resolve(__dirname, '../../github-app-private-key-prod.pem');
			privateKey = fs.readFileSync(privateKeyPath, 'utf8');
		} catch (fileError) {
			console.error('❌ Failed to read private key file:', fileError.message);
			console.error('❌ Please set GITHUB_APP_PRIVATE_KEY environment variable in Railway');
			throw new Error('GitHub App private key not available. Set GITHUB_APP_PRIVATE_KEY in Railway environment variables.');
		}
	}
	GITHUB_APP_ID = process.env.APP_ID_PROD;
	USER_AGENT = process.env.USER_AGENT_PROD;
} else {
	// Local development - try file first, then env var
	try {
		const privateKeyPath = path.resolve(__dirname, '../../github-app-private-key-dev.pem');
		privateKey = fs.readFileSync(privateKeyPath, 'utf8');
	} catch (fileError) {
		privateKey = process.env.GITHUB_APP_PRIVATE_KEY;
		// Normalize escaped newlines when provided via env var UI
		if (privateKey && privateKey.includes('\\n')) {
			privateKey = privateKey.replace(/\\n/g, '\n');
		}
		if (!privateKey) {
			throw new Error('GitHub App private key not available. Either create the .pem file or set GITHUB_APP_PRIVATE_KEY environment variable.');
		}
	}
	GITHUB_APP_ID = process.env.APP_ID_DEV;
	USER_AGENT = process.env.USER_AGENT_DEV;
}

const generateJWT = () => {
	const payload = {
		iat: Math.floor(Date.now() / 1000),
		exp: Math.floor(Date.now() / 1000) + (5 * 60),
		iss: GITHUB_APP_ID,
	};

	return jwt.sign(payload, privateKey, { algorithm: 'RS256' });
};

const getGithubAppInstallationAccessToken = async () => {
	const jwtToken = generateJWT();

	try {
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
			return tokenResponse.data.token;  
		} else {
			throw new Error('Installation access token not received');
		}
	} catch (error) {
		console.error('Error getting installation access token:', error.message);
		console.error('Error response data:', error.response ? error.response.data : 'No response data');
		console.error('Error response headers:', error.response ? error.response.headers : 'No response headers');
		throw error;
	}
};

module.exports = {
	getGithubAppInstallationAccessToken,
};
