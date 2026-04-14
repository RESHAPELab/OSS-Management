import React, { useState } from "react";
import "./LoginSignup.css";
import axios from "axios";
import { API_BASE_URL } from "../../config/api";

let baseURL = API_BASE_URL;

/** API errors may be strings, { error: string|object }, or { message }. Never pass objects to React children. */
function axiosErrorToString(err, fallback) {
  const data = err?.response?.data;
  if (typeof data === "string") return data;
  if (data && typeof data === "object") {
    const e = data.error;
    if (typeof e === "string") return e;
    if (e && typeof e === "object" && typeof e.message === "string") return e.message;
    if (typeof data.message === "string") return data.message;
  }
  if (typeof err?.message === "string") return err.message;
  return fallback;
}

const LoginSignup = () => {
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const [profRegisterData, setProfRegisterData] = useState({
    name: "",
    email: "",
    password: "",
    githubUsername: "",
  });

  const [profLoginData, setProfLoginData] = useState({
    email: "",
    password: "",
  });

  const [resetOpen, setResetOpen] = useState(false);
  const [resetCodeSent, setResetCodeSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [recoverData, setRecoverData] = useState({
    email: "",
    code: "",
    newPassword: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (isSignup) {
      setProfRegisterData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
    } else {
      setProfLoginData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
    }
  };

  const handleRegisterClick = () => {
    setIsSignup(true);
  };

  const handleLoginClick = () => {
    setIsSignup(false);
  };

  const openPasswordReset = () => {
    setResetOpen(true);
    setResetCodeSent(false);
    setRecoverData((prev) => ({
      ...prev,
      email: prev.email || profLoginData.email,
      code: "",
      newPassword: "",
    }));
    setError("");
    setSuccess("");
  };

  const closePasswordReset = () => {
    setResetOpen(false);
    setResetCodeSent(false);
    setRecoverData({ email: "", code: "", newPassword: "" });
    setError("");
  };

  const handleRecoverFieldChange = (e) => {
    const { name, value } = e.target;
    setRecoverData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSendResetCode = async () => {
    const email = recoverData.email.trim();
    if (!email) {
      setError("Enter your email to receive a reset code.");
      return;
    }
    setError("");
    setSuccess("");
    setResetLoading(true);
    try {
      await axios.post(`${baseURL}/api/auth/recoverPasswordCode`, { email });
      setSuccess("Reset code sent. Check your email.");
      setResetCodeSent(true);
    } catch (err) {
      setError(
        axiosErrorToString(err, "Could not send reset code. Try again.")
      );
    } finally {
      setResetLoading(false);
    }
  };

  const handleConfirmReset = async () => {
    const email = recoverData.email.trim();
    const { code, newPassword } = recoverData;
    if (!email || !code || !newPassword) {
      setError("Email, code, and new password are required.");
      return;
    }
    setError("");
    setSuccess("");
    setResetLoading(true);
    try {
      await axios.post(`${baseURL}/api/auth/recoverPassword`, {
        email,
        code: code.trim(),
        newPassword,
      });
      setSuccess("Password updated. You can sign in now.");
      setResetOpen(false);
      setResetCodeSent(false);
      setRecoverData({ email: "", code: "", newPassword: "" });
      setProfLoginData((prev) => ({ ...prev, email, password: "" }));
    } catch (err) {
      setError(
        axiosErrorToString(err, "Password reset failed. Try again.")
      );
    } finally {
      setResetLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    
    try {
      const response = await axios.post(
        `${baseURL}/api/auth`,
        profRegisterData
      );
      console.log(response.data);
      if (response.status === 201) {
        setSuccess("Registration successful! Please check your email for verification code.");
        const professor = await axios.get(
          `${baseURL}/api/group/${response.data._id}`
        );
        if (professor) {
          localStorage.setItem("professor", JSON.stringify(professor.data));
          setTimeout(() => {
            window.location.href = "/verify";
          }, 2000);
        }
      }
    } catch (error) {
      console.log(`Error registering:`, error);
      setError(
        axiosErrorToString(error, "Registration failed. Please try again.")
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    
    try {
      const response = await axios.post(
        `${baseURL}/api/auth/login`,
        profLoginData
      );
      if (response.status === 200) {
        setSuccess("Login successful! Redirecting...");
        const professor = await axios.get(
          `${baseURL}/api/group/${response.data._id}`
        );
        if (professor) {
          localStorage.setItem("professor", JSON.stringify(professor.data));
          if (!professor.data.verified) {
            setTimeout(() => {
              window.location.href = "/verify";
            }, 1500);
          } else {
            setTimeout(() => {
              window.location.href = "/";
            }, 1500);
          }
        }
      }
    } catch (error) {
      console.log(`Error logging in:`, error);
      setError(axiosErrorToString(error, "Login failed. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`container ${isSignup ? "active" : ""}`} id="container">
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
          {typeof error === "string" ? error : "Something went wrong."}
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
          {typeof success === "string" ? success : ""}
        </div>
      )}
      
      {/* Sign Up Form */}
      <div className="form-container sign-up">
        <form onSubmit={handleRegisterSubmit}>
          <h1>Professor Signup</h1>
          <input
            type="text"
            placeholder="Name"
            name="name"
            value={profRegisterData.name}
            onChange={handleChange}
            required
          />
          <input
            type="email"
            placeholder="Email"
            name="email"
            value={profRegisterData.email}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            placeholder="Password"
            name="password"
            value={profRegisterData.password}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            placeholder="GitHub Username"
            name="githubUsername"
            value={profRegisterData.githubUsername}
            onChange={handleChange}
            required
          />
          <small style={{display: 'block', marginTop: '8px', color: '#666'}}>
            Provide your GitHub username to be registered as an admin for your classes.
          </small>
          <button type="submit" disabled={loading}>
            {loading ? "Signing Up..." : "Sign Up"}
          </button>
        </form>
      </div>

      {/* Sign In Form */}
      <div className="form-container sign-in">
        <div className="sign-in-content">
          <form onSubmit={handleLoginSubmit}>
            <h1>Professor Login</h1>
            <input
              type="email"
              placeholder="Email"
              name="email"
              value={profLoginData.email}
              onChange={handleChange}
              required
            />
            <input
              type="password"
              placeholder="Password"
              name="password"
              value={profLoginData.password}
              onChange={handleChange}
              required
            />
            <button type="submit" disabled={loading}>
              {loading ? "Signing In..." : "Sign In"}
            </button>
            <button
              type="button"
              className="login-link-button"
              onClick={openPasswordReset}
            >
              Forgot password?
            </button>
          </form>
          {resetOpen && (
            <div className="recovery-panel">
              {!resetCodeSent ? (
                <>
                  <p className="recovery-hint">
                    Enter the email for your professor account. We will send a
                    6-digit code (valid 30 minutes).
                  </p>
                  <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={recoverData.email}
                    onChange={handleRecoverFieldChange}
                  />
                  <button
                    type="button"
                    disabled={resetLoading}
                    onClick={handleSendResetCode}
                  >
                    {resetLoading ? "Sending…" : "Send reset code"}
                  </button>
                </>
              ) : (
                <>
                  <p className="recovery-hint">
                    Check your inbox for the code, then choose a new password.
                  </p>
                  <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={recoverData.email}
                    onChange={handleRecoverFieldChange}
                    disabled
                  />
                  <input
                    type="text"
                    name="code"
                    placeholder="6-digit code"
                    value={recoverData.code}
                    onChange={handleRecoverFieldChange}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                  />
                  <input
                    type="password"
                    name="newPassword"
                    placeholder="New password"
                    value={recoverData.newPassword}
                    onChange={handleRecoverFieldChange}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    disabled={resetLoading}
                    onClick={handleConfirmReset}
                  >
                    {resetLoading ? "Updating…" : "Set new password"}
                  </button>
                </>
              )}
              <button
                type="button"
                className="login-link-button"
                onClick={closePasswordReset}
              >
                Back to login
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Toggle Panel */}
      <div className="toggle-container">
        <div className="toggle">
          <div className="toggle-panel toggle-left">
            <h1>Hello, Professor</h1>
            <p>Sign in to manage your classes and review student progress!</p>
            <button className="hidden" onClick={handleLoginClick}>
              Sign In
            </button>
          </div>
          <div className="toggle-panel toggle-right">
            <h1>Welcome Back!</h1>
            <p>
              Register now to begin creating your own classes and quests, and
              gain access to all your students' progress!
            </p>
            <button className="hidden" onClick={handleRegisterClick}>
              Sign Up
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginSignup;
