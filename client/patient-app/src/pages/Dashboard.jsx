import { useEffect, useState } from 'react';
import { Card, Row, Col, Container, Alert, Button } from 'react-bootstrap';
import { useQuery, gql } from '@apollo/client';
import { Link } from 'react-router-dom';

const GET_PATIENT_DATA = gql`
  query GetPatientData($userId: ID!) {
    patientByUserId(userId: $userId) {
      id
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
        notes
      }
      emergencyAlerts {
        id
        createdAt
      }
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

const Dashboard = () => {
  const userId = localStorage.getItem('userId');
  const [patientId, setPatientId] = useState(null);
  const [requiredInfo, setRequiredInfo] = useState({});
  
  const { data: patientData, loading: patientLoading } = useQuery(GET_PATIENT_DATA, {
    variables: { userId },
    skip: !userId,
    onCompleted: (data) => {
      console.log('Patient Data:', data);
      if (data?.patientByUserId) {
        setPatientId(data.patientByUserId.id);
        setRequiredInfo(data.patientByUserId.dailyInfoRequired || {});
      }
    },
    onError: (error) => {
      console.error('Error fetching patient data:', error);
    }
  });
  
  const { data: tipsData, loading: tipsLoading } = useQuery(GET_MOTIVATIONAL_TIPS, {
    variables: { patientId },
    skip: !patientId
  });
  
  // Get most recent record date
  const lastRecordDate = patientData?.patientByUserId?.dailyRecords?.length > 0 
    ? new Date(patientData.patientByUserId.dailyRecords
        .sort((a, b) => new Date(b.date) - new Date(a.date))[0].date)
    : null;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const needsToRecordToday = !lastRecordDate || lastRecordDate < today;
  
  const recentTips = tipsData?.motivationalTips?.slice(0, 3) || [];
  const alertsCount = patientData?.patientByUserId?.emergencyAlerts?.length || 0;
  const recordsCount = patientData?.patientByUserId?.dailyRecords?.length || 0;
  
  const loading = patientLoading || tipsLoading;

  return (
    <Container>
      <h1 className="mb-4">Patient Dashboard</h1>
      
      {loading ? (
        <p>Loading dashboard data...</p>
      ) : (
        <>
          {needsToRecordToday && (
            <Alert variant="info" className="mb-4">
              <Alert.Heading>Daily Health Check Reminder</Alert.Heading>
              <p>
                You haven't recorded your health data today. Please take a moment to record 
                your daily health information.
              </p>
              <div className="d-flex justify-content-end">
                <Link to="/daily-records" className="btn btn-primary">
                  Record Now
                </Link>
              </div>
            </Alert>
          )}
          
          <Row className="mb-4">
            <Col md={4}>
              <Card className="shadow-sm h-100 text-center">
                <Card.Body>
                  <Card.Title>Health Records</Card.Title>
                  <div className="display-4 mb-3">{recordsCount}</div>
                  <Card.Text>
                    Total health records you've submitted
                  </Card.Text>
                  <Link to="/daily-records" className="btn btn-primary w-100">
                    View Records
                  </Link>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={4}>
              <Card className="shadow-sm h-100 text-center">
                <Card.Body>
                  <Card.Title>Emergency Alerts</Card.Title>
                  <div className="display-4 mb-3">{alertsCount}</div>
                  <Card.Text>
                    Alerts you've sent to your healthcare providers
                  </Card.Text>
                  <Link to="/emergency-alert" className="btn btn-danger w-100">
                    Send Emergency Alert
                  </Link>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={4}>
              <Card className="shadow-sm h-100 text-center">
                <Card.Body>
                  <Card.Title>Symptoms Tracking</Card.Title>
                  <i className="bi bi-activity display-4 mb-3"></i>
                  <Card.Text>
                    Report your symptoms to get potential condition analysis
                  </Card.Text>
                  <Link to="/symptoms" className="btn btn-warning w-100">
                    Track Symptoms
                  </Link>
                </Card.Body>
              </Card>
            </Col>
          </Row>
          
          <Row className="mb-4">
            <Col md={6}>
              <Card className="shadow-sm h-100">
                <Card.Body>
                  <Card.Title>Required Daily Information</Card.Title>
                  <Card.Text>Your healthcare provider requires you to record:</Card.Text>
                  
                  <ul className="list-group mb-3">
                    {requiredInfo.pulseRate && (
                      <li className="list-group-item">Pulse Rate (BPM)</li>
                    )}
                    {requiredInfo.bloodPressure && (
                      <li className="list-group-item">Blood Pressure (mmHg)</li>
                    )}
                    {requiredInfo.weight && (
                      <li className="list-group-item">Weight (kg/lbs)</li>
                    )}
                    {requiredInfo.temperature && (
                      <li className="list-group-item">Body Temperature (°C/°F)</li>
                    )}
                    {requiredInfo.respiratoryRate && (
                      <li className="list-group-item">Respiratory Rate (breaths per minute)</li>
                    )}
                  </ul>
                  
                  <Link to="/daily-records" className="btn btn-primary w-100">
                    Record Daily Information
                  </Link>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={6}>
              <Card className="shadow-sm h-100">
                <Card.Body>
                  <div className="d-flex justify-content-between mb-3">
                    <Card.Title>Recent Motivational Tips</Card.Title>
                    <Link to="/motivational-tips">View All</Link>
                  </div>
                  
                  {recentTips.length > 0 ? (
                    <div>
                      {recentTips.map(tip => (
                        <Alert key={tip.id} variant="success" className="mb-2">
                          <small className="text-muted d-block mb-1">
                            {new Date(tip.createdAt).toLocaleDateString()}
                          </small>
                          {tip.content}
                        </Alert>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center my-4">No motivational tips received yet</p>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </Container>
  );
};

export default Dashboard; 