import React, { useState } from "react";
import "./EmailVerification.css"; 
import axios from 'axios'
let baseURL = `http://localhost:${process.env.PORT || 8080}`;


const EmailVerification = () => {
    const [verificationCode, setVerificationCode] = useState(["", "", "", "", "", ""])

    const handleChange = (e, index) => {
        const value = e.target.value;

        if (/[0-9]/.test(value) || value === '') {
            const newCode = [...verificationCode];
            newCode[index] = value;

            setVerificationCode(newCode);

            if (value && index < 5) {
                document.getElementById(`input-${index + 1}`).focus();
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Join the code parts into a single string
        const code = verificationCode.join("");

        if (code.length === 6) {
            try {
                const response = await axios.post(`${baseURL}/api/auth/verify`, { verificationCode: code });
                if (response.status === 200) {
                    window.location.href = "/";
                }
            } catch (error) {
                console.error("Error verifying code:", error);
                alert("Invalid code. Please try again.");
            }
        } else {
            alert("Please enter a valid 6-digit code.");
        }
    };

    return (
        <div className="container" id="verification-container">
            <div className="form-container verification">
                <form onSubmit={handleSubmit}>
                    <h1>Email Verification</h1>
                    <p>Enter the 6-digit verification code sent to your email.</p>
                    <div className="input-group">
                        {verificationCode.map((digit, index) => (
                            <input
                                key={index}
                                id={`input-${index}`}
                                type="text"
                                maxLength="1"
                                value={digit}
                                onChange={(e) => handleChange(e, index)}
                                className="verification-input"
                                autoFocus={index === 0} // Focus the first input by default
                            />
                        ))}
                    </div>
                    <button type="submit" className="submit-button">Verify Code</button>
                </form>
            </div>
        </div>
    )
}

export default EmailVerification