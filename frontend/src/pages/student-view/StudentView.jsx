import { useEffect, useState } from "react";
import { useParams } from 'react-router-dom'
import HomeHeader from '../home/components/HomeHeader'
import axios from 'axios'
import { useAuthContext } from '../../context/AuthContext';
import "./StudentView.css";
import "bootstrap/dist/css/bootstrap.min.css"

let baseURL = `http://localhost:${process.env.PORT || 8080}`;


const StudentView = () => {
    const { classId: classID, studentId: studentID } = useParams();
    const [studentInfo, setStudentInfo] = useState({})
    const { authUser } = useAuthContext();
    const [classInfo, setClassInfo] = useState({})

    useEffect(() => {
        if (authUser) {
            console.log("logged in user:", authUser.profName)
            fetchStudentInfo();
            fetchClassInfo();
        }
    }, [authUser])

    const fetchStudentInfo = async () => {
        try {
            console.log('student', studentID);
            console.log('class', classID);
            const response = await axios.get(`${baseURL}/api/student/${classID}/student/${studentID}`)
            setStudentInfo(response.data)
            console.log(response.data);
        } catch (error) {
            console.error(`Error fetching student info: `, error)
        }
    }

    const fetchClassInfo = async () => {
        try {
            const response = await axios.get(`${baseURL}/api/group/class/${classID}`)
            setClassInfo(response.data)
        } catch (error) {
            console.error(`Error fetching class info: `, error)
        }
    }

    return (
        <div>
            <HomeHeader className="header" />
            <div className="student-view-container">
                <h1>{studentInfo.firstName} {studentInfo.lastName}</h1>
                <h2>Enrolled in class "{classInfo.groupName}"</h2>
                <div className="above-class-info">
                    <h5>email: {studentInfo.studentEmail}</h5>
                    <h5>github: {studentInfo.githubUsername}</h5>
                </div>
                <div className="class-info">
                    <div className="quest-completion title">
                        <h3 className="title">Quest Completion</h3>
                        <div className="table-responsive inside-info">
                            <table className="table table-bordered">
                                <thead>
                                    <tr>
                                        <th className="first-col" scope="col">Quest</th>
                                        <th className="second-col" scope="col">% Completed</th>
                                        <th className="third-col" scope="col">Grade</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {classInfo && classInfo.quests && classInfo.quests.length > 0 ? (
                                        classInfo.quests.map((quest, index) => (
                                            <tr key={index}>
                                                <td className="first-col">{quest.questKey}</td>
                                                <td className="second-col">100%</td>
                                                <td className="third-col">90%</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="4" className="text-center">
                                                No quests have been set up for this class yet.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className="grades title">
                        <h3 className="title">Current Status</h3>
                        <div className="inside-info inside-info-margin">
                                <h5 className="grade inside-info-children">Overall grade: 92%</h5>
                                <h5 className="current-task inside-info-children">Current Task: T1</h5>
                                <h5 className="streak inside-info-children">Highest Streak Count: 12</h5>
                                <h5 className="xp inside-info-children">XP: 81</h5>
                                <h5 className="points inside-info-children">Total points: 80</h5>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default StudentView