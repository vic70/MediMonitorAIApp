import { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Alert, ListGroup, Badge } from 'react-bootstrap';
import { useMutation, useQuery, gql } from '@apollo/client';

const GET_PATIENT_DATA = gql`
  query GetPatientData($userId: ID!) {
    patientByUserId(userId: $userId) {
      id
      symptoms {
        id
        date
        symptoms
        notes
      }
    }
  }
`;

const ADD_SYMPTOM_REPORT = gql`
  mutation AddSymptomReport($patientId: ID!, $date: String!, $symptoms: [String!]!, $notes: String) {
    addSymptomReport(patientId: $patientId, date: $date, symptoms: $symptoms, notes: $notes) {
      id
      date
      symptoms
      notes
    }
  }
`;

// Common symptom options
const SYMPTOM_OPTIONS = [
  'Fever', 'Cough', 'Shortness of Breath', 'Fatigue', 'Headache',
  'Sore Throat', 'Runny Nose', 'Muscle Pain', 'Nausea', 'Vomiting',
  'Diarrhea', 'Loss of Taste', 'Loss of Smell', 'Chest Pain', 'Rash',
  'Joint Pain', 'Difficulty Breathing', 'Swollen Lymph Nodes', 'Dizziness', 'Confusion'
];

const SymptomsList = () => {
  const userId = localStorage.getItem('userId');
  const [patientId, setPatientId] = useState(null);
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [customSymptom, setCustomSymptom] = useState('');
  const [notes, setNotes] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);
  
  const { data: patientData, loading: patientLoading, refetch } = useQuery(GET_PATIENT_DATA, {
    variables: { userId },
    skip: !userId
  });
  
  const [addSymptomReport, { loading: submitting }] = useMutation(ADD_SYMPTOM_REPORT, {
    onCompleted: () => {
      setSuccessMessage('Symptoms reported successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      // Reset form
      setSelectedSymptoms([]);
      setCustomSymptom('');
      setNotes('');
      setDate(today);
      refetch();
    },
    onError: (error) => {
      setErrorMessage(`Error reporting symptoms: ${error.message}`);
      setTimeout(() => setErrorMessage(''), 5000);
    }
  });
  
  useEffect(() => {
    if (patientData?.patientByUserId) {
      setPatientId(patientData.patientByUserId.id);
    }
  }, [patientData]);
  
  const handleSymptomToggle = (symptom) => {
    setSelectedSymptoms(prev => {
      if (prev.includes(symptom)) {
        return prev.filter(s => s !== symptom);
      } else {
        return [...prev, symptom];
      }
    });
  };
  
  const handleAddCustomSymptom = () => {
    if (customSymptom.trim() && !selectedSymptoms.includes(customSymptom.trim())) {
      setSelectedSymptoms(prev => [...prev, customSymptom.trim()]);
      setCustomSymptom('');
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (selectedSymptoms.length === 0) {
      setErrorMessage('Please select at least one symptom');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }
    
    try {
      await addSymptomReport({
        variables: {
          patientId,
          date,
          symptoms: selectedSymptoms,
          notes: notes.trim() || null
        }
      });
    } catch (error) {
      console.error('Error reporting symptoms:', error);
    }
  };
  
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };
  
  const symptomReports = patientData?.patientByUserId?.symptoms || [];
  const sortedReports = [...symptomReports].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <Container>
      <h1 className="mb-4">Symptom Tracker</h1>
      
      <Card className="shadow-sm mb-4">
        <Card.Body>
          <Card.Title className="mb-3">Report Your Symptoms</Card.Title>
          
          {successMessage && <Alert variant="success">{successMessage}</Alert>}
          {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
          
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Date</Form.Label>
              <Form.Control
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                max={today}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-4">
              <Form.Label>Select Your Symptoms</Form.Label>
              <div className="d-flex flex-wrap gap-2 mb-3">
                {SYMPTOM_OPTIONS.map(symptom => (
                  <Badge 
                    key={symptom}
                    bg={selectedSymptoms.includes(symptom) ? 'danger' : 'secondary'}
                    style={{ cursor: 'pointer', padding: '8px 12px' }}
                    onClick={() => handleSymptomToggle(symptom)}
                  >
                    {symptom}
                  </Badge>
                ))}
              </div>
              
              <div className="d-flex mb-2">
                <Form.Control
                  type="text"
                  placeholder="Add other symptom"
                  value={customSymptom}
                  onChange={(e) => setCustomSymptom(e.target.value)}
                />
                <Button 
                  variant="outline-primary" 
                  onClick={handleAddCustomSymptom}
                  disabled={!customSymptom.trim()}
                  className="ms-2"
                >
                  Add
                </Button>
              </div>
              
              {selectedSymptoms.length > 0 && (
                <div className="mt-3">
                  <Form.Label>Selected Symptoms:</Form.Label>
                  <div className="d-flex flex-wrap gap-2">
                    {selectedSymptoms.map(symptom => (
                      <Badge key={symptom} bg="danger" className="px-3 py-2">
                        {symptom} <span onClick={() => handleSymptomToggle(symptom)} style={{ cursor: 'pointer', marginLeft: '5px' }}>×</span>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </Form.Group>
            
            <Form.Group className="mb-4">
              <Form.Label>Additional Notes</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional information about your symptoms..."
              />
            </Form.Group>
            
            <div className="d-grid">
              <Button 
                variant="danger" 
                size="lg" 
                type="submit" 
                disabled={submitting || !patientId || selectedSymptoms.length === 0}
              >
                {submitting ? 'Submitting...' : 'Report Symptoms'}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
      
      <Card className="shadow-sm">
        <Card.Body>
          <Card.Title className="mb-3">Previous Symptom Reports</Card.Title>
          
          {patientLoading ? (
            <p>Loading symptom reports...</p>
          ) : sortedReports.length > 0 ? (
            <ListGroup>
              {sortedReports.map(report => (
                <ListGroup.Item key={report.id} className="mb-2">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <strong>Reported on: {formatDate(report.date)}</strong>
                    <Badge bg="primary">{report.symptoms.length} symptoms</Badge>
                  </div>
                  
                  <div className="d-flex flex-wrap gap-1 mb-2">
                    {report.symptoms.map((symptom, index) => (
                      <Badge key={index} bg="danger" className="me-1 mb-1">{symptom}</Badge>
                    ))}
                  </div>
                  
                  {report.notes && (
                    <div className="mt-2">
                      <small className="text-muted">Notes:</small>
                      <p className="mb-0">{report.notes}</p>
                    </div>
                  )}
                </ListGroup.Item>
              ))}
            </ListGroup>
          ) : (
            <Alert variant="info">
              You haven't reported any symptoms yet.
            </Alert>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default SymptomsList; 