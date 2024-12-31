const jwt = require('jsonwebtoken');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const privateKeyPath = path.resolve(__dirname, '../../github-app-private-key.pem');
const privateKey = fs.readFileSync(privateKeyPath, 'utf8');
const GITHUB_APP_ID = '1088526';

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
                'User-Agent': 'OSS-Doorway-Development',
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
