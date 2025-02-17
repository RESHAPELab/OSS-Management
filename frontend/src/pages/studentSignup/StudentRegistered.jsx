
import React, { useState } from "react";
import './StudentRegistered.css'
import { useParams } from 'react-router-dom'


const StudentRegistered = () => {
    const { repoName } = useParams();
    const githubUrl = `https://github.com/OSS-Doorway-Development/${repoName}`;

    const navigateToRepo = () => {
        window.location.href = githubUrl;
    }

    return (
        <div className="container active sign-up-container" id="container">
            <div className="panel-container">
                <div className="panel">
                    <div className="student-panel panel-right">
                        <h5 className="registered second">View your repo here:</h5>
                        <button className="hidden-signup" onClick={() => navigateToRepo()}>
                            Student Repo
                        </button>
                    </div>
                </div>
            </div>
            <div className="student-registered">
                <h1 className="congrats">Success!</h1>
                <h5 className="registered">You have been registered for your class</h5>
            </div>
        </div>
    )

}


export default StudentRegistered;
