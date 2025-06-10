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
    const [studentData, setStudentData] = useState([]);
    const [createReposStatus, setCreateReposStatus] = useState('');
    const [organizationGh, setOrganizationGh] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showQuestModal, setShowQuestModal] = useState(false);
    const [showReadmeModal, setShowReadmeModal] = useState(false);
    const [csvFile, setCsvFile] = useState(null);
    const [readmeFile, setReadmeFile] = useState(null);
    const [readmeContent, setReadmeContent] = useState('');
    const [collaborationStatus, setCollaborationStatus] = useState({
        accepted: [],
        pending: [],
        notFound: []
    });

    useEffect(() => {
        if (authUser) {
            console.log("logged in user:", authUser.profName)
            fetchClassInfo();
            fetchOrganizationGh();
        }
    }, [authUser])

    useEffect(() => {
        if (organizationGh) {
            fetchOrganizationRepos();
        }
    }, [organizationGh]);
    
    const toggleAccordion = (index) => {
        setActiveIndex(activeIndex === index ? null : index);
    };
    
    useEffect(() => {
        console.log('studentData:', studentData);
    }, [studentData]);

    //karissa: 

    // i set it up for you here so that all of the students info will be inside 'studentData'! 
    // i set up some fake students for both of the classes under your acc,
    // but if you want more don't forget you can create some at 
    // localhost:3000/studentRegister using the code for your classes!

    // also don't forget you can access different parts of the student by doing stuff like: 
    // student.firstName or student.lastName
    // looking at the console.log of student data will help with structure/names of attributes of the objects 
    // for display of students on this page, 
    // i think it would look best if we displayed both their first and last names
    // if you're not already doing too much and feel like being extra,
    // it would be great to have the students sorted in order of last name! 
    // good luck and reach out whenever you need anything!!!

    const fetchClassInfo = async () => {
        try {
            console.log('Fetching class info for classId:', classId);
            const response = await axios.get(`${baseURL}/api/group/class/${classId}`);
            console.log('Class info response:', response.data);
            setClassInfo(response.data);
            // We're not using the students from the backend anymore
            // setStudentData(response.data.students || []);
        } catch (error) {
            console.error('Error fetching class info:', error.response?.data || error.message);
            console.error('Full error:', error);
        }
    }

    const fetchOrganizationGh = async () => {
        try {
            const response = await axios.get(`${baseURL}/api/repo/prodStatus`);
            setOrganizationGh(response.data.organizationGh);
        } catch (error) {
            console.error('Error fetching organization GitHub name:', error);
            setCreateReposStatus('Error: Could not fetch organization information');
        }
    }

    const fetchOrganizationRepos = async () => {
        try {
            setIsLoading(true);
            // Don't proceed if we don't have the class info yet
            if (!classInfo || !classInfo.groupName) {
                console.log('Waiting for class info to load...');
                return;
            }

            const response = await axios.get(`${baseURL}/api/repo/listRepos`, {
                params: { organizationGh }
            });
            if (response.data.repos) {
                // Format class name to match repository naming convention
                const formattedClassName = classInfo.groupName
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')  // Replace any non-alphanumeric chars with hyphens
                    .replace(/^-+|-+$/g, '');     // Remove leading/trailing hyphens

                // Filter repositories to only show ones for this class
                const classRepos = response.data.repos
                    .filter(repo => repo.name.startsWith(`${formattedClassName}-`))
                    .map(repo => ({ 
                        githubUsername: repo.name.replace(`${formattedClassName}-`, '') // Remove class prefix to get username
                    }));

                setStudentData(classRepos);
                
                // Immediately check collaboration status
                if (classRepos.length > 0) {
                    try {
                        const statusResponse = await axios.post(`${baseURL}/api/repo/collaborationStatus`, {
                            organizationGh,
                            students: classRepos.map(repo => repo.githubUsername),
                            className: classInfo.groupName
                        });
                        if (statusResponse.data.results) {
                            console.log('Initial collaboration status:', statusResponse.data.results);
                            setCollaborationStatus(statusResponse.data.results);
                        }
                    } catch (error) {
                        console.error('Error checking initial collaboration status:', error);
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching organization repositories:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Update useEffect to wait for classInfo
    useEffect(() => {
        if (organizationGh && classInfo && classInfo.groupName) {
            fetchOrganizationRepos();
        }
    }, [organizationGh, classInfo]);

    const handleCsvUpload = (event) => {
        const file = event.target.files[0];
        if (file && file.type === 'text/csv') {
            setCsvFile(file);
        } else {
            alert('Please upload a valid CSV file');
        }
    };

    const handleCreateRepos = async () => {
        if (!csvFile) {
            alert('Please upload a CSV file first');
            return;
        }

        try {
            if (!organizationGh) {
                setCreateReposStatus('Error: Organization information not available');
                return;
            }

            const reader = new FileReader();
            reader.onload = async (e) => {
                const text = e.target.result;
                const lines = text.split('\n');
                // Skip header if it exists and filter out empty lines
                const usernames = lines
                    .slice(lines[0].toLowerCase().includes('github_username') ? 1 : 0)
                    .map(line => line.trim())
                    .filter(line => line.length > 0);

                const response = await axios.post(`${baseURL}/api/repo/createRepos`, {
                    organizationGh: organizationGh,
                    students: usernames,
                    className: classInfo.groupName,
                    groupId: classId
                });
                
                if (response.data.results) {
                    const { successful, unsuccessful } = response.data.results;
                    setCreateReposStatus(
                        `Repository creation completed.\n` +
                        `Successful: ${successful.join(', ')}\n` +
                        `Failed: ${unsuccessful.join(', ')}`
                    );
                    // Refresh the repository list after creation
                    fetchOrganizationRepos();
                    // Close the modal
                    setShowModal(false);
                    setCsvFile(null);
                } else {
                    setCreateReposStatus(response.data.message || 'Repositories created successfully');
                }
            };
            reader.readAsText(csvFile);
        } catch (error) {
            console.error('Error creating repos:', error);
            if (error.response?.data?.message) {
                setCreateReposStatus(`Error: ${error.response.data.message}`);
            } else {
                setCreateReposStatus('Error creating repositories. Please try again.');
            }
        }
    };

    const checkCollaborationStatus = async () => {
        try {
            if (!organizationGh || studentData.length === 0 || !classInfo?.groupName) {
                return;
            }

            const response = await axios.post(`${baseURL}/api/repo/collaborationStatus`, {
                organizationGh,
                students: studentData.map(repo => repo.githubUsername),
                className: classInfo.groupName
            });

            if (response.data.results) {
                console.log('Collaboration status:', response.data.results);
                setCollaborationStatus(response.data.results);
            }
        } catch (error) {
            console.error('Error checking collaboration status:', error);
        }
    };

    // Remove the separate useEffect for initial status check since we're doing it in fetchOrganizationRepos
    useEffect(() => {
        if (organizationGh) {
            const interval = setInterval(checkCollaborationStatus, 30000);
            return () => clearInterval(interval);
        }
    }, [organizationGh]);

    return (
        <div>
            <HomeHeader className="header" />
            <div className="class-container">
                {!classInfo || !classInfo.groupName ? (
                    <div className="text-center p-4">
                        <p>Loading class information...</p>
                    </div>
                ) : (
                    <>
                <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '2.5rem', fontWeight: 'bold' }}>{classInfo.groupName}</h1>
                <h2>Class Code: {classInfo.classCode}</h2>
                <div className="above-class-info">
                    <h5>Export Grades</h5>
                    <h5>O Active class</h5>
                </div>
                <div className="class-info">
                            {/* Modal Dialog */}
                            {showModal && (
                                <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                                    <div className="modal-dialog modal-dialog-centered">
                                        <div className="modal-content">
                                            <div className="modal-header">
                                                <h4 className="modal-title">Upload GitHub Usernames</h4>
                                                <button 
                                                    type="button" 
                                                    className="close" 
                                                    onClick={() => {
                                                        setShowModal(false);
                                                        setCsvFile(null);
                                                    }}
                                                >
                                                    <span>&times;</span>
                                                </button>
                                            </div>
                                            <div className="modal-body">
                                                <p>This method will:</p>
                                                <ul>
                                                    <li>Create student accounts for each GitHub username</li>
                                                    <li>Create private repositories for each student</li>
                                                    <li>Send invitation emails to join the class</li>
                                                </ul>
                                                <p>Upload a CSV file containing GitHub usernames (one per line)</p>
                                                <ul>
                                                    <li>File must be in .csv format</li>
                                                    <li>One GitHub username per line</li>
                                                    <li>First line can optionally be a header</li>
                                                    <li>Usernames must match existing GitHub accounts</li>
                                                </ul>
                                                <button 
                                                    className="btn btn-outline-primary mb-3"
                                                    onClick={() => {
                                                        const csvContent = "github_username\njohndoe\njanesmith";
                                                        const blob = new Blob([csvContent], { type: 'text/csv' });
                                                        const url = window.URL.createObjectURL(blob);
                                                        const a = document.createElement('a');
                                                        a.href = url;
                                                        a.download = 'github_usernames_template.csv';
                                                        document.body.appendChild(a);
                                                        a.click();
                                                        document.body.removeChild(a);
                                                        window.URL.revokeObjectURL(url);
                                                    }}
                                                >
                                                    Download Template
                                                </button>
                                                <div className="custom-file">
                                                    <input 
                                                        type="file" 
                                                        className="custom-file-input" 
                                                        id="csvFile"
                                                        accept=".csv" 
                                                        onChange={handleCsvUpload}
                                                    />
                                                    <label className="custom-file-label" htmlFor="csvFile">
                                                        {csvFile ? csvFile.name : 'Choose CSV file...'}
                                                    </label>
                                                </div>
                                            </div>
                                            <div className="modal-footer">
                                                <button 
                                                    type="button" 
                                                    className="btn btn-secondary" 
                                                    onClick={() => {
                                                        setShowModal(false);
                                                        setCsvFile(null);
                                                    }}
                                                >
                                                    Cancel
                                                </button>
                                                <button 
                                                    type="button" 
                                                    className="btn btn-primary" 
                                                    onClick={handleCreateRepos}
                                                    disabled={!csvFile}
                                                >
                                                    Create Repositories
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                    <div className="students">
                        <h3 className="title">Students</h3>
                                <div className="student-list list-group inside-info">
                                    {isLoading ? (
                                        <div className="text-center p-4">
                                            <p className="mb-0">Loading repositories...</p>
                                        </div>
                                    ) : studentData.length === 0 ? (
                                        <div className="text-center p-4">
                                            <p className="mb-0">No student repositories found. Click "Add Students" to create repositories.</p>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Accepted Repositories */}
                                            {studentData.some(repo => collaborationStatus.accepted.includes(repo.githubUsername)) && (
                                                <>
                                                    <div className="status-header list-group-item bg-success text-white">
                                                        <h5 className="mb-0">✓ Accepted Repositories</h5>
                                                    </div>
                                                    {studentData
                                                        .filter(repo => collaborationStatus.accepted.includes(repo.githubUsername))
                                                        .map((repo, index) => (
                                                            <div 
                                                                key={`accepted-${index}`}
                                                                className="list-group-item list-group-item-action d-flex justify-content-between align-items-center list-group-item-success"
                                                            >
                                                                <div>{repo.githubUsername}</div>
                                                                <span className="badge badge-pill">✓ Repository Created</span>
                                                            </div>
                                                        ))}
                                                </>
                                            )}

                                            {/* Pending Repositories */}
                                            {studentData.some(repo => collaborationStatus.pending.includes(repo.githubUsername)) && (
                                                <>
                                                    <div className="status-header list-group-item bg-warning text-dark mt-3">
                                                        <h5 className="mb-0">⏳ Pending Repositories</h5>
                                                    </div>
                                                    {studentData
                                                        .filter(repo => collaborationStatus.pending.includes(repo.githubUsername))
                                                        .map((repo, index) => (
                                                            <div 
                                                                key={`pending-${index}`}
                                                                className="list-group-item list-group-item-action d-flex justify-content-between align-items-center list-group-item-warning"
                                                            >
                                                                <div>{repo.githubUsername}</div>
                                                                <span className="badge badge-pill">⏳ Repository Pending</span>
                                                            </div>
                                                        ))}
                                                </>
                                            )}

                                            {/* Not Found Repositories */}
                                            {studentData.some(repo => !collaborationStatus.accepted.includes(repo.githubUsername) && 
                                                                     !collaborationStatus.pending.includes(repo.githubUsername)) && (
                                                <>
                                                    <div className="status-header list-group-item bg-danger text-white mt-3">
                                                        <h5 className="mb-0">✗ Not Found Repositories</h5>
                                                    </div>
                                                    {studentData
                                                        .filter(repo => !collaborationStatus.accepted.includes(repo.githubUsername) && 
                                                                      !collaborationStatus.pending.includes(repo.githubUsername))
                                                        .map((repo, index) => (
                                                            <div 
                                                                key={`not-found-${index}`}
                                                                className="list-group-item list-group-item-action d-flex justify-content-between align-items-center list-group-item-danger"
                                                            >
                                                                <div>{repo.githubUsername}</div>
                                                                <span className="badge badge-pill">✗ Repository Not Found</span>
                                                            </div>
                                                        ))}
                                                </>
                                            )}
                                        </>
                                    )}
                                </div>
                                <div className="mt-3 text-center">
                                    <button 
                                        className="btn" 
                                        onClick={() => setShowModal(true)}
                                        style={{
                                            backgroundColor: '#fb5233',
                                            color: 'white',
                                            fontWeight: 'bold',
                                            border: 'none',
                                            borderBottomLeftRadius: '8px',
                                            borderBottomRightRadius: '8px',
                                            borderTopLeftRadius: '0',
                                            borderTopRightRadius: '0'
                                        }}
                                    >
                                        Add Students
                                    </button>
                                    {createReposStatus && (
                                        <div className="alert alert-info mt-2 mb-0">
                                            {createReposStatus}
                                        </div>
                                    )}
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
                                    <div className="accordion" id="accordion">
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
                                <div className="mt-3 text-center">
                                    <button 
                                        className="btn" 
                                        onClick={() => setShowReadmeModal(true)}
                                        style={{
                                            backgroundColor: '#fb5233',
                                            color: 'white',
                                            fontWeight: 'bold',
                                            border: 'none',
                                            borderBottomLeftRadius: '8px',
                                            borderBottomRightRadius: '8px',
                                            borderTopLeftRadius: '0',
                                            borderTopRightRadius: '0',
                                            marginRight: '10px'
                                        }}
                                    >
                                        Add README Instructions
                                    </button>
                                    <button 
                                        className="btn" 
                                        onClick={() => setShowQuestModal(true)}
                                        style={{
                                            backgroundColor: '#fb5233',
                                            color: 'white',
                                            fontWeight: 'bold',
                                            border: 'none',
                                            borderBottomLeftRadius: '8px',
                                            borderBottomRightRadius: '8px',
                                            borderTopLeftRadius: '0',
                                            borderTopRightRadius: '0'
                                        }}
                                    >
                                        Create Quest
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Quest Creation Modal */}
            {showQuestModal && (
                <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h4 className="modal-title">Create New Quest</h4>
                                <button 
                                    type="button" 
                                    className="close" 
                                    onClick={() => setShowQuestModal(false)}
                                >
                                    <span>&times;</span>
                                </button>
                            </div>
                            <div className="modal-body">
                                <p>Create a new quest for your students:</p>
                                <form>
                                    <div className="form-group mb-3">
                                        <label htmlFor="questTitle">Quest Title</label>
                                        <input 
                                            type="text" 
                                            className="form-control" 
                                            id="questTitle" 
                                            placeholder="Enter quest title"
                                        />
                                    </div>
                                    <div className="form-group mb-3">
                                        <label htmlFor="questDescription">Quest Description</label>
                                        <textarea 
                                            className="form-control" 
                                            id="questDescription" 
                                            rows="4" 
                                            placeholder="Enter quest description and requirements"
                                        ></textarea>
                                    </div>
                                    <div className="form-group mb-3">
                                        <label htmlFor="questDueDate">Due Date</label>
                                        <input 
                                            type="date" 
                                            className="form-control" 
                                            id="questDueDate"
                                        />
                                    </div>
                                </form>
                            </div>
                            <div className="modal-footer">
                                <button 
                                    type="button" 
                                    className="btn btn-secondary" 
                                    onClick={() => setShowQuestModal(false)}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="button" 
                                    className="btn" 
                                    style={{
                                        backgroundColor: '#fb5233',
                                        color: 'white',
                                        fontWeight: 'bold',
                                        border: 'none'
                                    }}
                                >
                                    Create Quest
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* README Instructions Modal */}
            {showReadmeModal && (
                <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h4 className="modal-title">README Instructions Setup</h4>
                                <button 
                                    type="button" 
                                    className="close" 
                                    onClick={() => setShowReadmeModal(false)}
                                >
                                    <span>&times;</span>
                                </button>
                            </div>
                            <div className="modal-body">
                                <div className="alert alert-info">
                                    <h5>📋 First Step: README Instructions</h5>
                                    <p>Upload a README file that will be added to each student's repository. This README will contain course information, objectives, and instructions for students.</p>
                                </div>
                                
                                <div className="mb-4">
                                    <h5>📁 Upload README File</h5>
                                    <p>Upload a markdown (.md) file that will serve as the README for all student repositories:</p>
                                    
                                    <div className="custom-file mb-3">
                                        <input 
                                            type="file" 
                                            className="custom-file-input" 
                                            id="readmeFile"
                                            accept=".md,.markdown,text/markdown" 
                                            onChange={(event) => {
                                                const file = event.target.files[0];
                                                if (file) {
                                                    setReadmeFile(file);
                                                    const reader = new FileReader();
                                                    reader.onload = (e) => {
                                                        setReadmeContent(e.target.result);
                                                    };
                                                    reader.readAsText(file);
                                                }
                                            }}
                                        />
                                        <label className="custom-file-label" htmlFor="readmeFile">
                                            {readmeFile ? readmeFile.name : 'Choose README file (.md)...'}
                                        </label>
                                    </div>
                                    
                                    {readmeContent && (
                                        <div className="alert alert-success">
                                            <strong>✓ File loaded successfully!</strong>
                                            <p className="mb-0">This README will be added to all new student repositories.</p>
                                        </div>
                                    )}
                                </div>

                                <div className="mb-4">
                                    <h5 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>📝 README Preview</h5>
                                    {readmeContent ? (
                                        <div className="border p-3 bg-light" style={{ fontFamily: 'monospace', fontSize: '14px', maxHeight: '300px', overflowY: 'auto' }}>
                                            <pre>{readmeContent}</pre>
                                        </div>
                                    ) : (
                                        <div className="border p-3 bg-light text-muted">
                                            <p className="mb-0">Upload a README file to see a preview here.</p>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="mb-4">
                                    <h5>📥 Download Template (Optional)</h5>
                                    <p>Don't have a README file? Download this template as a starting point:</p>
                                    
                                    <button 
                                        className="btn btn-outline-primary"
                                        onClick={() => {
                                            const template = `# 🎓 ${classInfo.groupName} - OSS Management Course

## 📚 Course Overview
Welcome to the Open Source Software (OSS) Management course! This repository will track your progress through various quests and challenges designed to teach you about contributing to open source projects.

## 🎯 Learning Objectives
- Understand the OSS contribution workflow
- Learn to work with Git and GitHub
- Practice creating pull requests and issues
- Develop collaboration skills in open source projects

## 📊 Your Progress
Your current progress will be displayed here as you complete quests.

### 🚀 Current Quest
{Current quest information will appear here}

### ✅ Completed Quests
{Completed quests will be listed here}

## 📋 Available Quests
{Quest list will be populated here}

## 🛠️ Getting Started
1. Accept the invitation to this repository
2. Check the issues tab for your first quest
3. Follow the instructions in each quest
4. Submit your answers as comments on the issues

## 📞 Need Help?
- Check the quest instructions carefully
- Use hints if available (they may cost XP)
- Ask questions in the issue comments

---
*This README is automatically updated as you progress through the course.*`;
                                            const blob = new Blob([template], { type: 'text/markdown' });
                                            const url = window.URL.createObjectURL(blob);
                                            const a = document.createElement('a');
                                            a.href = url;
                                            a.download = `${classInfo.groupName}-README-template.md`;
                                            document.body.appendChild(a);
                                            a.click();
                                            document.body.removeChild(a);
                                            window.URL.revokeObjectURL(url);
                                        }}
                                    >
                                        📥 Download Template
                                    </button>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button 
                                    type="button" 
                                    className="btn btn-secondary" 
                                    onClick={() => {
                                        setShowReadmeModal(false);
                                        setReadmeFile(null);
                                        setReadmeContent('');
                                    }}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="button" 
                                    className="btn" 
                                    onClick={async () => {
                                        if (!readmeContent) {
                                            alert('Please upload a README file first.');
                                            return;
                                        }
                                        
                                        try {
                                            const response = await axios.post(`${baseURL}/api/group/${classId}/readme`, {
                                                content: readmeContent,
                                                fileName: readmeFile ? readmeFile.name : 'README.md'
                                            });
                                            
                                            if (response.status === 200) {
                                                alert('README file saved successfully! It will be added to all new student repositories.');
                                                setShowReadmeModal(false);
                                                setReadmeFile(null);
                                                setReadmeContent('');
                                            }
                                        } catch (error) {
                                            console.error('Error saving README:', error);
                                            alert('Error saving README file. Please try again.');
                                        }
                                    }}
                                    style={{
                                        backgroundColor: '#fb5233',
                                        color: 'white',
                                        fontWeight: 'bold',
                                        border: 'none'
                                    }}
                                    disabled={!readmeContent}
                                >
                                    Save README
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClassView;