import { useState, useEffect } from 'react';
import { useQuery, gql } from '@apollo/client';
import { Card, Row, Col, Button, Spinner, Alert, ButtonGroup, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';

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

const HelpRequestList = () => {
  const [filter, setFilter] = useState('all');
  const [user, setUser] = useState(null);
  const { loading, error, data } = useQuery(GET_HELP_REQUESTS);

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

  if (loading) return (
    <div className="text-center my-5">
      <Spinner animation="border" role="status">
        <span className="visually-hidden">Loading...</span>
      </Spinner>
    </div>
  );

  if (error) return (
    <Alert variant="danger">
      Error loading help requests: {error.message}
    </Alert>
  );

  // Apply filters
  const filteredRequests = data.helpRequests.filter(request => {
    if (filter === 'all') return true;
    if (filter === 'active') return !request.isResolved;
    if (filter === 'resolved') return request.isResolved;
    return true;
  });

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Help Requests</h2>
        <Link to="/help-requests/create">
          <Button variant="success">Request Help</Button>
        </Link>
      </div>

      <div className="mb-4">
        <ButtonGroup>
          <Button 
            variant={filter === 'all' ? 'primary' : 'outline-primary'} 
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button 
            variant={filter === 'active' ? 'warning' : 'outline-warning'} 
            onClick={() => setFilter('active')}
          >
            Active
          </Button>
          <Button 
            variant={filter === 'resolved' ? 'success' : 'outline-success'} 
            onClick={() => setFilter('resolved')}
          >
            Resolved
          </Button>
        </ButtonGroup>
      </div>

      {filteredRequests.length === 0 ? (
        <Alert variant="info">
          No help requests found matching your filter.
        </Alert>
      ) : (
        <Row xs={1} md={2} className="g-4">
          {filteredRequests.map(request => (
            <Col key={request.id}>
              <Card className="h-100 shadow-sm">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <Card.Title className="mb-1">{request.description.length > 50 
                        ? request.description.substring(0, 50) + '...' 
                        : request.description}
                      </Card.Title>
                      <Card.Subtitle className="mb-2 text-muted">
                        By {request.author.userName} - {new Date(parseInt(request.createdAt)).toLocaleDateString()}
                      </Card.Subtitle>
                    </div>
                    <Badge bg={request.isResolved ? 'success' : 'warning'}>
                      {request.isResolved ? 'Resolved' : 'Active'}
                    </Badge>
                  </div>
                  
                  {request.location && (
                    <Card.Text className="mb-3">
                      <strong>Location:</strong> {request.location}
                    </Card.Text>
                  )}
                  
                  <Card.Text className="small">
                    <strong>Volunteers:</strong> {request.volunteers.length > 0 
                      ? request.volunteers.map(v => v.userName).join(', ') 
                      : 'None yet'}
                  </Card.Text>
                  
                  <div className="mt-3">
                    <Link to={`/help-requests/${request.id}`}>
                      <Button variant="outline-primary" size="sm">View Details</Button>
                    </Link>
                    {user && request.author.id === user.id && !request.isResolved && (
                      <Link to={`/help-requests/edit/${request.id}`}>
                        <Button variant="outline-warning" size="sm" className="ms-2">Edit</Button>
                      </Link>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
};

export default HelpRequestList; 