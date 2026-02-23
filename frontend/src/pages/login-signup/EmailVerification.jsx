import React, { useState } from "react";
import "./EmailVerification.css";
import axios from "axios";
import { API_BASE_URL } from "../../config/api";
let baseURL = API_BASE_URL;

const EmailVerification = () => {
  const [verificationCode, setVerificationCode] = useState([
    "",
    "",
    "",
    "",
    "",
    "",
  ]);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e, index) => {
    const value = e.target.value;

    if (/[0-9]/.test(value) || value === "") {
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
    setError("");
    setSuccess("");
    setLoading(true);

    // Join the code parts into a single string
    const code = verificationCode.join("");

    if (code.length === 6) {
      try {
        const response = await axios.put(`${baseURL}/api/auth/verify`, {
          verificationCode: code,
          email,
        });
        if (response.status === 200) {
          setSuccess("Email verified successfully! Redirecting to dashboard...");
          localStorage.setItem("professor", JSON.stringify(response.data));
          setTimeout(() => {
            window.location.href = "/";
          }, 2000);
        }
      } catch (error) {
        console.error("Error verifying code:", error);
        let errorMessage = "Invalid code. Please try again.";
        
        if (error.response?.data?.error) {
          errorMessage = error.response.data.error;
        } else if (error.response?.data) {
          errorMessage = typeof error.response.data === 'string' 
            ? error.response.data 
            : "Verification failed. Please try again.";
        }
        
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    } else {
      setError("Please enter a valid 6-digit code.");
      setLoading(false);
    }
  };

  return (
    <div className="container" id="verification-container">
      {/* Error Display */}
      {error && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#ff4444',
          color: 'white',
          padding: '15px 25px',
          borderRadius: '8px',
          zIndex: 10000,
          maxWidth: '450px',
          textAlign: 'center',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          fontWeight: '500'
        }}>
          {error}
        </div>
      )}
      
      {/* Success Display */}
      {success && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#4CAF50',
          color: 'white',
          padding: '15px 25px',
          borderRadius: '8px',
          zIndex: 10000,
          maxWidth: '450px',
          textAlign: 'center',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          fontWeight: '500'
        }}>
          {success}
        </div>
      )}
      
      <div className="form-container verification">
        <form onSubmit={handleSubmit}>
          <p>Enter the 6-digit verification code sent to your email.</p>
          <div className="email-input-group">
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
          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? "Verifying..." : "Verify Code"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EmailVerification;
