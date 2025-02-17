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
        try {
            const response = await axios.put(`${baseURL}/api/group/class/${classID}`, {
                active: newActiveState
            })
            if (response.status === 200) {
                console.log("Group updated:", response.data);
            } else {
                console.error('error updating group:', response)
            }
        } catch (error) {
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
                    <h5 className="check"><input type="checkbox" checked={isActive} onChange={() => handleActiveToggle(classInfo.groupID)} />Active class</h5>
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
                            {/* <table className="table table-bordered">
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
                            </table> */}
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
                                        classInfo.quests.map((quest, index) => {
                                            // Calculate the completion and grade for each quest
                                            let totalCompletion = 0;
                                            let totalGrade = 0;
                                            let studentCount = 0;

                                            classInfo.students.forEach((student) => {
                                                // Get the student's progress for the current group
                                                const studentProgress = student.progress.find(p => p.group.toString() === classInfo.groupID.toString());

                                                // Check if the student has completed any tasks for this quest
                                                const completedQuest = studentProgress?.completed.find(c => c.quest.toString() === quest._id.toString());

                                                if (completedQuest) {
                                                    const totalTasks = quest.tasks.length;
                                                    const completedTasks = completedQuest.tasks.filter(taskId => quest.tasks.some(task => task._id.toString() === taskId.toString())).length;

                                                    // Calculate completion percentage for this student
                                                    const completionPercentage = (completedTasks / totalTasks) * 100;
                                                    totalCompletion += completionPercentage;

                                                    // Example grade based on completion percentage
                                                    let grade = 0;
                                                    if (completionPercentage === 100) {
                                                        grade = 100;
                                                    } else if (completionPercentage >= 75) {
                                                        grade = 90;
                                                    } else if (completionPercentage >= 50) {
                                                        grade = 75;
                                                    } else {
                                                        grade = 60;
                                                    }
                                                    totalGrade += grade;
                                                    studentCount++;
                                                }
                                            });

                                            // Calculate average completion percentage and average grade
                                            const averageCompletion = studentCount > 0 ? (totalCompletion / studentCount).toFixed(1) : 0;
                                            const averageGrade = studentCount > 0 ? (totalGrade / studentCount).toFixed(1) : 0;

                                            return (
                                                <tr key={index}>
                                                    <td className="first-col">{quest.questKey}</td>
                                                    <td className="second-col">{averageCompletion}%</td>
                                                    <td className="third-col">{averageGrade}%</td>
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
                                    studentData.map((student, index) => {
                                        // Assuming student has a progress array, and you can access the current class's progress
                                        const studentProgress = student.progress?.find(p => p.group.toString() === classId.toString());

                                        if (!studentProgress) {
                                            return (
                                                <tr key={index} onClick={() => handleStudentClick(student._id)}>
                                                    <td className="student-first-col">{student.firstName} {student.lastName}</td>
                                                    <td className="student-second-col">No progress data</td>
                                                    <td className="student-third-col">No grade</td>
                                                </tr>
                                            );
                                        }

                                        // Get the list of completed quests from the student's progress
                                        const completedQuests = studentProgress.completed;

                                        // Initialize variables to calculate overall completion percentage
                                        let totalCompletionPercentage = 0;
                                        let numberOfQuests = classInfo?.quests?.length || 0;

                                        // Loop through each quest and calculate its completion percentage
                                        classInfo?.quests?.forEach((quest) => {
                                            const completedQuest = completedQuests.find((completed) => completed.quest.toString() === quest._id.toString());
                                            console.log('completed quest', completedQuest)
                                            if (completedQuest) {
                                                const totalTasks = quest.tasks.length;
                                                const completedTasks = completedQuest.tasks.filter(taskId => quest.tasks.some(task => task._id.toString() === taskId.toString())).length;
                                                console.log('tasks all', quest.tasks)
                                                const questCompletionPercentage = (completedTasks / totalTasks) * 100;
                                                console.log('quest completion percentage', completedTasks, totalTasks, questCompletionPercentage)
                                                totalCompletionPercentage += questCompletionPercentage;
                                            } else {
                                                // If the quest is not completed at all, consider it as 0% completion
                                                totalCompletionPercentage += 0;
                                            }
                                        });

                                        // Calculate overall completion percentage by dividing by number of quests
                                        const overallCompletionPercentage = totalCompletionPercentage / numberOfQuests;

                                        // Calculate grade based on the completion percentage
                                        // let grade = 0;
                                        // if (overallCompletionPercentage === 100) {
                                        //     grade = 100;
                                        // } else if (overallCompletionPercentage >= 75) {
                                        //     grade = 90;
                                        // } else if (overallCompletionPercentage >= 50) {
                                        //     grade = 75;
                                        // } else {
                                        //     grade = 60;
                                        // }

                                        let grade = studentProgress?.xp / studentProgress?.points * 100

                                        return (
                                            <tr key={index}>
                                                <td onClick={() => handleStudentClick(student._id)} className="student-first-col">
                                                    {student.firstName} {student.lastName}
                                                </td>
                                                <td className="student-second-col">{overallCompletionPercentage.toFixed(1)}%</td>
                                                <td className="student-third-col">{grade}%</td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="3" className="text-center">No students found</td>
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

