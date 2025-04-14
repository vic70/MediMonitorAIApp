import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Card, Button, Alert, Table, Badge, ListGroup, Row, Col } from 'react-bootstrap';
import { useQuery, gql } from '@apollo/client';

const GET_PATIENT = gql`
  query GetPatient($id: ID!) {
    patient(id: $id) {
      id
      userId
      symptoms {
        id
        date
        symptoms
        notes
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

// This would ideally be a real GraphQL endpoint for analyzing symptoms
// For demo purposes, we'll simulate this with a mock function
const analyzeSymptoms = (symptoms) => {
  const mockConditions = {
    'fever': ['Common Cold', 'Flu', 'COVID-19', 'Pneumonia'],
    'cough': ['Common Cold', 'Flu', 'COVID-19', 'Bronchitis'],
    'shortness of breath': ['COVID-19', 'Asthma', 'Heart Failure', 'Pneumonia'],
    'fatigue': ['Common Cold', 'Flu', 'Anemia', 'Depression', 'COVID-19'],
    'headache': ['Migraine', 'Tension Headache', 'Dehydration', 'Flu'],
    'sore throat': ['Common Cold', 'Strep Throat', 'Tonsillitis'],
    'runny nose': ['Common Cold', 'Flu', 'Allergic Rhinitis'],
    'muscle pain': ['Flu', 'Fibromyalgia', 'COVID-19'],
    'nausea': ['Food Poisoning', 'Migraine', 'Viral Gastroenteritis'],
    'vomiting': ['Food Poisoning', 'Viral Gastroenteritis', 'Migraine'],
    'diarrhea': ['Food Poisoning', 'Viral Gastroenteritis', 'Irritable Bowel Syndrome'],
    'loss of taste': ['COVID-19', 'Common Cold', 'Zinc Deficiency'],
    'loss of smell': ['COVID-19', 'Common Cold', 'Nasal Polyps'],
    'chest pain': ['Heart Attack', 'Angina', 'Pneumonia', 'COVID-19'],
    'rash': ['Allergic Reaction', 'Eczema', 'Psoriasis', 'Chickenpox'],
    'joint pain': ['Arthritis', 'Gout', 'Lupus', 'Lyme Disease'],
    'difficulty breathing': ['Asthma', 'COPD', 'COVID-19', 'Pneumonia'],
    'swollen lymph nodes': ['Infection', 'Mononucleosis', 'HIV', 'Cancer'],
    'dizziness': ['Low Blood Pressure', 'Inner Ear Problems', 'Anemia', 'Dehydration'],
    'confusion': ['Concussion', 'Stroke', 'UTI in elderly', 'Medication Side Effect']
  };
  
  // Count the occurrences of each condition
  const conditionCounts = {};
  
  symptoms.forEach(symptom => {
    const possibleConditions = mockConditions[symptom.toLowerCase()] || [];
    possibleConditions.forEach(condition => {
      conditionCounts[condition] = (conditionCounts[condition] || 0) + 1;
    });
  });
  
  // Convert to array, sort by count (most likely conditions first)
  const sortedConditions = Object.entries(conditionCounts)
    .map(([name, count]) => ({ 
      name, 
      count, 
      likelihood: (count / symptoms.length) * 100, 
      severity: getSeverity(name)
    }))
    .sort((a, b) => b.count - a.count);
  
  return sortedConditions;
};

// Helper function to determine severity level
const getSeverity = (condition) => {
  const highSeverity = ['Heart Attack', 'Stroke', 'COVID-19', 'Pneumonia'];
  const mediumSeverity = ['Asthma', 'Angina', 'Bronchitis', 'Flu', 'COPD'];
  
  if (highSeverity.includes(condition)) return 'high';
  if (mediumSeverity.includes(condition)) return 'medium';
  return 'low';
};

const ViewMedicalConditions = () => {
  const { id } = useParams();
  const [analyzedSymptoms, setAnalyzedSymptoms] = useState([]);
  const [selectedSymptomSet, setSelectedSymptomSet] = useState(null);
  
  const { data: patientData, loading: patientLoading } = useQuery(GET_PATIENT, {
    variables: { id },
    skip: !id
  });
  
  const patient = patientData?.patient;
  
  const { data: userData, loading: userLoading } = useQuery(GET_USER, {
    variables: { id: patient?.userId },
    skip: !patient?.userId
  });
  
  useEffect(() => {
    if (selectedSymptomSet) {
      const analysis = analyzeSymptoms(selectedSymptomSet.symptoms);
      setAnalyzedSymptoms(analysis);
    } else if (patient?.symptoms?.length > 0) {
      // Default to the most recent symptom set
      const mostRecent = [...patient.symptoms].sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      )[0];
      
      setSelectedSymptomSet(mostRecent);
    }
  }, [selectedSymptomSet, patient]);
  
  const loading = patientLoading || userLoading;
  
  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };
  
  // Get severity badge color
  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'high': return 'danger';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'secondary';
    }
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
  
  const symptomSets = patient.symptoms.sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <Container>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Medical Condition Analysis</h1>
        <Link to={`/patients/${id}`} className="btn btn-outline-primary">Back to Patient</Link>
      </div>
      
      <Row className="mb-4">
        <Col md={4}>
          <Card className="shadow-sm h-100">
            <Card.Body>
              <Card.Title>Patient: {userData?.user?.userName || 'Unknown'}</Card.Title>
              
              <Card.Subtitle className="mt-3 mb-2">Reported Symptoms</Card.Subtitle>
              {symptomSets.length > 0 ? (
                <ListGroup>
                  {symptomSets.map(symptomSet => (
                    <ListGroup.Item 
                      key={symptomSet.id}
                      action
                      active={selectedSymptomSet?.id === symptomSet.id}
                      onClick={() => setSelectedSymptomSet(symptomSet)}
                    >
                      <div className="d-flex justify-content-between align-items-center">
                        <span>
                          {formatDate(symptomSet.date)}
                        </span>
                        <Badge bg="primary">{symptomSet.symptoms.length} symptoms</Badge>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              ) : (
                <Alert variant="info">No symptoms reported by this patient yet.</Alert>
              )}
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={8}>
          <Card className="shadow-sm h-100">
            <Card.Body>
              <Card.Title>Analysis Results</Card.Title>
              
              {selectedSymptomSet ? (
                <>
                  <div className="mb-3">
                    <strong>Date Reported:</strong> {formatDate(selectedSymptomSet.date)}
                  </div>
                  
                  <div className="mb-3">
                    <strong>Symptoms:</strong>
                    <div className="d-flex flex-wrap gap-1 mt-1">
                      {selectedSymptomSet.symptoms.map((symptom, index) => (
                        <Badge key={index} bg="secondary" className="me-1">{symptom}</Badge>
                      ))}
                    </div>
                  </div>
                  
                  {selectedSymptomSet.notes && (
                    <div className="mb-3">
                      <strong>Notes:</strong>
                      <p className="mt-1">{selectedSymptomSet.notes}</p>
                    </div>
                  )}
                  
                  <hr />
                  
                  <Card.Subtitle className="mb-3">Possible Conditions</Card.Subtitle>
                  
                  {analyzedSymptoms.length > 0 ? (
                    <Table striped bordered hover>
                      <thead>
                        <tr>
                          <th>Condition</th>
                          <th>Likelihood</th>
                          <th>Severity</th>
                          <th>Recommendation</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analyzedSymptoms.map(condition => (
                          <tr key={condition.name}>
                            <td>{condition.name}</td>
                            <td>
                              <div className="d-flex align-items-center">
                                <div className="progress w-100">
                                  <div 
                                    className={`progress-bar bg-${getSeverityBadge(condition.severity)}`}
                                    role="progressbar"
                                    style={{ width: `${condition.likelihood}%` }}
                                    aria-valuenow={condition.likelihood}
                                    aria-valuemin="0"
                                    aria-valuemax="100"
                                  ></div>
                                </div>
                                <span className="ms-2">{Math.round(condition.likelihood)}%</span>
                              </div>
                            </td>
                            <td>
                              <Badge bg={getSeverityBadge(condition.severity)}>
                                {condition.severity.toUpperCase()}
                              </Badge>
                            </td>
                            <td>
                              {condition.severity === 'high' ? (
                                <strong className="text-danger">Immediate medical attention recommended</strong>
                              ) : condition.severity === 'medium' ? (
                                <span className="text-warning">Consult with healthcare provider soon</span>
                              ) : (
                                <span className="text-success">Monitor symptoms</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  ) : (
                    <Alert variant="info">No conditions analyzed yet.</Alert>
                  )}
                  
                  <Alert variant="warning" className="mt-3">
                    <strong>Disclaimer:</strong> This analysis is for informational purposes only and does not constitute medical advice. 
                    Please advise the patient to consult with a healthcare professional for proper diagnosis and treatment.
                  </Alert>
                </>
              ) : (
                <Alert variant="info">Select a symptom report to analyze.</Alert>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ViewMedicalConditions; 