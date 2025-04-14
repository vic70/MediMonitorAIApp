import { useState } from 'react';
import { Container, Card, Form, Button, Row, Col, Alert, Table } from 'react-bootstrap';
import { useQuery, useMutation, gql } from '@apollo/client';
import { format, parseISO } from 'date-fns';

// Updated queries for PatientData
const GET_PATIENT_DATA = gql`
  query GetPatientData($userId: ID!) {
    patientDataByUserId(userId: $userId) {
      id
      userId
      dailyInfoRequired {
        pulseRate
        bloodPressure
        weight
        temperature
        respiratoryRate
      }
    }
  }
`;

const GET_DAILY_RECORDS = gql`
  query GetDailyRecords($patientId: ID!) {
    patientDailyRecords(patientId: $patientId) {
      id
      date
      pulseRate
      bloodPressure
      weight
      temperature
      respiratoryRate
      notes
    }
  }
`;

// Updated mutation to add daily record
const ADD_DAILY_RECORD = gql`
  mutation AddDailyRecord(
    $date: String!,
    $pulseRate: Float,
    $bloodPressure: String,
    $weight: Float,
    $temperature: Float,
    $respiratoryRate: Float,
    $notes: String
  ) {
    addDailyRecord(
      date: $date,
      pulseRate: $pulseRate,
      bloodPressure: $bloodPressure,
      weight: $weight,
      temperature: $temperature,
      respiratoryRate: $respiratoryRate,
      notes: $notes
    ) {
      id
      date
      pulseRate
      bloodPressure
      weight
      temperature
      respiratoryRate
      notes
    }
  }
`;

const DailyRecords = () => {
  const userId = localStorage.getItem('userId');
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    pulseRate: '',
    bloodPressure: '',
    weight: '',
    temperature: '',
    respiratoryRate: '',
    notes: ''
  });
  const [message, setMessage] = useState(null);
  const [requiredFields, setRequiredFields] = useState({
    pulseRate: false,
    bloodPressure: false,
    weight: false,
    temperature: false,
    respiratoryRate: false
  });

  // Get patient data to check required fields
  const { loading: loadingPatient, error: errorPatient } = useQuery(GET_PATIENT_DATA, {
    variables: { userId },
    skip: !userId,
    onCompleted: (data) => {
      if (data?.patientDataByUserId) {
        setRequiredFields(data.patientDataByUserId.dailyInfoRequired);
      }
    }
  });

  // Get daily records
  const { loading: loadingRecords, error: errorRecords, data: recordsData, refetch } = useQuery(GET_DAILY_RECORDS, {
    variables: { patientId: userId },
    skip: !userId,
    fetchPolicy: 'network-only'
  });

  // Add daily record mutation
  const [addDailyRecord, { loading: submitting }] = useMutation(ADD_DAILY_RECORD, {
    onCompleted: () => {
      setMessage({
        type: 'success',
        text: 'Daily record added successfully!'
      });
      setFormData({
        date: new Date().toISOString().split('T')[0],
        pulseRate: '',
        bloodPressure: '',
        weight: '',
        temperature: '',
        respiratoryRate: '',
        notes: ''
      });
      refetch();
      
      // Clear success message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    },
    onError: (error) => {
      setMessage({
        type: 'danger',
        text: `Error: ${error.message}`
      });
    }
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Format data for submission
    const submitData = {
      date: formData.date,
      notes: formData.notes
    };
    
    // Only include numeric fields if they have a value
    if (formData.pulseRate) submitData.pulseRate = parseFloat(formData.pulseRate);
    if (formData.bloodPressure) submitData.bloodPressure = formData.bloodPressure;
    if (formData.weight) submitData.weight = parseFloat(formData.weight);
    if (formData.temperature) submitData.temperature = parseFloat(formData.temperature);
    if (formData.respiratoryRate) submitData.respiratoryRate = parseFloat(formData.respiratoryRate);
    
    addDailyRecord({ variables: submitData });
  };

  const getDailyRecords = () => {
    if (!recordsData?.patientDailyRecords) return [];
    
    // Create a copy of the records and sort by date (newest first)
    const records = [...recordsData.patientDailyRecords];
    return records.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const formatDate = (dateString) => {
    try {
      return format(parseISO(dateString), 'MMM dd, yyyy');
    } catch (
      // eslint-disable-next-line no-unused-vars
      error
    ) {
      return dateString;
    }
  };

  const isLoading = loadingPatient || loadingRecords;
  const isError = errorPatient || errorRecords;
  const sortedRecords = getDailyRecords();

  if (isError) return <p>Error loading patient data</p>;

  return (
    <Container>
      <h2 className="mb-4">Daily Health Records</h2>
      
      {message && (
        <Alert variant={message.type} onClose={() => setMessage(null)} dismissible>
          {message.text}
        </Alert>
      )}
      
      <Card className="mb-4">
        <Card.Body>
          <Card.Title>Add New Record</Card.Title>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Date</Form.Label>
                  <Form.Control
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Pulse Rate {requiredFields.pulseRate && <span className="text-danger">*</span>}
                  </Form.Label>
                  <Form.Control
                    type="number"
                    step="0.1"
                    name="pulseRate"
                    value={formData.pulseRate}
                    onChange={handleChange}
                    placeholder="bpm"
                    required={requiredFields.pulseRate}
                  />
                </Form.Group>
              </Col>
              
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Blood Pressure {requiredFields.bloodPressure && <span className="text-danger">*</span>}
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="bloodPressure"
                    value={formData.bloodPressure}
                    onChange={handleChange}
                    placeholder="e.g. 120/80"
                    required={requiredFields.bloodPressure}
                  />
                </Form.Group>
              </Col>
              
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Weight {requiredFields.weight && <span className="text-danger">*</span>}
                  </Form.Label>
                  <Form.Control
                    type="number"
                    step="0.1"
                    name="weight"
                    value={formData.weight}
                    onChange={handleChange}
                    placeholder="kg"
                    required={requiredFields.weight}
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Temperature {requiredFields.temperature && <span className="text-danger">*</span>}
                  </Form.Label>
                  <Form.Control
                    type="number"
                    step="0.1"
                    name="temperature"
                    value={formData.temperature}
                    onChange={handleChange}
                    placeholder="°C"
                    required={requiredFields.temperature}
                  />
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Respiratory Rate {requiredFields.respiratoryRate && <span className="text-danger">*</span>}
                  </Form.Label>
                  <Form.Control
                    type="number"
                    step="0.1"
                    name="respiratoryRate"
                    value={formData.respiratoryRate}
                    onChange={handleChange}
                    placeholder="breaths per minute"
                    required={requiredFields.respiratoryRate}
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>Notes</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Any additional notes about your health today"
              />
            </Form.Group>
            
            <Button 
              variant="primary" 
              type="submit" 
              disabled={submitting || isLoading}
            >
              {submitting ? 'Submitting...' : 'Add Record'}
            </Button>
          </Form>
        </Card.Body>
      </Card>
      
      <h3 className="mt-4 mb-3">Previous Records</h3>
      
      {isLoading ? (
        <p>Loading records...</p>
      ) : sortedRecords.length > 0 ? (
        <div className="table-responsive">
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Date</th>
                <th>Pulse Rate</th>
                <th>Blood Pressure</th>
                <th>Weight</th>
                <th>Temperature</th>
                <th>Respiratory Rate</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {sortedRecords.map(record => (
                <tr key={record.id}>
                  <td>{formatDate(record.date)}</td>
                  <td>{record.pulseRate || '-'}</td>
                  <td>{record.bloodPressure || '-'}</td>
                  <td>{record.weight || '-'}</td>
                  <td>{record.temperature || '-'}</td>
                  <td>{record.respiratoryRate || '-'}</td>
                  <td>{record.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      ) : (
        <p>No records found. Start tracking your health by adding a record above.</p>
      )}
    </Container>
  );
};

export default DailyRecords; 