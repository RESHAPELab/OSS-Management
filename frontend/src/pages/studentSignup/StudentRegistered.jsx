
import React, { useState } from "react";
import './StudentRegistered.css'
import { useParams } from 'react-router-dom'


const StudentRegistered = () => {
    const { repoName } = useParams();
    const githubUrl = `https://github.com/OSS-Doorway-Development/${repoName}`;

    return (
        <div className="container active sign-up-container" id="container">
            <h1 className="congrats">Congratulations!</h1>
            <h5 className="registered">You have successfully registered for your class</h5>
            <h5 className="registered second">View your repo here:</h5>
            <a className="github-link"href={githubUrl} target="_blank" rel="noopener noreferrer">
                {githubUrl} </a>
        </div>
    )

}


export default StudentRegistered;
