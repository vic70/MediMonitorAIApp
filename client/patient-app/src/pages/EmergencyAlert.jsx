import { useState, useEffect } from 'react';
import { useMutation, useQuery, gql } from '@apollo/client';
import { Form, Button, Alert, Table, Container, Card } from 'react-bootstrap';

const GET_PATIENT_DATA = gql`
  query GetPatientData($userId: ID!) {
    patientDataByUserId(userId: $userId) {
      id
      user
    }
  }
`;

const CREATE_EMERGENCY_ALERT = gql`
  mutation CreateEmergencyAlert($content: String!) {
    createEmergencyAlert(content: $content) {
      id
      content
      create_date
    }
  }
`;

const GET_PATIENT_ALERTS = gql`
  query GetPatientEmergencyAlerts($patientId: ID!) {
    patientEmergencyAlerts(patientId: $patientId) {
      id
      content
      create_date
    }
  }
`;

const EmergencyAlert = () => {
  const [content, setContent] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = storedUser.id;
  const [patientId, setPatientId] = useState(null);

  // First, get the patient ID using the user ID
  const { data: patientData, loading: patientLoading } = useQuery(GET_PATIENT_DATA, {
    variables: { userId },
    skip: !userId,
    onCompleted: (data) => {
      console.log('Patient Data Query Completed:', data);
      console.log('user id', userId);
      if (data?.patientDataByUserId?.id) {
       console.log('Setting patientId to:', data.patientDataByUserId.id);
        setPatientId(data.patientDataByUserId.id);
      }
    },
    onError: (error) => {
      console.error('Error fetching patient data:', error);
    }
  });
  
  const [createAlert, { loading: createLoading, error: createError }] = useMutation(CREATE_EMERGENCY_ALERT, {
    onCompleted: (data) => {
      console.log('Alert created:', data);
      setSuccessMessage("Emergency alert has been sent to your nurse!");
      setTimeout(() => setSuccessMessage(""), 5000);
      refetch();
    },
    onError: (error) => {
      console.error('Error creating alert:', error);
    }
  });

  const { data: alertsData, loading: alertsLoading, refetch, error: queryError } = useQuery(GET_PATIENT_ALERTS, {
    variables: { patientId: userId || '' },
    skip: !userId,
    fetchPolicy: 'network-only',
    onCompleted: (data) => {
      console.log('Emergency Alerts Query Completed:', data);
    },
    onError: (error) => {
      console.error('Error fetching emergency alerts:', error);
    }
  });

  useEffect(() => {
    console.log('Patient ID:', patientId);
    console.log('Patient Data:', patientData);
    console.log('Alerts Data:', alertsData);
  }, [patientId, patientData, alertsData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!patientId) {
      console.error('No patient ID available');
      return;
    }
    console.log('Creating alert with content:', content);
    createAlert({
      variables: {
        content
      }
    });
    setContent("");
  };

  const alerts = alertsData?.patientEmergencyAlerts ? [...alertsData.patientEmergencyAlerts] : [];
  const loading = patientLoading || alertsLoading;

  if (loading) {
    return (
      <Container>
        <h1 className="mb-4">Emergency Alert</h1>
        <p>Loading...</p>
      </Container>
    );
  }

  return (
    <Container>
      <h1 className="mb-4">Emergency Alert</h1>
      
      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <Card.Title>Send Emergency Alert</Card.Title>
          {successMessage && <Alert variant="success">{successMessage}</Alert>}
          {createError && <Alert variant="danger">Error sending alert: {createError.message}</Alert>}
          {queryError && <Alert variant="danger">Error loading alerts: {queryError.message}</Alert>}
          {!patientId && <Alert variant="warning">Unable to load patient data. Please try refreshing the page.</Alert>}
          <Form onSubmit={handleSubmit}>
            <Form.Group controlId="emergencyContent" className="mb-3">
              <Form.Label>Describe Your Emergency</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                placeholder="Please describe your emergency situation..."
                disabled={!patientId}
              />
            </Form.Group>
            <Button variant="danger" type="submit" disabled={createLoading || !patientId}>
              {createLoading ? 'Sending...' : 'Send Alert'}
            </Button>
          </Form>
        </Card.Body>
      </Card>

      <Card className="shadow-sm">
        <Card.Body>
          <Card.Title>Your Emergency Alerts</Card.Title>
          {alertsLoading ? (
            <p>Loading alerts...</p>
          ) : alerts.length > 0 ? (
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Content</th>
                </tr>
              </thead>
              <tbody>
                {alerts.sort((a, b) => new Date(b.create_date) - new Date(a.create_date)).map(alert => (
                  <tr key={alert.id}>
                    <td>{new Date(alert.create_date).toLocaleString()}</td>
                    <td>{alert.content}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <Alert variant="info">You haven't sent any emergency alerts yet.</Alert>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default EmergencyAlert;