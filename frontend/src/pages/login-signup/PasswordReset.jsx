import "./PasswordReset.css";
import React, { useState, useEffect } from "react";
import axios from 'axios'


let baseURL = `http://localhost:${process.env.PORT || 8080}`;


const PasswordReset = () => {
    const [verificationCode, setVerificationCode] = useState(["", "", "", "", "", ""])
    const [email, setEmail] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [isEmailSubmitted, setIsEmailSubmitted] = useState(false);

    const handleChange = (e, index) => {
        const value = e.target.value;

        if (/[0-9]/.test(value) || value === '') {
            const newCode = [...verificationCode];
            newCode[index] = value;

            console.log('veriifcation code', newCode)
            setVerificationCode(newCode);
            
            if (value && index < 5) {
                document.getElementById(`input-${index + 1}`).focus();
            }
            console.log('verificationcode', verificationCode)

        }
    };

    const handleEmailChange = (e) => {
        const value = e.target.value;
        setEmail(value);
    };

    const handlePasswordChange = (e) => {
        const value = e.target.value;
        setNewPassword(value);
    };

    const handleEmailSubmit = async () => {
            try {
                const response = await axios.post(`${baseURL}/api/auth/recoverPasswordCode`, {email});
                console.log('email code response data', response.data);
                setIsEmailSubmitted(true);
            } catch (error) {
                console.error("Error verifying code:", error);
            }
    };

    const handleSubmitForm = async () => {
        try{
            const code = verificationCode.join("");
            const response = await axios.post(`${baseURL}/api/auth/recoverPassword`, {email, code, newPassword})
            console.log('reset password data', response.data)
            if (response.status === 200 ) {
                window.location.href = "/passwordResetSuccess"
            }
        } catch (error) {
            console.error("Error in handle password reset form", error)
        }
    }

    return (
        <div className="container" id="verification-container">
            <div className="form-container verification">
                <form>
                    <p>Enter the email used for your account:</p>
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
                    <button type="button" className={`submit-button ${isEmailSubmitted ? 'hidden' : ''}`}  onClick={() => handleEmailSubmit()}>Send Verification Code</button>
                    <div className={`${isEmailSubmitted ? '' : 'hidden'}`}>
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
                                autoFocus={index === 0}
                            />
                        ))}
                    <div className="email-input-group">
                    <h5>Enter New Password:</h5>
                    <input
                            type="password"
                            value={newPassword}
                            onChange={handlePasswordChange}
                            placeholder="New Password"
                            className="new-password-input"
                            required
                        />
                    </div>
                    </div>
                    </div>
                    <button type="button" onClick={() => handleSubmitForm()}className={`submit-button ${isEmailSubmitted ? '' : 'hidden'}`}>Reset Password</button>
                </form>
            </div>
        </div>
    )
}

export default PasswordReset