import { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Alert, ListGroup } from 'react-bootstrap';
import { useMutation, useQuery, gql } from '@apollo/client';

const GET_PATIENT_DATA = gql`
  query GetPatientData($userId: ID!) {
    patientByUserId(userId: $userId) {
      id
      emergencyAlerts {
        id
        content
        createdAt
      }
    }
  }
`;

const CREATE_EMERGENCY_ALERT = gql`
  mutation CreateEmergencyAlert($patientId: ID!, $content: String!) {
    createEmergencyAlert(patientId: $patientId, content: $content) {
      id
      content
      createdAt
    }
  }
`;

const EmergencyAlert = () => {
  const userId = localStorage.getItem('userId');
  const [patientId, setPatientId] = useState(null);
  const [alertContent, setAlertContent] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  const { data: patientData, loading: patientLoading, refetch } = useQuery(GET_PATIENT_DATA, {
    variables: { userId },
    skip: !userId
  });
  
  const [createAlert, { loading: alertLoading }] = useMutation(CREATE_EMERGENCY_ALERT, {
    onCompleted: () => {
      setAlertContent('');
      setSuccessMessage('Emergency alert sent successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      refetch();
    },
    onError: (error) => {
      setErrorMessage(`Error sending alert: ${error.message}`);
      setTimeout(() => setErrorMessage(''), 5000);
    }
  });
  
  useEffect(() => {
    if (patientData?.patientByUserId) {
      setPatientId(patientData.patientByUserId.id);
    }
  }, [patientData]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!alertContent.trim()) {
      setErrorMessage('Please enter alert content');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }
    
    try {
      await createAlert({
        variables: {
          patientId,
          content: alertContent
        }
      });
    } catch (error) {
      console.error('Error creating emergency alert:', error);
    }
  };
  
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };
  
  const alerts = patientData?.patientByUserId?.emergencyAlerts || [];
  const sortedAlerts = [...alerts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <Container>
      <h1 className="mb-4">Emergency Alert</h1>
      
      <Alert variant="danger" className="mb-4">
        <Alert.Heading>IMPORTANT</Alert.Heading>
        <p>
          This feature is for non-life-threatening emergencies. If you are experiencing a 
          medical emergency that requires immediate attention, please call emergency services
          (911) immediately.
        </p>
      </Alert>
      
      <Card className="shadow-sm mb-4">
        <Card.Body>
          <Card.Title>Send Emergency Alert</Card.Title>
          <Card.Text>
            Use this form to send an emergency alert to your healthcare providers. They will 
            be notified and can respond accordingly.
          </Card.Text>
          
          {successMessage && <Alert variant="success">{successMessage}</Alert>}
          {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
          
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Emergency Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={alertContent}
                onChange={(e) => setAlertContent(e.target.value)}
                placeholder="Describe your emergency situation in detail..."
                required
              />
            </Form.Group>
            
            <div className="d-grid">
              <Button 
                variant="danger" 
                size="lg" 
                type="submit" 
                disabled={alertLoading || !patientId}
              >
                {alertLoading ? 'Sending...' : 'SEND EMERGENCY ALERT'}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
      
      <Card className="shadow-sm">
        <Card.Body>
          <Card.Title>Previous Alerts</Card.Title>
          
          {patientLoading ? (
            <p>Loading alerts...</p>
          ) : sortedAlerts.length > 0 ? (
            <ListGroup variant="flush">
              {sortedAlerts.map(alert => (
                <ListGroup.Item key={alert.id} className="border-bottom py-3">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <strong>Emergency Alert</strong>
                    <small className="text-muted">{formatDate(alert.createdAt)}</small>
                  </div>
                  <p className="mb-0">{alert.content}</p>
                </ListGroup.Item>
              ))}
            </ListGroup>
          ) : (
            <p className="text-center my-4">No previous emergency alerts</p>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default EmergencyAlert; 