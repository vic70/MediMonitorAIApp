import { useState, useEffect } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, Button, Spinner, Alert, Badge, Row, Col, ListGroup, Modal } from 'react-bootstrap';

const GET_HELP_REQUEST = gql`
  query GetHelpRequest($id: ID!) {
    helpRequest(id: $id) {
      id
      description
      location
      isResolved
      createdAt
      updatedAt
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

const RESOLVE_HELP_REQUEST = gql`
  mutation ResolveHelpRequest($id: ID!, $isResolved: Boolean!) {
    resolveHelpRequest(id: $id, isResolved: $isResolved) {
      id
      isResolved
    }
  }
`;

const DELETE_HELP_REQUEST = gql`
  mutation DeleteHelpRequest($id: ID!) {
    deleteHelpRequest(id: $id)
  }
`;

// Import the query used in HelpRequestList to refetch it after deletion
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

const HelpRequestDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
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
  
  const { loading, error, data, refetch } = useQuery(GET_HELP_REQUEST, {
    variables: { id }
  });
  
  const [resolveHelpRequest, { loading: resolveLoading }] = useMutation(RESOLVE_HELP_REQUEST, {
    onCompleted: () => {
      refetch();
    }
  });

  const [deleteHelpRequest, { loading: deleteLoading }] = useMutation(DELETE_HELP_REQUEST, {
    refetchQueries: [
      { query: GET_HELP_REQUESTS } // Refetch help requests list after deletion
    ],
    onCompleted: () => {
      navigate('/help-requests');
    },
    onError: (error) => {
      console.error('Error deleting help request:', error);
      setShowDeleteModal(false);
    }
  });
  
  if (loading) return (
    <div className="text-center my-5">
      <Spinner animation="border" role="status">
        <span className="visually-hidden">Loading...</span>
      </Spinner>
    </div>
  );
  
  if (error) return (
    <Alert variant="danger">
      Error loading help request: {error.message}
    </Alert>
  );

  if (!user) return (
    <Alert variant="warning">
      Please log in to view this help request.
    </Alert>
  );
  
  const helpRequest = data.helpRequest;
  const isAuthor = user.id === helpRequest.author.id;
  const isCommunityOrganizer = user.role === 'community_organizer';
  const canManage = isAuthor || isCommunityOrganizer;
  
  const handleResolveToggle = () => {
    resolveHelpRequest({
      variables: {
        id: helpRequest.id,
        isResolved: !helpRequest.isResolved
      }
    });
  };

  const handleDelete = () => {
    deleteHelpRequest({ variables: { id } });
  };
  
  return (
    <div>
      <div className="mb-4">
        <Button variant="outline-primary" onClick={() => navigate('/help-requests')}>
          Back to Help Requests
        </Button>
      </div>
      
      <Card className="mb-4 shadow">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-start mb-3">
            <div>
              <Card.Title className="fs-2">{helpRequest.description}</Card.Title>
              <Card.Subtitle className="mb-2 text-muted">
                By {helpRequest.author.userName} - {new Date(parseInt(helpRequest.createdAt)).toLocaleDateString()}
              </Card.Subtitle>
              {helpRequest.updatedAt && (
                <small className="text-muted">
                  (Updated: {new Date(parseInt(helpRequest.updatedAt)).toLocaleDateString()})
                </small>
              )}
            </div>
            <Badge bg={helpRequest.isResolved ? 'success' : 'warning'} className="fs-6">
              {helpRequest.isResolved ? 'Resolved' : 'Active'}
            </Badge>
          </div>
          
          {helpRequest.location && (
            <Card.Text className="mt-3">
              <strong>Location:</strong> {helpRequest.location}
            </Card.Text>
          )}
          
          <Card.Text className="mt-4 mb-2">
            <strong>Volunteers ({helpRequest.volunteers.length}):</strong>
          </Card.Text>
          
          {helpRequest.volunteers.length === 0 ? (
            <Alert variant="info">No volunteers have signed up yet.</Alert>
          ) : (
            <ListGroup variant="flush" className="mb-4">
              {helpRequest.volunteers.map(volunteer => (
                <ListGroup.Item key={volunteer.id}>
                  {volunteer.userName}
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </Card.Body>
      </Card>
      
      {/* Action buttons */}
      <Row className="justify-content-end">
        <Col xs="auto">
          {canManage && (
            <>
              {!helpRequest.isResolved && isAuthor && (
                <Link to={`/help-requests/edit/${helpRequest.id}`}>
                  <Button variant="warning" className="me-2">Edit</Button>
                </Link>
              )}
              
              <Button 
                variant={helpRequest.isResolved ? "warning" : "success"}
                onClick={handleResolveToggle}
                disabled={resolveLoading}
                className="me-2"
              >
                {resolveLoading 
                  ? "Updating..." 
                  : (helpRequest.isResolved 
                    ? "Mark as Active" 
                    : "Mark as Resolved")}
              </Button>

              <Button 
                variant="danger" 
                className="me-2"
                onClick={() => setShowDeleteModal(true)}
              >
                Delete
              </Button>
            </>
          )}
        </Col>
      </Row>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete this help request? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="danger" 
            onClick={handleDelete}
            disabled={deleteLoading}
          >
            {deleteLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default HelpRequestDetail; 