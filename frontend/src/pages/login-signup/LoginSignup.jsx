import React, { useState } from "react";
import "./LoginSignup.css";
import axios from "axios";
import { API_BASE_URL } from "../../config/api";

let baseURL = API_BASE_URL;

const LoginSignup = () => {
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState("");
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

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      const response = await axios.post(
        `${baseURL}/api/auth`,
        profRegisterData
      );
      console.log(response.data);
      if (response.status === 201) {
        const professor = await axios.get(
          `${baseURL}/api/group/${response.data._id}`
        );
        if (professor) {
          localStorage.setItem("professor", JSON.stringify(professor.data));
          window.location.href = "/verify";
        }
      }
    } catch (error) {
      console.log(`Error registering:`, error);
      if (error.response?.data) {
        setError(error.response.data);
      } else if (error.message) {
        setError(error.message);
      } else {
        setError("Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      const response = await axios.post(
        `${baseURL}/api/auth/login`,
        profLoginData
      );
      if (response.status === 200) {
        const professor = await axios.get(
          `${baseURL}/api/group/${response.data._id}`
        );
        if (professor) {
          localStorage.setItem("professor", JSON.stringify(professor.data));
          if (!professor.data.verified) {
            window.location.href = "/verify";
          } else {
            window.location.href = "/";
          }
        }
      }
    } catch (error) {
      console.log(`Error logging in:`, error);
      if (error.response?.data?.error) {
        setError(error.response.data.error);
      } else if (error.response?.data) {
        setError(error.response.data);
      } else if (error.message) {
        setError(error.message);
      } else {
        setError("Login failed. Please try again.");
      }
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
          padding: '10px 20px',
          borderRadius: '5px',
          zIndex: 1000,
          maxWidth: '400px',
          textAlign: 'center'
        }}>
          {error}
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
          <a href="#">Forgot Your Password?</a>
          <button type="submit" disabled={loading}>
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>
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
