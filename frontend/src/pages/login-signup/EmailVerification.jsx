import React, { useState, useEffect, useRef } from "react";
import "./EmailVerification.css";
import axios from 'axios'
let baseURL = `http://localhost:${process.env.PORT || 8080}`;


const EmailVerification = () => {
    const [verificationCode, setVerificationCode] = useState(["", "", "", "", "", ""])
    const [email, setEmail] = useState("")
    const [code, setCode] = useState('');

    const inputRefs = [
        useRef(null),
        useRef(null),
        useRef(null),
        useRef(null),
        useRef(null),
        useRef(null),
    ];

    // const resetCode = () => {
    //     inputRefs.forEach(ref => {
    //         ref.current.value = '';
    //     });
    //     inputRefs[0].current.focus();
    //     setCode('');
    // }

    // useEffect(() => {
    //     if (code.length === 6) {
    //         if (typeof callback === 'function') callback(code);
    //         resetCode();
    //     }
    // }, [code]);

    // useEffect(() => {
    //     resetCode();
    // }, [reset]);

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

    const handleEmailChange = (e) => {
        const value = e.target.value;
        setEmail(value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.put(`${baseURL}/api/auth/verify`, { verificationCode: code, email });
            if (response.status === 200) {
                sessionStorage.setItem("professor", JSON.stringify(response.data))
                window.location.href = "/";
            }
        } catch (error) {
            console.error("Error verifying code:", error);
            alert("Invalid code. Please try again.");
        }

    };

    return (
        <div className="container" id="verification-container">
            <div className="panel-container">
                <div className="panel">
                    <div className="student-panel panel-right">
                        <h1 className="h1-smaller">Verify your account to be directed to your dashboard!</h1>
                    </div>
                </div>
            </div>
            <div className="form-container verification">
                <form onSubmit={handleSubmit}>
                    <h1>Email Verification</h1>
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
                    </div>
                    <button type="submit" className="submit-button">Verify Code</button>
                </form>
            </div>
        </div>
    )
}

export default EmailVerification