import { useState, useEffect } from 'react';
import { useMutation, useQuery, gql } from '@apollo/client';
import { Form, Button, Alert, Container, Table } from 'react-bootstrap';
import formatDate from '../util/formatDate';

const GET_PATIENT_INFO = gql`
  query GetPatientInfo($userId: ID!) {
    patientDataByUserId(userId: $userId) {
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
    patientDailyInfoRequired(patientId: $userId) {
      pulseRate
      bloodPressure
      weight
      temperature
      respiratoryRate
    }
  }
`;

const ADD_DAILY_RECORD = gql`
  mutation AddDailyRecord(
    $date: String!,
    $pulseRate: Float,
    $bloodPressure: Float,
    $weight: Float,
    $temperature: Float,
    $respiratoryRate: Float
  ) {
    addDailyRecord(
      date: $date,
      pulseRate: $pulseRate,
      bloodPressure: $bloodPressure,
      weight: $weight,
      temperature: $temperature,
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
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    pulseRate: '',
    bloodPressure: '',
    weight: '',
    temperature: '',
    respiratoryRate: ''
  });

  const [requiredInfo, setRequiredInfo] = useState({
    pulseRate: true,
    bloodPressure: true,
    weight: true,
    temperature: true,
    respiratoryRate: true
  });

  // Get user data from localStorage
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = user.id;
  console.log('Current userId from localStorage:', userId);

  const { data, loading: recordsLoading, error: queryError, refetch } = useQuery(GET_PATIENT_INFO, {
    variables: { userId },
    skip: !userId,
    onCompleted: (data) => {
      console.log('Query completed. Received data:', data);
      
      // Set required info when data loads
      if (data?.patientDailyInfoRequired) {
        setRequiredInfo(data.patientDailyInfoRequired);
      }
    },
    onError: (error) => {
      console.error('Query error:', error);
    }
  });

  useEffect(() => {
    console.log('Patient info updated:', data);
    if (data?.patientDailyInfoRequired) {
      setRequiredInfo(data.patientDailyInfoRequired);
    }
  }, [data]);

  const [addRecord, { loading: submitLoading, error }] = useMutation(ADD_DAILY_RECORD, {
    onError: (error) => {
      console.error('Error adding daily record:', error);
    },
    onCompleted: (data) => {
      console.log('Successfully added record:', data);
      refetch();
    }
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Fix timezone issue by constructing a date with time set to noon
      // This prevents date shifting due to timezone issues
      const formDate = new Date(formData.date);
      formDate.setHours(12, 0, 0, 0); // Set to noon

      const variables = {
        date: formDate.toISOString()
      };

      // Only include fields that are required or have values
      if (requiredInfo.pulseRate && formData.pulseRate) variables.pulseRate = parseFloat(formData.pulseRate);
      if (requiredInfo.bloodPressure && formData.bloodPressure) variables.bloodPressure = parseFloat(formData.bloodPressure);
      if (requiredInfo.weight && formData.weight) variables.weight = parseFloat(formData.weight);
      if (requiredInfo.temperature && formData.temperature) variables.temperature = parseFloat(formData.temperature);
      if (requiredInfo.respiratoryRate && formData.respiratoryRate) variables.respiratoryRate = parseFloat(formData.respiratoryRate);

      console.log('Submitting variables:', variables);

      await addRecord({ 
        variables,
        update: (cache, { data }) => {
          console.log('Record added:', data);
        }
      });

      setFormData({
        date: new Date().toISOString().split('T')[0],
        pulseRate: '',
        bloodPressure: '',
        weight: '',
        temperature: '',
        respiratoryRate: ''
      });
    } catch (err) {
      console.error('Error submitting record:', err);
    }
  };


  if (queryError) {
    console.error('Query error details:', queryError);
    return <Alert variant="danger">Error loading records: {queryError.message}</Alert>;
  }

  return (
    <Container>
      <h2 className="mb-4">Add Daily Health Record</h2>
      <Form onSubmit={handleSubmit} className="mb-5">
        {error && <Alert variant="danger">Error submitting record: {error.message}</Alert>}
        
        <Form.Group className="mb-3" controlId="date">
          <Form.Label>Date</Form.Label>
          <Form.Control
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
          />
        </Form.Group>

        {requiredInfo.pulseRate && (
          <Form.Group className="mb-3" controlId="pulseRate">
            <Form.Label>Pulse Rate (bpm)</Form.Label>
            <Form.Control
              type="number"
              name="pulseRate"
              value={formData.pulseRate}
              onChange={handleChange}
              required
            />
          </Form.Group>
        )}

        {requiredInfo.bloodPressure && (
          <Form.Group className="mb-3" controlId="bloodPressure">
            <Form.Label>Blood Pressure (mmHg)</Form.Label>
            <Form.Control
              type="text"
              name="bloodPressure"
              value={formData.bloodPressure}
              onChange={handleChange}
              placeholder="e.g., 120"
              required
            />
          </Form.Group>
        )}

        {requiredInfo.weight && (
          <Form.Group className="mb-3" controlId="weight">
            <Form.Label>Weight (kg)</Form.Label>
            <Form.Control
              type="number"
              step="0.1"
              name="weight"
              value={formData.weight}
              onChange={handleChange}
              required
            />
          </Form.Group>
        )}

        {requiredInfo.temperature && (
          <Form.Group className="mb-3" controlId="temperature">
            <Form.Label>Temperature (°C)</Form.Label>
            <Form.Control
              type="number"
              step="0.1"
              name="temperature"
              value={formData.temperature}
              onChange={handleChange}
              required
            />
          </Form.Group>
        )}

        {requiredInfo.respiratoryRate && (
          <Form.Group className="mb-3" controlId="respiratoryRate">
            <Form.Label>Respiratory Rate (breaths per minute)</Form.Label>
            <Form.Control
              type="number"
              name="respiratoryRate"
              value={formData.respiratoryRate}
              onChange={handleChange}
              required
            />
          </Form.Group>
        )}

        <Button variant="primary" type="submit" disabled={submitLoading}>
          {submitLoading ? 'Submitting...' : 'Submit Record'}
        </Button>
      </Form>

      <h3 className="mb-4">Your Daily Records</h3>
      {recordsLoading ? (
        <p>Loading records...</p>
      ) : data?.patientDataByUserId?.dailyRecords?.length > 0 ? (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>Date</th>
              {requiredInfo.pulseRate && <th>Pulse Rate (bpm)</th>}
              {requiredInfo.bloodPressure && <th>Blood Pressure</th>}
              {requiredInfo.weight && <th>Weight (kg)</th>}
              {requiredInfo.temperature && <th>Temperature (°C)</th>}
              {requiredInfo.respiratoryRate && <th>Respiratory Rate</th>}
            </tr>
          </thead>
          <tbody>
            {data.patientDataByUserId.dailyRecords.map((record) => (
              <tr key={record.id}>
                <td>{formatDate(record.date).split(',')[0]}</td>
                {requiredInfo.pulseRate && <td>{record.pulseRate || '-'}</td>}
                {requiredInfo.bloodPressure && <td>{record.bloodPressure || '-'}</td>}
                {requiredInfo.weight && <td>{record.weight || '-'}</td>}
                {requiredInfo.temperature && <td>{record.temperature || '-'}</td>}
                {requiredInfo.respiratoryRate && <td>{record.respiratoryRate || '-'}</td>}
              </tr>
            ))}
          </tbody>
        </Table>
      ) : (
        <p>No records found. {!userId ? '(No user ID found in localStorage)' : ''}</p>
      )}
    </Container>
  );
};

export default DailyRecords;