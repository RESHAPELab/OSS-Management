import React from "react";
import "./PasswordResetSuccess.css"

const PasswordResetSuccess = () => {

    function handleClick () { 
        window.location.href="/"
    }

    return (
        <div className="container active sign-up-container" id="container">
            <h1 className="congrats">Congratulations!</h1>
            <h5 className="registered">You have successfully reset your password.</h5>
            <a className="reset-login" onClick={() => handleClick()} target="_blank" rel="noopener noreferrer">
                Log in </a>
        </div>
    )
}

export default PasswordResetSuccess