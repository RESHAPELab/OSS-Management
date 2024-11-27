const nodemailer = require('nodemailer');


//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// This file is responsible for handling emails!
// It is called in the generateCode.js file and is used to send verification codes
// once they are generated!
// you don't have to do anything in here directly- it's all done through generateCode.js!
// NOTE: be sure you have added MAIL_PASSWORD to your .env!
// reach out to Jadyn or Pedro for that password if we forgot to give it to u :P


require('dotenv').config();
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'pedrorodriguesarantes@gmail.com',
        pass: process.env.MAIL_PASSWORD
    }
});


const sendEmail = (recipientEmail, verificationCode) => {
    const mailOptions = {
        from: 'jlc2243@nau.edu',
        to: recipientEmail,
        subject: 'OSS Invitation',
        html: `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Invitation Code</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 0;
                    background-color: #f4f4f9;
                    color: #333;
                }
                .email-container {
                    width: 100%;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: white;
                    border-radius: 10px;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                }
                h1 {
                    color: #2a8bde;
                }
                p {
                    font-size: 16px;
                    line-height: 1.6;
                }
                .code {
                    display: inline-block;
                    padding: 10px 15px;
                    background-color: #f0f0f0;
                    font-size: 20px;
                    font-weight: bold;
                    border-radius: 5px;
                    color: #333;
                    margin-top: 15px;
                }
                .cta-button {
                    display: inline-block;
                    background-color: #2a8bde;
                    color: white;
                    padding: 12px 25px;
                    border-radius: 5px;
                    text-decoration: none;
                    font-weight: bold;
                    margin-top: 20px;
                }
                .cta-button:hover {
                    background-color: #1a6fa3;
                }
                .footer {
                    font-size: 14px;
                    color: #777;
                    margin-top: 30px;
                }
            </style>
        </head>
        <body>
            <div class="email-container">
                <h1>Welcome to OSS - Email Confirmation</h1>
                <p>Dear Professor,</p>
                <p>Thank you for joining our platform! We're excited to have you on board.</p>
                <p>To complete your registration, please use the following unique invitation code:</p>
        
                <div class="code">${verificationCode}</div>
        
                <p>Simply click the button below to continue the registration process:</p>
                <a href="{{registrationLink}}" class="cta-button">Register Now</a>
        
                <p>If you have any issues or need assistance, please don't hesitate to reach out to us at <a href="mailto:jlc2243@nau.edu">jlc2243@nau.edu</a>.</p>
                
                <div class="footer">
                    <p>Best regards,</p>
                    <p>The OSS Team</p>
                </div>
            </div>
        </body>
        </html>`
    };

    return new Promise((resolve, reject) => {
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) { 
                console.error('Error sending email:', error);
                reject(error); 
            } else { 
                console.log('Email sent:', info.response); 
                resolve(info); 
            }
        })
    })
}

module.exports = { sendEmail };

