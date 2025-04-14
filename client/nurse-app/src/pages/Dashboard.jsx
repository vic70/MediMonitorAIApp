import { useEffect, useState } from 'react';
import { Card, Row, Col, Container, Alert } from 'react-bootstrap';
import { useQuery, gql } from '@apollo/client';
import { Link } from 'react-router-dom';

const GET_NURSE_DATA = gql`
  query GetNurseData($userId: ID!) {
    nurseByUserId(userId: $userId) {
      id
      patients
    }
  }
`;

const GET_EMERGENCY_ALERTS = gql`
  query GetEmergencyAlerts {
    emergencyAlerts {
      id
      content
      createdAt
      patientId
    }
  }
`;

const Dashboard = () => {
  const userId = localStorage.getItem('userId');
  const [nurseId, setNurseId] = useState(null);
  const [patientCount, setPatientCount] = useState(0);
  
  const { data: nurseData } = useQuery(GET_NURSE_DATA, {
    variables: { userId },
    skip: !userId
  });
  
  const { data: alertsData, loading } = useQuery(GET_EMERGENCY_ALERTS);
  
  useEffect(() => {
    if (nurseData?.nurseByUserId) {
      setNurseId(nurseData.nurseByUserId.id);
      setPatientCount(nurseData.nurseByUserId.patients?.length || 0);
    }
  }, [nurseData]);
  
  const recentAlerts = alertsData?.emergencyAlerts?.slice(0, 5) || [];

  return (
    <Container>
      <h1 className="mb-4">Nurse Dashboard</h1>
      
      <Row className="mb-4">
        <Col md={4}>
          <Card className="shadow-sm h-100">
            <Card.Body>
              <Card.Title>My Patients</Card.Title>
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
                          {new Date(alert.createdAt).toLocaleString()}
                        </small>
                        <div>{alert.content}</div>
                        <div className="mt-2">
                          <Link to={`/patients/${alert.patientId}`} className="btn btn-sm btn-outline-danger">
                            View Patient
                          </Link>
                        </div>
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
      
      <Row>
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
                  <Link to={nurseId ? `/patients/${nurseId}/tips` : "#"} className={`btn btn-outline-success w-100 ${!nurseId && 'disabled'}`}>
                    Send Motivational Tips
                  </Link>
                </Col>
                <Col md={4}>
                  <Link to={nurseId ? `/patients/${nurseId}/required-info` : "#"} className={`btn btn-outline-info w-100 ${!nurseId && 'disabled'}`}>
                    Update Required Information
                  </Link>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard; 