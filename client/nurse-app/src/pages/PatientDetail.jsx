import { useParams, Link } from 'react-router-dom';
import { useQuery, gql } from '@apollo/client';
import { Container, Row, Col, Card, Table, Button, Badge, Tab, Tabs, Alert } from 'react-bootstrap';

const GET_PATIENT = gql`
  query GetPatient($id: ID!) {
    patientData(id: $id) {
      id
      user
      dailyInfoRequired {
        pulseRate
        bloodPressure
        weight
        temperature
        respiratoryRate
      }
      dailyRecords {
        id
        date
        pulseRate
        bloodPressure
        weight
        temperature
        respiratoryRate
      }
      emergencyAlerts {
        id
        content
        create_date
      }
      createdAt
      updatedAt
    }
  }
`;

const GET_USER = gql`
  query GetUser($id: ID!) {
    user(id: $id) {
      id
      userName
      email
    }
  }
`;

const GET_MOTIVATIONAL_TIPS = gql`
  query GetMotivationalTips($patientId: ID!) {
    motivationalTips(patientId: $patientId) {
      id
      content
      createdAt
    }
  }
`;

const PatientDetail = () => {
  const { id } = useParams();
  
  const { data: patientData, loading: patientLoading } = useQuery(GET_PATIENT, {
    variables: { id },
    skip: !id
  });
  
  const patient = patientData?.patientData;
  
  const { data: userData, loading: userLoading } = useQuery(GET_USER, {
    variables: { id: patient?.user },
    skip: !patient?.user
  });
  
  const { data: tipsData, loading: tipsLoading } = useQuery(GET_MOTIVATIONAL_TIPS, {
    variables: { patientId: id },
    skip: !id
  });
  
  const user = userData?.user;
  const tips = tipsData?.motivationalTips || [];
  const dailyRecords = patient?.dailyRecords || [];
  const emergencyAlerts = patient?.emergencyAlerts || [];
  
  const loading = patientLoading || userLoading || tipsLoading;

  // Helper function to format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return <Container><p>Loading patient data...</p></Container>;
  }

  if (!patient) {
    return (
      <Container>
        <Alert variant="danger">
          Patient not found or you don't have permission to view this patient.
        </Alert>
        <Link to="/patients" className="btn btn-primary">Back to Patients</Link>
      </Container>
    );
  }

  return (
    <Container>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>{user?.userName || 'Patient'} Details</h1>
        <Link to="/patients" className="btn btn-outline-primary">Back to Patients</Link>
      </div>
      
      <Row className="mb-4">
        <Col md={4}>
          <Card className="shadow-sm h-100">
            <Card.Body>
              <Card.Title>Patient Information</Card.Title>
              <Table borderless>
                <tbody>
                  <tr>
                    <td><strong>Name:</strong></td>
                    <td>{user?.userName || 'Unknown'}</td>
                  </tr>
                  <tr>
                    <td><strong>Email:</strong></td>
                    <td>{user?.email || 'Unknown'}</td>
                  </tr>
                  <tr>
                    <td><strong>Patient Since:</strong></td>
                    <td>{formatDate(patient.createdAt)}</td>
                  </tr>
                </tbody>
              </Table>
              
              <Card.Title className="mt-3">Required Daily Info</Card.Title>
              <div className="d-flex flex-wrap gap-1 mb-3">
                {patient.dailyInfoRequired.pulseRate && <Badge bg="info">Pulse Rate</Badge>}
                {patient.dailyInfoRequired.bloodPressure && <Badge bg="info">Blood Pressure</Badge>}
                {patient.dailyInfoRequired.weight && <Badge bg="info">Weight</Badge>}
                {patient.dailyInfoRequired.temperature && <Badge bg="info">Temperature</Badge>}
                {patient.dailyInfoRequired.respiratoryRate && <Badge bg="info">Respiratory Rate</Badge>}
              </div>
              
              <div className="d-grid gap-2">
                <Link to={`/patients/${id}/tips`} className="btn btn-success">Send Motivational Tip</Link>
                <Link to={`/patients/${id}/required-info`} className="btn btn-primary">Update Required Info</Link>
                <Link to={`/patients/${id}/conditions`} className="btn btn-warning">View Medical Conditions</Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={8}>
          <Card className="shadow-sm h-100">
            <Card.Body>
              <Tabs defaultActiveKey="dailyRecords" className="mb-3">
                <Tab eventKey="dailyRecords" title="Daily Records">
                  {dailyRecords.length > 0 ? (
                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                      <Table striped hover responsive>
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Pulse Rate</th>
                            <th>Blood Pressure</th>
                            <th>Weight</th>
                            <th>Temperature</th>
                            <th>Respiratory Rate</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dailyRecords.sort((a, b) => new Date(b.date) - new Date(a.date)).map(record => (
                            <tr key={record.id}>
                              <td>{formatDate(record.date)}</td>
                              <td>{record.pulseRate || '-'}</td>
                              <td>{record.bloodPressure || '-'}</td>
                              <td>{record.weight || '-'}</td>
                              <td>{record.temperature || '-'}</td>
                              <td>{record.respiratoryRate || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  ) : (
                    <p className="text-center my-4">No daily records available</p>
                  )}
                </Tab>
                
                <Tab eventKey="alerts" title="Emergency Alerts">
                  {emergencyAlerts.length > 0 ? (
                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                      {emergencyAlerts.sort((a, b) => new Date(b.create_date) - new Date(a.create_date)).map(alert => (
                        <Alert key={alert.id} variant="danger" className="mb-2">
                          <div className="d-flex justify-content-between">
                            <strong>Emergency Alert</strong>
                            <small>{formatDate(alert.create_date)}</small>
                          </div>
                          <hr />
                          <p>{alert.content}</p>
                        </Alert>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center my-4">No emergency alerts</p>
                  )}
                </Tab>
                
                <Tab eventKey="tips" title="Motivational Tips">
                  {tips.length > 0 ? (
                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                      {tips.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map(tip => (
                        <Card key={tip.id} className="mb-2">
                          <Card.Body>
                            <Card.Subtitle className="mb-2 text-muted">{formatDate(tip.createdAt)}</Card.Subtitle>
                            <Card.Text>{tip.content}</Card.Text>
                          </Card.Body>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center my-4">No motivational tips sent yet</p>
                  )}
                </Tab>
              </Tabs>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default PatientDetail; 