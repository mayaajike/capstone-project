import Nav from 'react-bootstrap/Nav';
import "bootstrap/dist/css/bootstrap.min.css";
import '../CSS/NavBar.css';

function NavBar({ handleLogout }) {
  return (
    <div className='nav-bar'>
        <Nav variant="pills" className="justify-content-center">
        <Nav.Item>
            <Nav.Link href="/">Home</Nav.Link>
        </Nav.Item>
        <Nav.Item>
            <Nav.Link href="/history">History</Nav.Link>
        </Nav.Item>
        <Nav.Item>
            <Nav.Link href="/profile">Your Profile</Nav.Link>
        </Nav.Item>
        <Nav.Item>
            <Nav.Link className='log-out' onClick={handleLogout} href="/#">Log Out</Nav.Link>
        </Nav.Item>
        </Nav>
    </div>

  );
}

export default NavBar;
