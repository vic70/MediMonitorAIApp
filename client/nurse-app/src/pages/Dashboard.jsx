import { Card, Row, Col, Container, Alert } from 'react-bootstrap';
import { useQuery, gql } from '@apollo/client';
import { Link } from 'react-router-dom';
import formatDate from '../util/formatDate';

const GET_PATIENTS_COUNT = gql`
  query GetPatientsCount {
    patientsData {
      id
    }
  }
`;

const GET_EMERGENCY_ALERTS = gql`
  query GetEmergencyAlerts {
    emergencyAlerts {
      id
      content
      create_date
    }
  }
`;

const Dashboard = () => {
  const { data: patientsData } = useQuery(GET_PATIENTS_COUNT);
  const { data: alertsData, loading } = useQuery(GET_EMERGENCY_ALERTS);
  
  const patientCount = patientsData?.patientsData?.length || 0;
  const recentAlerts = alertsData?.emergencyAlerts?.slice(0, 5) || [];


  return (
    <Container>
      <h1 className="mb-4">Nurse Dashboard</h1>
      
      <Row className="mb-4">
        <Col md={4}>
          <Card className="shadow-sm h-100">
            <Card.Body>
              <Card.Title>Patients</Card.Title>
              <Card.Text className="display-4 text-center">
                {patientCount}
              </Card.Text>
              <Link to="/patients" className="btn btn-primary w-100">View Patients</Link>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={8}>
          <Card className="shadow-sm h-100">
            <Card.Body>
              <Card.Title>Recent Emergency Alerts</Card.Title>
              {loading ? (
                <p>Loading alerts...</p>
              ) : (
                <>
                  {recentAlerts.length > 0 ? (
                    recentAlerts.map(alert => (
                      <Alert key={alert.id} variant="danger" className="mb-2">
                        <small className="text-muted">
                          {formatDate(alert.create_date)}
                        </small>
                        <div>{alert.content}</div>
                        {/* <div className="mt-2">
                          <Link to={`/patients/${alert.patientId}`} className="btn btn-sm btn-outline-danger">
                            View Patient
                          </Link>
                        </div> */}
                      </Alert>
                    ))
                  ) : (
                    <p className="text-center my-4">No recent emergency alerts</p>
                  )}
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
      {/*<Row>
        <Col>
          <Card className="shadow-sm">
            <Card.Body>
              <Card.Title>Quick Actions</Card.Title>
              <Row className="g-3">
                <Col md={4}>
                  <Link to="/patients" className="btn btn-outline-primary w-100">
                    Manage Patients
                  </Link>
                </Col>
                <Col md={4}>
                  <Link to="/patients" className="btn btn-outline-success w-100">
                    Send Motivational Tips
                  </Link>
                </Col>
                <Col md={4}>
                  <Link to="/patients" className="btn btn-outline-info w-100">
                    Update Required Information
                  </Link>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>*/}
    </Container>
  );
};
export default Dashboard; 