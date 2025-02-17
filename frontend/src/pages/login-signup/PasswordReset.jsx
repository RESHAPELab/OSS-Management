import "./PasswordReset.css";
import React, { useState, useEffect, useRef } from "react";
import axios from 'axios'



let baseURL = `http://localhost:${process.env.PORT || 8080}`;


const PasswordReset = () => {
    const [verificationCode, setVerificationCode] = useState(["", "", "", "", "", ""])
    const [email, setEmail] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [isEmailSubmitted, setIsEmailSubmitted] = useState(false);
    const [code, setCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const inputRefs = [
        useRef(null),
        useRef(null),
        useRef(null),
        useRef(null),
        useRef(null),
        useRef(null),
    ];


    function handleInput(e, index) {
        const input = e.target;
        const previousInput = inputRefs[index - 1];
        const nextInput = inputRefs[index + 1];

        const newCode = [...code];

        if (/^[a-z]+$/.test(input.value)) {
            const uc = input.value.toUpperCase();
            newCode[index] = uc;
            inputRefs[index].current.value = uc;
        } else {
            newCode[index] = input.value;
        }
        setCode(newCode.join(''));

        input.select();

        if (input.value === '') {

            if (previousInput) {
                previousInput.current.focus();
            }
        } else if (nextInput) {

            nextInput.current.select();
        }
    }


    function handleFocus(e) {
        e.target.select();
    }


    function handleKeyDown(e, index) {
        const input = e.target;
        const previousInput = inputRefs[index - 1];
        const nextInput = inputRefs[index + 1];

        if ((e.keyCode === 8 || e.keyCode === 46) && input.value === '') {
            e.preventDefault();
            setCode((prevCode) => prevCode.slice(0, index) + prevCode.slice(index + 1));
            if (previousInput) {
                previousInput.current.focus();
            }
        }
    }

    const handlePaste = (e) => {
        const pastedCode = e.clipboardData.getData('text');
        if (pastedCode.length === 6) {
            setCode(pastedCode);
            inputRefs.forEach((inputRef, index) => {
                inputRef.current.value = pastedCode.charAt(index);
            });
        }
    };

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
            setIsLoading(true);
            const response = await axios.post(`${baseURL}/api/auth/recoverPasswordCode`, { email });
            console.log('email code response data', response.data);
            setIsEmailSubmitted(true);
        } catch (error) {
            console.error("Error verifying code:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmitForm = async () => {
        setIsLoading(true);
        try {
            const response = await axios.post(`${baseURL}/api/auth/recoverPassword`, { email, code, newPassword })
            console.log('reset password data', response.data)
            if (response.status === 200) {
                window.location.href = "/passwordResetSuccess"
            }
        } catch (error) {
            console.error("Error in handle password reset form", error)
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="container" id="verification-container">
            <div className="panel-container">
                <div className="panel">
                    <div className="student-panel panel-right">
                        <h1>Welcome!</h1>
                        <p>{!isEmailSubmitted ? "Enter your email to begin your account retrieval!" : "Enter the verification code that was emailed to your account to create a new password!"}</p>
                        {/* <p className="">
                    Don't have a code? Contact your professor!
                </p> */}
                    </div>
                </div>
            </div>
            <div className="form-container verification">
                <form>
                    <h1>Password Retrieval</h1>
                    <p className={`submit-button ${isEmailSubmitted ? 'hidden' : ''}`}>Enter the email used for your account:</p>
                    <div className='email-input-group'>
                        <input
                            type="email"
                            value={email}
                            onChange={handleEmailChange}
                            placeholder="Email"
                            className="email-input"
                            required
                        />
                    </div>
                    <button 
                        type="button" 
                        className={`submit-button ${isEmailSubmitted ? 'hidden' : ''}`} 
                        onClick={handleEmailSubmit}
                        disabled={isLoading} // Disable the button while loading
                    >
                        {isLoading ? 'Loading...' : 'Send Verification Code'}
                    </button>
                    <div className={`${isEmailSubmitted ? '' : 'hidden'}`}>
                        <div className="input-group">
                            <h5>Enter Code:</h5>
                            <div className="flex gap-2 relative verification-input">
                            {[0, 1, 2, 3, 4, 5].map((index) => (
                                <input
                                    className="text-2xl bg-gray-800 w-10 flex p-2 text-center"
                                    key={index}
                                    type="text"
                                    maxLength={1}
                                    onChange={(e) => handleInput(e, index)}
                                    ref={inputRefs[index]}
                                    autoFocus={index === 0}
                                    onFocus={handleFocus}
                                    onKeyDown={(e) => handleKeyDown(e, index)}
                                    onPaste={handlePaste}
                                />
                            ))}
                        </div>
                            <div className="email-input-group">
                                <h5>Enter New Password:</h5>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={handlePasswordChange}
                                    placeholder="New Password"
                                    className="new-password-input"
                                    required
                                    style={{ textAlign: 'center' }}
                                />
                            </div>
                        </div>
                    </div>
                    <button 
                        type="button" 
                        onClick={handleSubmitForm}
                        className={`submit-button ${isEmailSubmitted ? '' : 'hidden'}`} 
                        disabled={isLoading}
                    >
                        {isLoading ? 'Loading...' : 'Reset Password'}
                    </button>
                </form>
            </div>
        </div>
    )
}

export default PasswordReset