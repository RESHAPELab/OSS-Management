import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";

const Navbar = () => {
    return (
        <div className="d-flex">
            {/* Sidebar */}
            <div className="bg-dark text-white p-3" style={{ width: "250px", height: "100vh" }}>
                <h2 className="text-center">My App</h2>
                <ul className="nav flex-column">
                    <li className="nav-item">
                        <a className="nav-link text-white" href="#home">Home</a>
                    </li>
                    <li className="nav-item">
                        <a className="nav-link text-white" href="#about">About</a>
                    </li>
                    <li className="nav-item">
                        <a className="nav-link text-white" href="#services">Services</a>
                    </li>
                    <li className="nav-item">
                        <a className="nav-link text-white" href="#contact">Contact</a>
                    </li>
                </ul>
            </div>

            {/* Main Content */}
            <div className="container-fluid p-3">
                <div id="home">
                    <h3>Home Section</h3>
                    <p>Content for the home section...</p>
                </div>

                <div id="about">
                    <h3>About Section</h3>
                    <p>Content for the about section...</p>
                </div>

                <div id="services">
                    <h3>Services Section</h3>
                    <p>Content for the services section...</p>
                </div>

                <div id="contact">
                    <h3>Contact Section</h3>
                    <p>Content for the contact section...</p>
                </div>
            </div>
        </div>
    );
};

export default Navbar;
