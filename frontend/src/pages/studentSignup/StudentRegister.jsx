import React, { useState } from "react";
import axios from "axios";
import "./StudentRegister.css";
import { API_BASE_URL } from "../../config/api";
let baseURL = API_BASE_URL;

const StudentRegister = () => {
  const [studentRegisterData, setStudentRegisterData] = useState({
    firstName: "",
    lastName: "",
    githubUsername: "",
    studentEmail: "",
    classCode: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setStudentRegisterData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    
    try {
      const studentInfo = await axios.post(
        `${baseURL}/api/auth/student`,
        studentRegisterData
      );
      console.log(studentInfo.data);

      const groupInfo = await axios.get(
        `${baseURL}/api/group/code/groupByCode/${studentRegisterData.classCode}`
      );
      console.log(groupInfo.data);

      const org = await axios.get(`${baseURL}/api/repo/prodStatus`);
      console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
      const organizationGh = org.data.organizationGh;
      const studentId = studentInfo.data._id;
      const studentGithubUsername = studentInfo.data.githubUsername;
      const groupId = groupInfo.data._id;
      const groupName = groupInfo.data.groupName;

      console.log(
        "log",
        organizationGh,
        studentId,
        studentGithubUsername,
        groupId,
        groupName
      );
      const send = {
        organizationGh,
        studentId,
        studentGithubUsername,
        groupId,
        groupName,
      };

      // get the response to include the url that the students repo is at
      const repoResponse = await axios.post(
        `${baseURL}/api/repo/repository`,
        send
      );
      console.log(repoResponse);

      if (studentInfo.status === 200 && groupInfo.status === 200) {
        setSuccess("Registration successful! Redirecting to confirmation page...");
        setTimeout(() => {
          window.location.href = "/studentRegistered";
        }, 2000);
      }
    } catch (error) {
      console.log(`Error registering:`, error);
      let errorMessage = "Registration failed. Please try again.";
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data) {
        errorMessage = typeof error.response.data === 'string' 
          ? error.response.data 
          : "Registration failed. Please check your information and try again.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container active sign-up-container" id="container">
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
      
      <div className="form-container student-sign-up">
        <form onSubmit={handleRegisterSubmit}>
          <h1>Student Signup</h1>
          <input
            type="text"
            placeholder="First Name"
            name="firstName"
            value={studentRegisterData.firstName}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            placeholder="Last Name"
            name="lastName"
            value={studentRegisterData.lastName}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            placeholder="Github Username"
            name="githubUsername"
            value={studentRegisterData.githubUsername}
            onChange={handleChange}
            required
          />
          <input
            type="email"
            placeholder="Student Email"
            name="studentEmail"
            value={studentRegisterData.studentEmail}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            placeholder="Class Code"
            name="classCode"
            value={studentRegisterData.classCode}
            onChange={handleChange}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? "Signing Up..." : "Sign Up"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default StudentRegister;
