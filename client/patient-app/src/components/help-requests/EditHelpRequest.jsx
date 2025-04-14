import { useState, useEffect } from 'react';
import { useMutation, useQuery, gql } from '@apollo/client';
import { Form, Button, Card, Alert, Spinner, ListGroup } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';

const GET_HELP_REQUEST = gql`
  query GetHelpRequest($id: ID!) {
    helpRequest(id: $id) {
      id
      description
      location
      isResolved
      author {
        id
        userName
      }
      volunteers {
        id
        userName
      }
    }
  }
`;

const GET_USERS = gql`
  query GetUsers {
    users {
      id
      userName
      role
    }
  }
`;

const UPDATE_HELP_REQUEST = gql`
  mutation UpdateHelpRequest($id: ID!, $description: String!, $location: String) {
    updateHelpRequest(id: $id, description: $description, location: $location) {
      id
      description
      location
    }
  }
`;

const ADD_VOLUNTEER = gql`
  mutation AddVolunteer($id: ID!, $volunteerId: ID!) {
    addVolunteerToHelpRequest(id: $id, volunteerId: $volunteerId) {
      id
      volunteers {
        id
        userName
      }
    }
  }
`;

const EditHelpRequest = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    // Get user from localStorage
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
  
  const [formData, setFormData] = useState({
    description: '',
    location: ''
  });
  const [validated, setValidated] = useState(false);
  const [selectedVolunteer, setSelectedVolunteer] = useState('');
  
  const { loading: requestLoading, error: requestError, data: requestData, refetch } = useQuery(GET_HELP_REQUEST, {
    variables: { id },
    onCompleted: (data) => {
      setFormData({
        description: data.helpRequest.description,
        location: data.helpRequest.location || ''
      });
    }
  });
  
  const { loading: usersLoading, error: usersError, data: usersData } = useQuery(GET_USERS);
  
  const [updateHelpRequest, { loading: updateLoading, error: updateError }] = useMutation(UPDATE_HELP_REQUEST, {
    onCompleted: () => {
      refetch();
    }
  });
  
  const [addVolunteer, { loading: volunteerLoading, error: volunteerError }] = useMutation(ADD_VOLUNTEER, {
    onCompleted: () => {
      setSelectedVolunteer('');
      refetch();
    }
  });
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    
    if (form.checkValidity() === false) {
      e.stopPropagation();
      setValidated(true);
      return;
    }
    
    updateHelpRequest({
      variables: {
        id,
        description: formData.description,
        location: formData.location || null
      }
    });
  };
  
  const handleAddVolunteer = () => {
    if (selectedVolunteer) {
      addVolunteer({
        variables: {
          id,
          volunteerId: selectedVolunteer
        }
      });
    }
  };
  
  if (requestLoading) return (
    <div className="text-center my-5">
      <Spinner animation="border" role="status">
        <span className="visually-hidden">Loading...</span>
      </Spinner>
    </div>
  );
  
  if (requestError) return (
    <Alert variant="danger">
      Error loading help request: {requestError.message}
    </Alert>
  );
  
  const helpRequest = requestData.helpRequest;
  
  // Check if the user is authorized to edit
  const isAuthor = user?.id === helpRequest.author.id;
  const isCommunityOrganizer = user?.role === 'community_organizer';
  
  if (!isAuthor && !isCommunityOrganizer) {
    return (
      <Alert variant="danger">
        You are not authorized to edit this help request.
      </Alert>
    );
  }
  
  // If the help request is already resolved, prevent editing
  if (helpRequest.isResolved) {
    return (
      <Alert variant="warning">
        This help request has been resolved and cannot be edited.
        <div className="mt-3">
          <Button variant="primary" onClick={() => navigate(`/help-requests/${id}`)}>
            View Help Request Details
          </Button>
        </div>
      </Alert>
    );
  }
  
  // Filter out users who are already volunteers
  const existingVolunteerIds = helpRequest.volunteers.map(v => v.id);
  const availableVolunteers = usersData?.users.filter(u => !existingVolunteerIds.includes(u.id)) || [];
  
  return (
    <div>
      <h2 className="mb-4">Edit Help Request</h2>
      
      <Card className="shadow mb-4">
        <Card.Body>
          {updateError && (
            <Alert variant="danger">
              Error updating help request: {updateError.message}
            </Alert>
          )}
          
          <Form noValidate validated={validated} onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="requestDescription">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                minLength={10}
                maxLength={500}
                placeholder="Describe what kind of help you need..."
              />
              <Form.Control.Feedback type="invalid">
                Please provide a description (10-500 characters).
              </Form.Control.Feedback>
            </Form.Group>
            
            <Form.Group className="mb-3" controlId="requestLocation">
              <Form.Label>Location (Optional)</Form.Label>
              <Form.Control
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Enter the location where help is needed"
              />
            </Form.Group>
            
            <div className="d-flex justify-content-between">
              <Button variant="secondary" onClick={() => navigate(`/help-requests/${id}`)}>
                Cancel
              </Button>
              <Button variant="success" type="submit" disabled={updateLoading}>
                {updateLoading ? 'Saving Changes...' : 'Save Changes'}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
      
      {/* Volunteer Management (Only for Community Organizers) */}
      {isCommunityOrganizer && (
        <Card className="shadow">
          <Card.Header>
            <h5 className="mb-0">Manage Volunteers</h5>
          </Card.Header>
          <Card.Body>
            {volunteerError && (
              <Alert variant="danger">
                Error adding volunteer: {volunteerError.message}
              </Alert>
            )}
            
            <h6>Current Volunteers:</h6>
            {helpRequest.volunteers.length === 0 ? (
              <Alert variant="info" className="mb-3">No volunteers assigned yet.</Alert>
            ) : (
              <ListGroup className="mb-3">
                {helpRequest.volunteers.map(volunteer => (
                  <ListGroup.Item key={volunteer.id}>
                    {volunteer.userName}
                  </ListGroup.Item>
                ))}
              </ListGroup>
            )}
            
            <div className="mt-4">
              <h6>Add Volunteer:</h6>
              {usersLoading ? (
                <Spinner animation="border" size="sm" />
              ) : usersError ? (
                <Alert variant="danger">Error loading users: {usersError.message}</Alert>
              ) : availableVolunteers.length === 0 ? (
                <Alert variant="info">No more users available to add as volunteers.</Alert>
              ) : (
                <div className="d-flex">
                  <Form.Select 
                    value={selectedVolunteer}
                    onChange={(e) => setSelectedVolunteer(e.target.value)}
                    className="me-2"
                    disabled={volunteerLoading}
                  >
                    <option value="">Select a volunteer...</option>
                    {availableVolunteers.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.userName} ({user.role})
                      </option>
                    ))}
                  </Form.Select>
                  <Button 
                    variant="primary" 
                    disabled={!selectedVolunteer || volunteerLoading}
                    onClick={handleAddVolunteer}
                  >
                    {volunteerLoading ? 'Adding...' : 'Add'}
                  </Button>
                </div>
              )}
            </div>
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

export default EditHelpRequest; 