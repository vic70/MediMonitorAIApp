import { useState } from 'react';
import { useMutation, gql } from '@apollo/client';
import { Container, Row, Col, Form, Button, Card, Alert, Tabs, Tab } from 'react-bootstrap';

const SIGNUP_MUTATION = gql`
  mutation Signup($userName: String!, $email: String!, $password: String!, $role: String!) {
    signup(userName: $userName, email: $email, password: $password, role: $role) {
      id
      userName
      email
      role
    }
  }
`;

const LOGIN_MUTATION = gql`
  mutation Login($userName: String!, $password: String!) {
    login(userName: $userName, password: $password) {
      token
      user {
        id
        userName
        email
        role
      }
    }
  }
`;

const UserComponent = () => {
  const [activeTab, setActiveTab] = useState('login');
  const [loginForm, setLoginForm] = useState({ userName: '', password: '' });
  const [signupForm, setSignupForm] = useState({ userName: '', email: '', password: '', confirmPassword: '', role: 'PATIENT' });
  const [loginError, setLoginError] = useState('');
  const [signupError, setSignupError] = useState('');
  const [signupSuccess, setSignupSuccess] = useState('');

  const [login, { loading: loginLoading }] = useMutation(LOGIN_MUTATION, {
    onCompleted: (data) => {
      if (data.login && data.login.token) {
        // Store token in localStorage
        localStorage.setItem('authToken', data.login.token);
        localStorage.setItem('user', JSON.stringify(data.login.user));
        
        // Dispatch custom event for successful login
        window.dispatchEvent(new CustomEvent('loginSuccess', { 
          detail: { 
            isLoggedIn: true,
            user: data.login.user
          } 
        }));
      } else {
        setLoginError('Login failed. Please check your credentials.');
      }
    },
    onError: (error) => {
      setLoginError(error.message);
    }
  });

  const [signup, { loading: signupLoading }] = useMutation(SIGNUP_MUTATION, {
    onCompleted: () => {
      setSignupSuccess('Account created successfully! Please login.');
      setSignupForm({ userName: '', email: '', password: '', confirmPassword: '', role: 'PATIENT' });
      setActiveTab('login');
    },
    onError: (error) => {
      setSignupError(error.message);
    }
  });

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setLoginError('');
    login({ variables: { userName: loginForm.userName, password: loginForm.password } });
  };

  const handleSignupSubmit = (e) => {
    e.preventDefault();
    setSignupError('');
    setSignupSuccess('');

    if (signupForm.password !== signupForm.confirmPassword) {
      setSignupError('Passwords do not match');
      return;
    }

    signup({
      variables: {
        userName: signupForm.userName,
        email: signupForm.email,
        password: signupForm.password,
        role: signupForm.role
      }
    });
  };

  return (
    <Container className="mt-5">
      <Row className="justify-content-center">
        <Col md={6}>
          <Card>
            <Card.Header className="text-center bg-primary text-white">
              <h2>Authentication</h2>
            </Card.Header>
            <Card.Body>
              <Tabs
                activeKey={activeTab}
                onSelect={(key) => setActiveTab(key)}
                className="mb-3"
              >
                <Tab eventKey="login" title="Login">
                  {loginError && <Alert variant="danger">{loginError}</Alert>}
                  {signupSuccess && <Alert variant="success">{signupSuccess}</Alert>}
                  <Form onSubmit={handleLoginSubmit}>
                    <Form.Group className="mb-3">
                      <Form.Label>Username</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Enter username"
                        value={loginForm.userName}
                        onChange={(e) => setLoginForm({ ...loginForm, userName: e.target.value })}
                        required
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Password</Form.Label>
                      <Form.Control
                        type="password"
                        placeholder="Password"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                        required
                      />
                    </Form.Group>

                    <div className="d-grid gap-2">
                      <Button variant="primary" type="submit" disabled={loginLoading}>
                        {loginLoading ? 'Logging in...' : 'Login'}
                      </Button>
                    </div>
                  </Form>
                </Tab>
                <Tab eventKey="signup" title="Sign Up">
                  {signupError && <Alert variant="danger">{signupError}</Alert>}
                  <Form onSubmit={handleSignupSubmit}>
                    <Form.Group className="mb-3">
                      <Form.Label>Username</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Choose a username"
                        value={signupForm.userName}
                        onChange={(e) => setSignupForm({ ...signupForm, userName: e.target.value })}
                        required
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Email</Form.Label>
                      <Form.Control
                        type="email"
                        placeholder="Enter email"
                        value={signupForm.email}
                        onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                        required
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Password</Form.Label>
                      <Form.Control
                        type="password"
                        placeholder="Password"
                        value={signupForm.password}
                        onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                        required
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Confirm Password</Form.Label>
                      <Form.Control
                        type="password"
                        placeholder="Confirm Password"
                        value={signupForm.confirmPassword}
                        onChange={(e) => setSignupForm({ ...signupForm, confirmPassword: e.target.value })}
                        required
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Role</Form.Label>
                      <Form.Select
                        value={signupForm.role}
                        onChange={(e) => setSignupForm({ ...signupForm, role: e.target.value })}
                      >
                        <option value='PATIENT'>Patient</option>
                        <option value='NURSE'>Nurse</option>
                      </Form.Select>
                    </Form.Group>

                    <div className="d-grid gap-2">
                      <Button variant="primary" type="submit" disabled={signupLoading}>
                        {signupLoading ? 'Creating Account...' : 'Sign Up'}
                      </Button>
                    </div>
                  </Form>
                </Tab>
              </Tabs>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default UserComponent; 