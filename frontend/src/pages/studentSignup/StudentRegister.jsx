import React, { useState } from "react";
import axios from 'axios'
import './StudentRegister.css'

let baseURL = `http://localhost:${process.env.PORT || 8080}`;

const StudentRegister = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [studentRegisterData, setStudentRegisterData] = useState({
        firstName: '',
        lastName: '',
        githubUsername: '',
        studentEmail: '',
        classCode: ''
    })


    const handleChange = (e) => {
        const { name, value } = e.target;
        setStudentRegisterData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleRegisterSubmit = async (e) => {
        e.preventDefault()
        setIsLoading(true);
        try {
            const studentInfo = await axios.post(`${baseURL}/api/auth/student`, studentRegisterData)

            const groupInfo = await axios.get(`${baseURL}/api/group/code/groupByCode/${studentRegisterData.classCode}`);

            const org = await axios.get(`${baseURL}/api/repo/prodStatus`);
            const organizationGh = org.data.organizationGh;
            const studentId = studentInfo.data._id;
            const studentGithubUsername = studentInfo.data.githubUsername;
            const groupId = groupInfo.data._id;
            const groupName = groupInfo.data.groupName;

            const send = { organizationGh, studentId, studentGithubUsername, groupId, groupName }

            // get the response to include the url that the students repo is at
            const repoResponse = await axios.post(`${baseURL}/api/repo/repository`, send);
            let repoName = repoResponse.data.repoName;

            if (studentInfo.status === 200 && groupInfo.status === 200) {
                console.log("yay")
                window.location.href = `/studentRegistered/${repoName}`
            }
        } catch (error) {
            console.log(`Error registering:`, error)
        } finally { 
            setIsLoading(false);
        }
    }

    return (
        <div className="container active sign-up-container student-sign-up-container" id="container">tre
            <div className="panel-container">
                <div className="panel">
                    <div className="student-panel panel-right">
                        <h1>Welcome!</h1>
                        <p>Enter the class code from your professor to get started!</p>
                    </div>
                </div>
            </div>
            <div className="form-container student-sign-up">
                <form onSubmit={handleRegisterSubmit}>
                    <h1>Student Signup</h1>
                    <input type="text" placeholder="First Name" name='firstName' value={studentRegisterData.firstName} onChange={handleChange} />
                    <input type="lastName" placeholder="Last Name" name='lastName' value={studentRegisterData.lastName} onChange={handleChange} />
                    <input type="githubUsername" placeholder="Github Username" name='githubUsername' value={studentRegisterData.githubUsername} onChange={handleChange} />
                    <input type="studentEmail" placeholder="Student Email" name='studentEmail' value={studentRegisterData.studentEmail} onChange={handleChange} />
                    <input type="classCode" placeholder="Class Code" name='classCode' value={studentRegisterData.classCode} onChange={handleChange} />
                    <button type="submit" disabled={isLoading}>
                        {isLoading ? 'Loading...' : 'Sign Up'} {/* Change button text */}
                    </button>
                    <a href="/login">Professor Login</a>
                </form>
            </div>
        </div>
    );
};

export default StudentRegister;
