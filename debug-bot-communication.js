const axios = require('axios');
const crypto = require('crypto');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Debug script to test bot communication
async function debugBotCommunication() {
    const baseURL = 'http://localhost:10000';
    
    try {
        console.log('🔍 DEBUGGING BOT COMMUNICATION');
        console.log('================================');
        
        // 1. Check environment variables
        console.log('\n1. Checking environment variables...');
        console.log(`BOT_SECRET: ${process.env.BOT_SECRET ? 'SET' : 'NOT SET'}`);
        console.log(`NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
        
        if (!process.env.BOT_SECRET) {
            console.log('❌ BOT_SECRET is not set! This will cause authentication failures.');
            return;
        }
        
        // 2. Test simple bot endpoint
        console.log('\n2. Testing simple bot endpoint...');
        
        const testPayload = { org: 'OSS-Doorway-Dev' };
        const signature = signPayload(testPayload);
        
        console.log('📤 Testing listRepos endpoint...');
        console.log('Payload:', JSON.stringify(testPayload, null, 2));
        console.log('Signature:', signature);
        
        try {
            const response = await axios.post(
                `${baseURL}/github/listRepos`,
                testPayload,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'x-bot-signature': signature
                    }
                }
            );
            
            console.log('✅ Bot communication successful!');
            console.log('Status:', response.status);
            console.log('Repositories found:', response.data.length || 0);
            
        } catch (error) {
            console.log('❌ Bot communication failed!');
            console.log('Error:', error.message);
            if (error.response) {
                console.log('Response status:', error.response.status);
                console.log('Response data:', error.response.data);
            }
        }
        
        // 3. Test repository creation
        console.log('\n3. Testing repository creation...');
        
        const createPayload = {
            org: 'OSS-Doorway-Dev',
            repoName: 'debug-test-repo',
            repoDescription: 'Debug test repository',
            privateRepo: true
        };
        
        const createSignature = signPayload(createPayload);
        
        console.log('📤 Testing createRepo endpoint...');
        console.log('Payload:', JSON.stringify(createPayload, null, 2));
        console.log('Signature:', createSignature);
        
        try {
            const createResponse = await axios.post(
                `${baseURL}/github/createRepo`,
                createPayload,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'x-bot-signature': createSignature
                    }
                }
            );
            
            console.log('✅ Repository creation successful!');
            console.log('Status:', createResponse.status);
            console.log('Repository data:', JSON.stringify(createResponse.data, null, 2));
            
        } catch (error) {
            console.log('❌ Repository creation failed!');
            console.log('Error:', error.message);
            if (error.response) {
                console.log('Response status:', error.response.status);
                console.log('Response data:', error.response.data);
            }
        }
        
        console.log('\n✅ Bot communication debugging complete!');
        
    } catch (error) {
        console.error('❌ Error during bot communication debugging:', error.message);
    }
}

function signPayload(payload) {
    const secret = process.env.BOT_SECRET;
    if (!secret) {
        throw new Error("Bot secret is not defined in the environment variables.");
    }
    const hmac = crypto.createHmac("sha256", secret); 
    return "sha256=" + hmac.update(JSON.stringify(payload)).digest("hex");
}

// Run the debug script
debugBotCommunication();