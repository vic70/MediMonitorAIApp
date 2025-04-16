import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Card, Button, Alert, Table, Badge, ListGroup, Row, Col, Spinner } from 'react-bootstrap';
import { useQuery, gql } from '@apollo/client';

const GET_PATIENT = gql`
  query GetPatient($id: ID!) {
    patientDataByUserId(userId: $id) {
      id
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
    }
  }
`;

const GET_USER = gql`
  query GetUser($id: ID!) {
    user(id: $id) {
      id
      userName
    }
  }
`;

const ViewMedicalConditions = () => {
  const { id } = useParams();
  const [covidPrediction, setCovidPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { data: patientData, loading: patientLoading } = useQuery(GET_PATIENT, {
    variables: { id },
    skip: !id
  });
  
  const patient = patientData?.patientDataByUserId;
  
  const { data: userData, loading: userLoading } = useQuery(GET_USER, {
    variables: { id: patient?.user },
    skip: !patient?.user
  });
  
  const isLoading = patientLoading || userLoading;
  
  const formatSymptomName = (symptomKey) => {
    // Convert camelCase to readable format
    return symptomKey
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase());
  };
  
  const getSymptomValue = (value) => {
    return value ? 'Yes' : 'No';
  };
  
  const handleCovidPrediction = async () => {
    if (!patient?.symptoms) return;
    
    setLoading(true);
    setError('');
    
    try {
      // Convert boolean symptoms to 0/1 values for the prediction API
      const payload = Object.keys(patient.symptoms).reduce((acc, key) => {
        acc[key] = patient.symptoms[key] ? 1 : 0;
        return acc;
      }, {});
      
      const response = await fetch('http://localhost:5000/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setCovidPrediction(data.prediction[0][0]);
    } catch (err) {
      console.error('Error predicting COVID:', err);
      setError('Failed to get COVID prediction. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  if (isLoading) {
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
        <h1>Patient Symptoms & COVID Risk</h1>
        <Link to={`/patients/${id}`} className="btn btn-outline-primary">Back to Patient</Link>
      </div>
      
      <Row className="mb-4">
        <Col>
          <Card className="shadow-sm">
            <Card.Body>
              <Card.Title>Patient: {userData?.user?.userName || 'Unknown'}</Card.Title>
              
              <Card.Subtitle className="mt-3 mb-3">Current Symptoms</Card.Subtitle>
              
              {patient.symptoms ? (
                <>
                  <Table striped bordered hover>
                    <thead>
                      <tr>
                        <th>Symptom</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(patient.symptoms).map(([key, value]) => (
                        <tr key={key}>
                          <td>{formatSymptomName(key)}</td>
                          <td>
                            <Badge bg={value ? 'danger' : 'success'}>
                              {getSymptomValue(value)}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                  
                  <div className="mt-4">
                    <Button 
                      variant="primary" 
                      onClick={handleCovidPrediction}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Spinner
                            as="span"
                            animation="border"
                            size="sm"
                            role="status"
                            aria-hidden="true"
                          />
                          <span className="ms-2">Analyzing...</span>
                        </>
                      ) : 'Analyze COVID-19 Risk'}
                    </Button>
                  </div>
                </>
              ) : (
                <Alert variant="info">No symptoms data available for this patient.</Alert>
              )}
              
              {error && (
                <Alert variant="danger" className="mt-3">
                  {error}
                </Alert>
              )}
              
              {covidPrediction !== null && (
                <Card className="mt-4" border="warning">
                  <Card.Body>
                    <Card.Title>COVID-19 Risk Analysis</Card.Title>
                    <div className="mt-3">
                      <h4>Risk Assessment:</h4>
                      <div className="progress" style={{ height: '25px' }}>
                        <div 
                          className={`progress-bar ${covidPrediction > 0.7 ? 'bg-danger' : covidPrediction > 0.3 ? 'bg-warning' : 'bg-success'}`}
                          role="progressbar"
                          style={{ width: `${covidPrediction * 100}%` }}
                          aria-valuenow={covidPrediction * 100}
                          aria-valuemin="0"
                          aria-valuemax="100"
                        >
                          {(covidPrediction * 100).toFixed(2)}%
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <Alert variant={covidPrediction > 0.7 ? 'danger' : covidPrediction > 0.3 ? 'warning' : 'success'}>
                          <Alert.Heading>
                            {covidPrediction > 0.7 ? 'High Risk' : covidPrediction > 0.3 ? 'Moderate Risk' : 'Low Risk'}
                          </Alert.Heading>
                          <p>
                            {covidPrediction > 0.7 
                              ? 'This patient shows a high risk of COVID-19. Immediate testing and isolation recommended.'
                              : covidPrediction > 0.3 
                                ? 'This patient shows a moderate risk of COVID-19. Consider testing and monitoring symptoms.'
                                : 'This patient shows a low risk of COVID-19. Continue monitoring symptoms.'
                            }
                          </p>
                        </Alert>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ViewMedicalConditions;