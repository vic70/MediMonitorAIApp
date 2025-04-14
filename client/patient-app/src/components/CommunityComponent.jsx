import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';

// Import components
import PostList from './posts/PostList';
import PostDetail from './posts/PostDetail';
import CreatePost from './posts/CreatePost';
import EditPost from './posts/EditPost';
import HelpRequestList from './help-requests/HelpRequestList';
import HelpRequestDetail from './help-requests/HelpRequestDetail';
import CreateHelpRequest from './help-requests/CreateHelpRequest';
import EditHelpRequest from './help-requests/EditHelpRequest';

const CommunityComponent = () => {
  // Use real user data from localStorage instead of mock data
  const [user, setUser] = useState(null);

  // Load user data from localStorage on component mount
  useEffect(() => {
    const userString = localStorage.getItem('user');
    if (userString) {
      try {
        const userData = JSON.parse(userString);
        setUser(userData);
      } catch (error) {
        console.error('Error parsing user data from localStorage:', error);
      }
    }
  }, []);

  const handleLogout = () => {
    // Dispatch logout event handled by shell app
    window.dispatchEvent(new Event('logout'));
  };

  return (
    <Router>
      <Navbar bg="dark" variant="dark" expand="lg" className="mb-4">
        <Container>
          <Navbar.Brand as={Link} to="/">Community Platform</Navbar.Brand>
          <Navbar.Toggle aria-controls="community-navbar" />
          <Navbar.Collapse id="community-navbar">
            <Nav className="me-auto">
              <Nav.Link as={Link} to="/posts">Posts</Nav.Link>
              <Nav.Link as={Link} to="/help-requests">Help Requests</Nav.Link>
            </Nav>
            <Nav>
              <span className="text-light me-3">
                Logged in as: {user?.userName} ({user?.role})
              </span>
              <Button variant="outline-light" size="sm" onClick={handleLogout}>
                Logout
              </Button>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container className="px-4 py-3">
        <Routes>
          <Route path="/" element={<Navigate to="/posts" />} />
          
          {/* Post Routes */}
          <Route path="/posts" element={<PostList />} />
          <Route path="/posts/:id" element={<PostDetail />} />
          <Route path="/posts/create" element={<CreatePost />} />
          <Route path="/posts/edit/:id" element={<EditPost />} />
          
          {/* Help Request Routes */}
          <Route path="/help-requests" element={<HelpRequestList />} />
          <Route path="/help-requests/:id" element={<HelpRequestDetail />} />
          <Route path="/help-requests/create" element={<CreateHelpRequest />} />
          <Route path="/help-requests/edit/:id" element={<EditHelpRequest />} />
        </Routes>
      </Container>
    </Router>
  );
};

export default CommunityComponent;
