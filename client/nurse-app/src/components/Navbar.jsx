import { Link, useNavigate } from 'react-router-dom';
import { Navbar as BsNavbar, Nav, Container, Button } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

const Navbar = ({ authenticated }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    // Redirect to login page in shell app
    window.location.href = '/login';
  };

  return (
    <BsNavbar bg="primary" variant="dark" expand="lg">
      <Container>
        <BsNavbar.Brand as={Link} to="/">MediMonitor - Nurse Portal</BsNavbar.Brand>
        <BsNavbar.Toggle aria-controls="basic-navbar-nav" />
        <BsNavbar.Collapse id="basic-navbar-nav">
          {authenticated && (
            <Nav className="me-auto">
              <Nav.Link as={Link} to="/">Dashboard</Nav.Link>
              <Nav.Link as={Link} to="/patients">My Patients</Nav.Link>
            </Nav>
          )}
          <Nav className="ms-auto">
            {authenticated ? (
              <Button variant="outline-light" onClick={handleLogout}>Logout</Button>
            ) : (
              <Button variant="outline-light" onClick={() => navigate('/login')}>Login</Button>
            )}
          </Nav>
        </BsNavbar.Collapse>
      </Container>
    </BsNavbar>
  );
};

export default Navbar; 