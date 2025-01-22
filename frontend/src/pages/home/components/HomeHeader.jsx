import "bootstrap/dist/css/bootstrap.min.css"
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import Image from 'react-bootstrap/Image'
import reshapeLogo from '../../../images/reshape.png'
import "./HomeHeader.css"



const HomeHeader = () => {
    return (
        <Navbar expand="lg" className="bg-body-tertiary">
            <Navbar.Brand href="/"><Image src={reshapeLogo}/></Navbar.Brand>
                <Nav className="me-auto">
                    <Nav.Link href="/">Classes</Nav.Link>
                    <Nav.Link href="/learningPaths">Learning Paths</Nav.Link>
                </Nav>
        </Navbar>
    )
}

export default HomeHeader;



