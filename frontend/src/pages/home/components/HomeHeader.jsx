import "bootstrap/dist/css/bootstrap.min.css"
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import Image from 'react-bootstrap/Image'
import reshapeLogo from '../../../images/reshape.png'
import "./HomeHeader.css"

const handleLogout = () => {
    sessionStorage.clear(); 
    window.location.href="/login"
}


const HomeHeader = () => {
    return (
        <Navbar expand="lg" className="bg-body-tertiary">
            <Navbar.Brand href="/"><Image src={reshapeLogo}/></Navbar.Brand>
                <Nav className="me-auto">
                    <Nav.Link onClick={handleLogout}>Logout</Nav.Link>
                </Nav>
        </Navbar>
    )
}

export default HomeHeader;



