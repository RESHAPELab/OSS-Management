import { useEffect, useState } from "react";
import "./ClassView.css";
import "bootstrap/dist/css/bootstrap.min.css"
import { useParams } from 'react-router-dom'
import HomeHeader from '../home/components/HomeHeader'
import axios from 'axios'
import { useAuthContext } from '../../context/AuthContext';

let baseURL = `http://localhost:${process.env.PORT || 8080}`;

const ClassView = () => {
    const { classId } = useParams();
    const [classInfo, setClassInfo] = useState({})
    const { authUser } = useAuthContext();
    const [activeIndex, setActiveIndex] = useState(null);


    useEffect(() => {
        if (authUser) {
            console.log("logged in user:", authUser.profName)
            fetchClassInfo();
            console.log(classId);
        }
    }, [authUser])

    const toggleAccordion = (index) => {
        setActiveIndex(activeIndex === index ? null : index);
    };

    const fetchClassInfo = async () => {
        try {
            const response = await axios.get(`${baseURL}/api/group/class/${classId}`)
            console.log('response', response.data)
            setClassInfo(response.data)
        } catch (error) {
            console.error(`Error fetching class info: `, error)
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
                    <h5>O Active class</h5>
                </div>
                <div className="class-info">
                    <div className="students">
                        <h3 className="title">Students</h3>
                        <div class="student-list list-group inside-info">
                            <a href="#" class="list-group-item list-group-item-action">Dapibus ac facilisis in</a>
                            <a href="#" class="list-group-item list-group-item-action">Morbi leo risus</a>
                            <a href="#" class="list-group-item list-group-item-action">Porta ac consectetur ac</a>
                            <a href="#" class="list-group-item list-group-item-action">Dapibus ac facilisis in</a>
                            <a href="#" class="list-group-item list-group-item-action">Morbi leo risus</a>
                            <a href="#" class="list-group-item list-group-item-action">Porta ac consectetur ac</a><a href="#" class="list-group-item list-group-item-action">Dapibus ac facilisis in</a>
                            <a href="#" class="list-group-item list-group-item-action">Morbi leo risus</a>
                            <a href="#" class="list-group-item list-group-item-action">Porta ac consectetur ac</a><a href="#" class="list-group-item list-group-item-action">Dapibus ac facilisis in</a>
                            <a href="#" class="list-group-item list-group-item-action">Morbi leo risus</a>
                            <a href="#" class="list-group-item list-group-item-action">Porta ac consectetur ac</a><a href="#" class="list-group-item list-group-item-action">Dapibus ac facilisis in</a>
                            <a href="#" class="list-group-item list-group-item-action">Morbi leo risus</a>
                            <a href="#" class="list-group-item list-group-item-action">Porta ac consectetur ac</a>
                        </div>
                    </div>
                    <div className="quest-completion title">
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
                                    <tr>
                                        <td className="first-col">Q1</td>
                                        <td className="second-col">97%</td>
                                        <td className="third-col">90%</td>
                                    </tr>
                                    <tr>
                                        <td className="first-col">Q2</td>
                                        <td className="second-col">97%</td>
                                        <td className="third-col">90%</td>
                                    </tr>
                                    <tr>
                                        <td className="first-col">Q3</td>
                                        <td className="second-col">97%</td>
                                        <td className="third-col">90%</td>
                                    </tr>
                                    <tr>
                                        <td className="first-col">Q4</td>
                                        <td className="second-col">97%</td>
                                        <td className="third-col">90%</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className="course-outline title">
                        <h3 className="title">Course Outline</h3>
                        <div className="inside-info">
                            <div id="accordion">
                                <div className="card">
                                    <div className="card-header" id="headingOne">
                                        <h5 className="mb-0">
                                            <button
                                                className={`btn btn-link ${activeIndex === 0 ? '' : 'collapsed'}`}
                                                onClick={() => toggleAccordion(0)}
                                                aria-expanded={activeIndex === 0}
                                                aria-controls="collapseOne"
                                            >
                                                Q1
                                            </button>
                                        </h5>
                                    </div>

                                    <div
                                        id="collapseOne"
                                        className={`collapse ${activeIndex === 0 ? 'show' : ''}`}
                                        aria-labelledby="headingOne"
                                        data-parent="#accordion"
                                    >
                                        <div className="card-body">
                                            Anim pariatur cliche reprehenderit, enim eiusmod high life accusamus terry richardson ad squid...
                                        </div>
                                    </div>
                                </div>

                                <div className="card">
                                    <div className="card-header" id="headingTwo">
                                        <h5 className="mb-0">
                                            <button
                                                className={`btn btn-link ${activeIndex === 1 ? '' : 'collapsed'}`}
                                                onClick={() => toggleAccordion(1)}
                                                aria-expanded={activeIndex === 1}
                                                aria-controls="collapseTwo"
                                            >
                                                Q2
                                            </button>
                                        </h5>
                                    </div>
                                    <div
                                        id="collapseTwo"
                                        className={`collapse ${activeIndex === 1 ? 'show' : ''}`}
                                        aria-labelledby="headingTwo"
                                        data-parent="#accordion"
                                    >
                                        <div className="card-body">
                                            Anim pariatur cliche reprehenderit, enim eiusmod high life accusamus terry richardson ad squid...
                                        </div>
                                    </div>
                                </div>

                                <div className="card">
                                    <div className="card-header" id="headingThree">
                                        <h5 className="mb-0">
                                            <button
                                                className={`btn btn-link ${activeIndex === 2 ? '' : 'collapsed'}`}
                                                onClick={() => toggleAccordion(2)}
                                                aria-expanded={activeIndex === 2}
                                                aria-controls="collapseThree"
                                            >
                                                Q3
                                            </button>
                                        </h5>
                                    </div>
                                    <div
                                        id="collapseThree"
                                        className={`collapse ${activeIndex === 2 ? 'show' : ''}`}
                                        aria-labelledby="headingThree"
                                        data-parent="#accordion"
                                    >
                                        <div className="card-body">
                                            Anim pariatur cliche reprehenderit, enim eiusmod high life accusamus terry richardson ad squid...
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ClassView