import React from "react";
import "./PasswordResetSuccess.css"

const PasswordResetSuccess = () => {

    function handleClick () { 
        window.location.href="/"
    }

    return (
        <div className="container active sign-up-container" id="container">
            <div className="panel-container">
                <div className="panel">
                    <div className="student-panel panel-right">
                        <h5 className="registered second">Navigate to login page:</h5>
                        <button className="hidden-signup" onClick={() => handleClick()}>
                            Login
                        </button>
                    </div>
                </div>
            </div>
            <div className="password-reset-success">
            <h1 className="congrats">Success!</h1>
            <h5 className="registered">Your password has been reset</h5>
            </div>
        </div>
    )
}

export default PasswordResetSuccess