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
    console.log('classinfo', classInfo)
    const studentProgress = studentInfo.progress?.find(p => p.group.toString() === classID.toString());
    console.log('studentprogre', studentProgress)
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
                                    {classInfo && classInfo.quests && classInfo.quests.length > 0 && studentInfo.progress && studentInfo.progress.length > 0 ? (
                                        classInfo.quests.map((quest, index) => {
                                            const completedQuest = studentProgress?.completed.find(c => c.quest === quest._id.toString());

                                            let completionPercentage = 0;
                                            let grade = 0;

                                            if (completedQuest) {
                                                const currentQuest = classInfo.quests.find(q => q._id.toString() === quest._id.toString());
                                                if (currentQuest) {
                                                    const totalTasks = quest.tasks.length;
                                                    const completedTasks = completedQuest.tasks.length;

                                                    completionPercentage = (completedTasks / totalTasks) * 100;

                                                    if (completionPercentage === 100) {
                                                        grade = 100;
                                                    } else if (completionPercentage >= 75) {
                                                        grade = 90;
                                                    } else if (completionPercentage >= 50) {
                                                        grade = 75;
                                                    } else {
                                                        grade = 60;
                                                    }
                                                }
                                            }
                                            return (
                                                <tr key={index}>
                                                    <td className="first-col">{quest.questKey}</td>
                                                    <td className="second-col">{completionPercentage.toFixed(1)}%</td>
                                                    <td className="third-col">{grade.toFixed(1)}%</td>
                                                </tr>
                                            );
                                        })
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
                            <h5 className="grade inside-info-children">Overall grade: {studentProgress?.xp / studentProgress?.points * 100}%</h5>
                            <h5 className="current-task inside-info-children">Current Task: {
                                studentProgress?.current?.quest && studentProgress?.current?.task ? (
                                    classInfo?.quests?.find((quest) => quest._id === studentProgress?.current?.quest) ? (
                                        (() => {
                                            const quest = classInfo?.quests?.find((quest) => quest._id === studentProgress?.current?.quest);
                                            const task = quest?.tasks.find((task) => task._id === studentProgress?.current?.task);

                                            return task ? `${quest.questKey}-${task.taskKey}` : "Task not found";
                                        })()
                                    ) : "Quest not found"
                                ) : (
                                    "No quest or task assigned yet"
                                )
                            }</h5>
                            <h5 className="streak inside-info-children">Highest Streak Count: {studentProgress?.streakCount}</h5>
                            <h5 className="xp inside-info-children">XP: {studentProgress?.xp}</h5>
                            <h5 className="points inside-info-children">Total points: {studentProgress?.points}</h5>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default StudentView