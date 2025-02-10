import { useEffect, useState } from "react";
import "./ClassView.css";
import "bootstrap/dist/css/bootstrap.min.css"
import { useParams } from 'react-router-dom'
import HomeHeader from '../home/components/HomeHeader'
import axios from 'axios'
import { useAuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom'


let baseURL = `http://localhost:${process.env.PORT || 8080}`;

const ClassView = () => {
    const { classId } = useParams();
    const [classInfo, setClassInfo] = useState({})
    const { authUser } = useAuthContext();
    const [activeIndex, setActiveIndex] = useState(null);
    const [studentData, setStudentData] = useState([{}]);
    const [isActive, setIsActive] = useState();
    const navigate = useNavigate();

    useEffect(() => {
        if (authUser) {
            console.log("logged in user:", authUser.profName)
            fetchClassInfo();
        }
    }, [authUser])


    const toggleAccordion = (index) => {
        setActiveIndex(activeIndex === index ? null : index);
    };

    useEffect(() => {
        console.log('studentData:', studentData);
        console.log('classInfo', classInfo)
    }, [studentData]);



    const fetchClassInfo = async () => {
        try {
            const response = await axios.get(`${baseURL}/api/group/class/${classId}`)
            setClassInfo(response.data)
            setIsActive(response.data.active);
            setStudentData(response.data.students)
        } catch (error) {
            console.error(`Error fetching class info: `, error)
        }
    }

    const handleStudentClick = (studentId) => {
        classInfo.quests.map((quest, index) => (
            console.log(quest.questKey)
        ))
        navigate(`/class/${classId}/student/${studentId}`)
    }

    const handleActiveToggle = async (classID) => {
        console.log('class id', classID)
        const newActiveState = !isActive;
        setIsActive(newActiveState)
        try{ 
            const response = await axios.put(`${baseURL}/api/group/class/${classID}`, {
                active: newActiveState
            })
            if (response.status === 200) { 
                console.log("Group updated:", response.data);
            } else {
                console.error('error updating group:', response)
            }
        } catch(error) {
            console.error("Error updating group", error)
        }
    }


    return (
        <div>
            <HomeHeader className="header" />
            <div className="class-container">
                <h1>{classInfo.groupName}</h1>
                <h2>Class Code: {classInfo.classCode}</h2>
                <div className="above-class-info">
                    <h5>Export Grades</h5>
                    <h5 className="check"><input type="checkbox" checked={isActive} onChange={() => handleActiveToggle(classInfo.groupID)}/>Active class</h5>
                </div>
                <div className="class-info">
                <div className="course-outline title">
                        <h3 className="title">Course Outline</h3>
                        <div className="inside-info">
                        {classInfo && classInfo.quests && classInfo.quests.length > 0 ? (
                        <div id="accordion">
                            {classInfo.quests.map((quest, index) => (
                                <div className="card" key={quest._id}>
                                    <div className="card-header" id={`heading${index}`}>
                                        <h5 className="mb-0">
                                            <button
                                                className={`btn btn-link course-outline-button ${activeIndex === index ? '' : 'collapsed'}`}
                                                onClick={() => toggleAccordion(index)}
                                                aria-expanded={activeIndex === index}
                                                aria-controls={`collapse${index}`}
                                            >
                                                {quest.questKey} - {quest.questTitle}  {/* Quest title */}
                                            </button>
                                        </h5>
                                    </div>

                                    <div
                                        id={`collapse${index}`}
                                        className={`collapse ${activeIndex === index ? 'show' : ''}`}
                                        aria-labelledby={`heading${index}`}
                                        data-parent="#accordion"
                                    >
                                        <div className="card-body">
                                            {/* Map through tasks and display them */}
                                            <ul className="course-outline-list">
                                                {quest.tasks.map((task, taskIndex) => (
                                                    <li key={taskIndex}>
                                                        {task.taskKey} - {task.taskTitle}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        ) : (
                            <div style={{ fontSize: '1.3rem' }}>
                                No course outline available yet.
                            </div>
                        )}
                    </div>
                </div>
                <div className="class-quest-completion title">
                        <h3 className="title">Quest Completion</h3>
                        <div className="table-responsive inside-info">
                            <table className="table table-bordered">
                                <thead>
                                    <tr>
                                        <th className="first-col" scope="col">Quest</th>
                                        <th className="second-col" scope="col">% Completed</th>
                                        <th className="third-col" scope="col">Avg Grade</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {classInfo && classInfo.quests && classInfo.quests.length > 0 ? (
                                        classInfo.quests.map((quest, index) => (
                                            <tr key={index}>
                                                <td className="first-col">{quest.questKey}</td>
                                                <td className="second-col">97%</td>
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
            </div>
            <div className="students">
                        <h3 className="title">Students</h3>
                        <div class="table-responsive inside-info">
                            <table className="table table-bordered">
                                <thead>
                                    <tr>
                                        <th className="student-first-col" scope="col">Student Name</th>
                                        <th className="student-second-col" scope="col">Completed Quests</th>
                                        <th className="student-third-col" scope="col">Grade</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {studentData && studentData.length > 0 ? (
                                        studentData.map((student, index) => (
                                            <tr key={index}>
                                                <td onClick={() => handleStudentClick(student._id)} className="student-first-col">{student.firstName} {student.lastName}</td>
                                                <td className="student-second-col">97%</td>
                                                <td className="student-third-col">90%</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="4" className="text-center">
                                                No students enrolled.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
            </div>
        </div>
        </div>
    )
}

export default ClassView

