import { useState } from 'react';
import { useMutation, gql } from '@apollo/client';
import { Form, Button, Card, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const CREATE_HELP_REQUEST = gql`
  mutation CreateHelpRequest($description: String!, $location: String) {
    createHelpRequest(description: $description, location: $location) {
      id
      description
      location
    }
  }
`;

// Import the query used in HelpRequestList to refetch it after creation
const GET_HELP_REQUESTS = gql`
  query GetHelpRequests {
    helpRequests {
      id
      description
      location
      isResolved
      createdAt
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

const CreateHelpRequest = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    description: '',
    location: ''
  });
  const [validated, setValidated] = useState(false);
  
  const [createHelpRequest, { loading, error }] = useMutation(CREATE_HELP_REQUEST, {
    refetchQueries: [
      { query: GET_HELP_REQUESTS } // Refetch help requests list after creation
    ],
    onCompleted: (data) => {
      navigate(`/help-requests/${data.createHelpRequest.id}`);
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

    createHelpRequest({
      variables: {
        description: formData.description,
        location: formData.location || null  // Make location optional
      }
    });
  };

  return (
    <div>
      <h2 className="mb-4">Request Help</h2>
      
      <Card className="shadow">
        <Card.Body>
          {error && (
            <Alert variant="danger">
              Error creating help request: {error.message}
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
              <Button variant="secondary" onClick={() => navigate('/help-requests')}>
                Cancel
              </Button>
              <Button variant="success" type="submit" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Request'}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default CreateHelpRequest; 