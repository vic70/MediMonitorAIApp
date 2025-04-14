import { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Alert, Table, Tab, Tabs } from 'react-bootstrap';
import { useMutation, useQuery, gql } from '@apollo/client';

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
      }
    }
  }
`;

const ADD_DAILY_RECORD = gql`
  mutation AddDailyRecord(
    $patientId: ID!
    $date: String!
    $pulseRate: Float
    $bloodPressure: String
    $weight: Float
    $temperature: Float
    $respiratoryRate: Float
  ) {
    addDailyRecord(
      patientId: $patientId
      date: $date
      pulseRate: $pulseRate
      bloodPressure: $bloodPressure
      weight: $weight
      temperature: $temperature
      respiratoryRate: $respiratoryRate
    ) {
      id
      date
      pulseRate
      bloodPressure
      weight
      temperature
      respiratoryRate
    }
  }
`;

const DailyRecords = () => {
  const userId = localStorage.getItem('userId');
  const [patientId, setPatientId] = useState(null);
  const [requiredInfo, setRequiredInfo] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  const today = new Date().toISOString().split('T')[0];
  
  const [formState, setFormState] = useState({
    date: today,
    pulseRate: '',
    bloodPressure: '',
    weight: '',
    temperature: '',
    respiratoryRate: ''
  });
  
  const { data: patientData, loading: patientLoading, refetch } = useQuery(GET_PATIENT_DATA, {
    variables: { userId },
    skip: !userId,
    fetchPolicy: 'network-only'
  });
  
  const [addDailyRecord, { loading: submitting }] = useMutation(ADD_DAILY_RECORD, {
    onCompleted: () => {
      setSuccessMessage('Daily record added successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      // Reset form except date
      setFormState({
        date: today,
        pulseRate: '',
        bloodPressure: '',
        weight: '',
        temperature: '',
        respiratoryRate: ''
      });
      refetch();
    },
    onError: (error) => {
      setErrorMessage(`Error adding record: ${error.message}`);
      setTimeout(() => setErrorMessage(''), 5000);
    }
  });
  
  useEffect(() => {
    if (patientData?.patientByUserId) {
      setPatientId(patientData.patientByUserId.id);
      setRequiredInfo(patientData.patientByUserId.dailyInfoRequired || {});
    }
  }, [patientData]);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormState(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Convert string values to numbers for submission
    const submissionData = {
      patientId,
      date: formState.date,
      pulseRate: formState.pulseRate ? parseFloat(formState.pulseRate) : null,
      bloodPressure: formState.bloodPressure || null,
      weight: formState.weight ? parseFloat(formState.weight) : null,
      temperature: formState.temperature ? parseFloat(formState.temperature) : null,
      respiratoryRate: formState.respiratoryRate ? parseFloat(formState.respiratoryRate) : null
    };
    
    try {
      await addDailyRecord({
        variables: submissionData
      });
    } catch (error) {
      console.error('Error adding daily record:', error);
    }
  };
  
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };
  
  const dailyRecords = patientData?.patientByUserId?.dailyRecords || [];
  const sortedRecords = [...dailyRecords].sort((a, b) => new Date(b.date) - new Date(a.date));
  
  // Check if already recorded today
  const todayRecord = sortedRecords.find(record => 
    new Date(record.date).toISOString().split('T')[0] === today
  );

  return (
    <Container>
      <h1 className="mb-4">Daily Health Records</h1>
      
      <Tabs defaultActiveKey="record" className="mb-4">
        <Tab eventKey="record" title="Record Daily Info">
          <Card className="shadow-sm">
            <Card.Body>
              <Card.Title>Record Your Daily Health Information</Card.Title>
              {todayRecord ? (
                <Alert variant="info" className="mb-3">
                  <strong>You've already recorded your health information today.</strong> You can update it by submitting the form again.
                </Alert>
              ) : (
                <Card.Text className="mb-3">
                  Please enter your health information for today. Fields marked with * are required by your healthcare provider.
                </Card.Text>
              )}
              
              {successMessage && <Alert variant="success">{successMessage}</Alert>}
              {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
              
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Date</Form.Label>
                  <Form.Control
                    type="date"
                    name="date"
                    value={formState.date}
                    onChange={handleInputChange}
                    max={today}
                    required
                  />
                </Form.Group>
                
                {requiredInfo.pulseRate && (
                  <Form.Group className="mb-3">
                    <Form.Label>Pulse Rate (BPM) *</Form.Label>
                    <Form.Control
                      type="number"
                      name="pulseRate"
                      value={formState.pulseRate}
                      onChange={handleInputChange}
                      placeholder="Enter pulse rate (60-100)"
                      min="20"
                      max="220"
                      required
                    />
                    <Form.Text className="text-muted">
                      Normal resting heart rate: 60-100 beats per minute
                    </Form.Text>
                  </Form.Group>
                )}
                
                {requiredInfo.bloodPressure && (
                  <Form.Group className="mb-3">
                    <Form.Label>Blood Pressure (mmHg) *</Form.Label>
                    <Form.Control
                      type="text"
                      name="bloodPressure"
                      value={formState.bloodPressure}
                      onChange={handleInputChange}
                      placeholder="Format: 120/80"
                      pattern="[0-9]{2,3}\/[0-9]{2,3}"
                      required
                    />
                    <Form.Text className="text-muted">
                      Format: Systolic/Diastolic (e.g., 120/80)
                    </Form.Text>
                  </Form.Group>
                )}
                
                {requiredInfo.weight && (
                  <Form.Group className="mb-3">
                    <Form.Label>Weight (kg) *</Form.Label>
                    <Form.Control
                      type="number"
                      name="weight"
                      value={formState.weight}
                      onChange={handleInputChange}
                      placeholder="Enter weight in kg"
                      step="0.1"
                      min="20"
                      max="500"
                      required
                    />
                  </Form.Group>
                )}
                
                {requiredInfo.temperature && (
                  <Form.Group className="mb-3">
                    <Form.Label>Body Temperature (°C) *</Form.Label>
                    <Form.Control
                      type="number"
                      name="temperature"
                      value={formState.temperature}
                      onChange={handleInputChange}
                      placeholder="Enter temperature (36.1-37.2)"
                      step="0.1"
                      min="35"
                      max="42"
                      required
                    />
                    <Form.Text className="text-muted">
                      Normal body temperature: 36.1-37.2°C (97-99°F)
                    </Form.Text>
                  </Form.Group>
                )}
                
                {requiredInfo.respiratoryRate && (
                  <Form.Group className="mb-3">
                    <Form.Label>Respiratory Rate (breaths/min) *</Form.Label>
                    <Form.Control
                      type="number"
                      name="respiratoryRate"
                      value={formState.respiratoryRate}
                      onChange={handleInputChange}
                      placeholder="Enter respiratory rate (12-20)"
                      min="8"
                      max="40"
                      required
                    />
                    <Form.Text className="text-muted">
                      Normal adult respiratory rate: 12-20 breaths per minute
                    </Form.Text>
                  </Form.Group>
                )}
                
                <div className="d-grid mt-4">
                  <Button 
                    variant="primary" 
                    size="lg" 
                    type="submit" 
                    disabled={submitting || !patientId}
                  >
                    {submitting ? 'Submitting...' : todayRecord ? 'Update Record' : 'Save Record'}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Tab>
        
        <Tab eventKey="history" title="History">
          <Card className="shadow-sm">
            <Card.Body>
              <Card.Title>Your Health Records History</Card.Title>
              
              {patientLoading ? (
                <p>Loading records...</p>
              ) : sortedRecords.length > 0 ? (
                <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                  <Table striped bordered hover responsive>
                    <thead>
                      <tr>
                        <th>Date</th>
                        {requiredInfo.pulseRate && <th>Pulse Rate</th>}
                        {requiredInfo.bloodPressure && <th>Blood Pressure</th>}
                        {requiredInfo.weight && <th>Weight</th>}
                        {requiredInfo.temperature && <th>Temperature</th>}
                        {requiredInfo.respiratoryRate && <th>Respiratory Rate</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {sortedRecords.map(record => (
                        <tr key={record.id}>
                          <td>{formatDate(record.date)}</td>
                          {requiredInfo.pulseRate && <td>{record.pulseRate || '-'} BPM</td>}
                          {requiredInfo.bloodPressure && <td>{record.bloodPressure || '-'}</td>}
                          {requiredInfo.weight && <td>{record.weight || '-'} kg</td>}
                          {requiredInfo.temperature && <td>{record.temperature || '-'} °C</td>}
                          {requiredInfo.respiratoryRate && <td>{record.respiratoryRate || '-'} breaths/min</td>}
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              ) : (
                <Alert variant="info">
                  You haven't recorded any health information yet. Start recording today!
                </Alert>
              )}
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>
    </Container>
  );
};

export default DailyRecords; 