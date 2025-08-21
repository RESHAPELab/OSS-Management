import React, { useState, useEffect } from "react";
import "./EmailVerification.css"; 
import axios from 'axios'
import API_CONFIG from '../../config/api';

const baseURL = API_CONFIG.getBaseURL();

const EmailVerification = () => {
    const [verificationCode, setVerificationCode] = useState(["", "", "", "", "", ""])
    const [email, setEmail] = useState("")

    // Auto-populate email from localStorage when component loads
    useEffect(() => {
        try {
            const storedProfessor = localStorage.getItem("professor");
            console.log("🔍 [EmailVerification] Raw localStorage data:", storedProfessor);
            
            if (storedProfessor) {
                const professorData = JSON.parse(storedProfessor);
                console.log("🔍 [EmailVerification] Parsed professor data:", professorData);
                console.log("🔍 [EmailVerification] Available email fields:", {
                    email: professorData.email,
                    profEmail: professorData.profEmail,
                    userEmail: professorData.userEmail
                });
                
                if (professorData.email) {
                    setEmail(professorData.email);
                    console.log("✅ Auto-populated email from localStorage:", professorData.email);
                } else {
                    console.log("⚠️ No email field found in professor data");
                    // Try alternative email fields
                    const alternativeEmail = professorData.profEmail || professorData.userEmail;
                    if (alternativeEmail) {
                        setEmail(alternativeEmail);
                        console.log("✅ Using alternative email field:", alternativeEmail);
                    }
                }
            } else {
                console.log("⚠️ No professor data found in localStorage");
            }
        } catch (error) {
            console.error("❌ Error reading professor data from localStorage:", error);
        }
    }, []);

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

    const handleEmailChange = (e) => {
        const value = e.target.value;
        setEmail(value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Join the code parts into a single string
        const code = verificationCode.join("");

        console.log("🔍 [EmailVerification] Debug info:");
        console.log("📧 Email being sent:", email);
        console.log("🔢 Code being sent:", code);
        console.log("📊 Code length:", code.length);
        console.log("📋 Request payload:", { verificationCode: code, email });

        if (code.length === 6) {
            try {
                console.log("📤 Sending verification request to:", `${baseURL}/api/auth/verify`);
                const response = await axios.put(`${baseURL}/api/auth/verify`, { verificationCode: code, email });
                
                console.log("✅ Verification successful:", response.data);
                if (response.status === 200) {
                    localStorage.setItem("professor", JSON.stringify(response.data))
                    window.location.href = "/";
                }
            } catch (error) {
                console.error("❌ Verification failed:", error);
                console.log("📊 Error details:");
                console.log("- Status:", error.response?.status);
                console.log("- Status Text:", error.response?.statusText);
                console.log("- Response Data:", error.response?.data);
                console.log("- Request URL:", error.config?.url);
                console.log("- Request Data:", error.config?.data);
                
                // Provide specific error messages based on the response
                let errorMessage = "Invalid code. Please try again.";
                if (error.response) {
                    switch (error.response.status) {
                        case 400:
                            if (error.response.data === "Professor email and code do not match") {
                                errorMessage = "The verification code doesn't match. Please check your email for the correct code.";
                            } else if (error.response.data?.error === "Invalid email") {
                                errorMessage = "Email not found. Please check the email address.";
                            } else {
                                errorMessage = error.response.data || "Invalid verification code.";
                            }
                            break;
                        case 500:
                            errorMessage = "Server error. Please try again later.";
                            break;
                        default:
                            errorMessage = "Verification failed. Please try again.";
                    }
                }
                
                alert(errorMessage);
            }
        } else {
            alert("Please enter a valid 6-digit code.");
        }
    };

    return (
        <div className="container" id="verification-container">
            <div className="form-container verification">
                <form onSubmit={handleSubmit}>
                    <p>Enter the 6-digit verification code sent to your email.</p>
                    <div className='email-input-group'>
                    <h5>Enter Email:</h5>
                    <input
                            type="email"
                            value={email}
                            onChange={handleEmailChange}
                            placeholder="Email"
                            className="email-input"
                            required
                        />
                    </div>
                    <div className="input-group">
                        <h5>Enter Code:</h5>
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