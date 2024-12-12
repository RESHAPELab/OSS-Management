import React, { useState } from "react";
import "./LoginSignup.css"; 
import axios from 'axios'
let baseURL = `http://localhost:${process.env.PORT || 8080}`;

const LoginSignup = () => {
    const [isSignup, setIsSignup] = useState(false);

    const [profRegisterData, setProfRegisterData] = useState ({ 
        name: '',
        email: '',
        password: ''
    })

    const [profLoginData, setProfLoginData] = useState({ 
        email: '',
        password: ''
    })

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
        e.preventDefault()
        try { 
            const response = await axios.post(`${baseURL}/api/auth`, profRegisterData)
            console.log(response.data);
            if (response.status === 201) { 
                const professor = await axios.get(`${baseURL}/api/group/${response.data._id}`)
                if(professor) { 
                    localStorage.setItem("professor", JSON.stringify(professor.data))
                    window.location.href = "/verify"
                }
            }
        } catch(error) { 
            console.log(`Error registering:`, error)
        }
    }

    const handleLoginSubmit = async (e) => {
        e.preventDefault()
        try { 
            const response = await axios.post(`${baseURL}/api/auth/login`, profLoginData)
            if (response.status === 200) { 
                const professor = await axios.get(`${baseURL}/api/group/${response.data._id}`)
                if (professor) { 
                    localStorage.setItem("professor", JSON.stringify(professor.data))
                    window.location.href = "/verify"
                }
            }
        } catch(error) { 
            console.log(`Error logging in:`, error)
        }
    }

    return (
        <div className={`container ${isSignup ? "active" : ""}`} id="container">
            {/* Sign Up Form */}
            <div className="form-container sign-up">
                <form onSubmit={handleRegisterSubmit}>
                    <h1>Professor Signup</h1>
                    <input type="text" placeholder="Name" name='name' value={profRegisterData.name} onChange={handleChange}/>
                    <input type="email" placeholder="Email" name='email' value={profRegisterData.email} onChange={handleChange}/>
                    <input type="password" placeholder="Password" name='password' value={profRegisterData.password} onChange={handleChange}/>
                    <button type="submit">Sign Up</button>
                </form>
            </div>

            {/* Sign In Form */}
            <div className="form-container sign-in">
                <form onSubmit={handleLoginSubmit}>
                    <h1>Professor Login</h1>
                    <input type="email" placeholder="Email" name='email' value={profLoginData.email} onChange={handleChange}/>
                    <input type="password" placeholder="Password" name='password' value={profLoginData.password} onChange={handleChange}/>
                    <a href="#">Forgot Your Password?</a>
                    <button type="submit">Sign In</button>
                </form>
            </div>

            {/* Toggle Panel */}
            <div className="toggle-container">
                <div className="toggle">
                    <div className="toggle-panel toggle-left">
                        <h1>Welcome Back!</h1>
                        <p>Sign in to manage your classes and review student progress!</p>
                        <button className="hidden" onClick={handleLoginClick}>
                            Sign In
                        </button>
                    </div>
                    <div className="toggle-panel toggle-right">
                        <h1>Hello, Professor!</h1>
                        <p>Register now to begin creating your own classes and quests, and gain access to all your students' progress!</p>
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
