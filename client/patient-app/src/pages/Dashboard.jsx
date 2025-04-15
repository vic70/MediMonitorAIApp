import { useEffect, useState } from 'react';
import { Card, Row, Col, Container, Alert, Button } from 'react-bootstrap';
import { useQuery, gql } from '@apollo/client';
import { Link } from 'react-router-dom';

const GET_PATIENT_DATA = gql`
  query GetPatientData($userId: ID!) {
    patientDataByUserId(userId: $userId) {
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
      symptoms {
        breathingProblem
        fever
        dryCough
        soreThroat
        runningNose
        asthma
        chronicLungDisease
        headache
        heartDisease
        diabetes
        hyperTension
        fatigue
        gastrointestinal
        abroadTravel
        contactWithCovidPatient
        attendedLargeGathering
        visitedPublicExposedPlaces
        familyWorkingInPublicExposedPlaces
        wearingMasks
        sanitizationFromMarket
      }
      createdAt
      updatedAt
    }
  }
`;

const GET_EMERGENCY_ALERTS = gql`
  query GetPatientEmergencyAlerts($patientId: ID!) {
    patientEmergencyAlerts(patientId: $patientId) {
      id
      content
      create_date
    }
  }
`;

const GET_MOTIVATIONAL_TIPS = gql`
  query GetMotivationalTips($patientId: ID!) {
    motivationalTips(patientId: $patientId) {
      id
      content
      create_date
    }
  }
`;

const Dashboard = () => {
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = storedUser.id;
  const [patientId, setPatientId] = useState(null);
  const [requiredInfo, setRequiredInfo] = useState({});
  
  useEffect(() => {
    if (!userId) {
      console.error('No user ID found in localStorage');
      // You might want to redirect to login here
    }
  }, [userId]);
  
  console.log('Dashboard rendering with userId:', userId);
  
  const { data: patientData, loading: patientLoading, error: patientError } = useQuery(GET_PATIENT_DATA, {
    variables: { userId },
    skip: !userId,
    fetchPolicy: 'network-only',
    onCompleted: (data) => {
      console.log('Patient Data Query Completed:', data);
      if (data?.patientDataByUserId) {
        console.log('Setting patientId to:', data.patientDataByUserId.id);
        setPatientId(data.patientDataByUserId.id);
        setRequiredInfo(data.patientDataByUserId.dailyInfoRequired || {});
      } else {
        console.error('No patient data returned from query');
      }
    },
    onError: (error) => {
      console.error('Error fetching patient data:', error);
      console.error('GraphQL Errors:', error.graphQLErrors);
      console.error('Network Error:', error.networkError);
      if (error.networkError?.result?.errors) {
        console.error('Network Error Details:', error.networkError.result.errors);
      }
    }
  });

  const { data: alertsData, loading: alertsLoading, error: alertsError } = useQuery(GET_EMERGENCY_ALERTS, {
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
    if (patientId) {
      console.log('PatientId updated:', patientId);
    }
  }, [patientId]);

  console.log('Current patientData:', patientData);
  console.log('Current alertsData:', alertsData);
  console.log('Loading states:', { patientLoading, alertsLoading });
  console.log('Error states:', { patientError, alertsError });
  
  const { data: tipsData, loading: tipsLoading } = useQuery(GET_MOTIVATIONAL_TIPS, {
    variables: { patientId },
    skip: !patientId
  });
  
  // Get most recent record date
  const lastRecordDate = patientData?.patientDataByUserId?.dailyRecords?.length > 0 
    ? new Date(patientData.patientDataByUserId.dailyRecords
        .sort((a, b) => new Date(b.date) - new Date(a.date))[0].date)
    : null;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const needsToRecordToday = !lastRecordDate || lastRecordDate < today;
  
  const recentTips = tipsData?.motivationalTips?.slice(0, 3) || [];
  const alertsCount = alertsData?.patientEmergencyAlerts?.length || 0;
  const recordsCount = patientData?.patientDataByUserId?.dailyRecords?.length || 0;
  
  const loading = patientLoading || tipsLoading || alertsLoading;

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
            <Col md={3}>
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
            
            <Col md={3}>
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
            
            <Col md={3}>
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

            <Col md={3}>
              <Card className="shadow-sm h-100 text-center">
                <Card.Body>
                  <Card.Title>AI Health Analysis</Card.Title>
                  <i className="bi bi-robot display-4 mb-3"></i>
                  <Card.Text>
                    Get AI-powered insights about your health trends
                  </Card.Text>
                  <Link to="/ai-analysis" className="btn btn-info w-100">
                    View Analysis
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
                            {new Date(tip.create_date).toLocaleString()}
                          </small>
                          {tip.content}
                        </Alert>
                      ))}
                    </div>
                  ) : (
                    <Alert variant="info">No motivational tips yet.</Alert>
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