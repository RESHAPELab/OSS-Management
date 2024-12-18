import React, { useState } from "react";
import axios from 'axios'

let baseURL = `http://localhost:${process.env.PORT || 8080}`;

const StudentRegister = () => {
    const [studentRegisterData, setStudentRegisterData] = useState ({ 
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
        try { 
            console.log(studentRegisterData)
            const response = await axios.post(`${baseURL}/api/auth/student`, studentRegisterData)
            console.log(response.data);
            if (response.status === 201) { 
                const student = await axios.get(`${baseURL}/api/group/${response.data._id}`)
                console.log('student registered', student)
            }
        } catch(error) { 
            console.log(`Error registering:`, error)
        }
    }

    return (
        <div className="container active" id="container">

            <div className="form-container sign-up">
                <form onSubmit={handleRegisterSubmit}>
                    <h1>Student Signup</h1>
                    <input type="text" placeholder="First Name" name='firstName' value={studentRegisterData.firstName} onChange={handleChange}/>
                    <input type="lastName" placeholder="Last Name" name='lastName' value={studentRegisterData.lastName} onChange={handleChange}/>
                    <input type="githubUsername" placeholder="Github Username" name='githubUsername' value={studentRegisterData.githubUsername} onChange={handleChange}/>
                    <input type="studentEmail" placeholder="Student Email" name='studentEmail' value={studentRegisterData.studentEmail} onChange={handleChange}/>
                    <input type="classCode" placeholder="Class Code" name='classCode' value={studentRegisterData.classCode} onChange={handleChange}/>
                    <button type="submit">Sign Up</button>
                </form>
            </div>
        </div>
    );
};

export default StudentRegister;
