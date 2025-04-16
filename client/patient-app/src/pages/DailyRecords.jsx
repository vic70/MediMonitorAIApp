import { useState, useEffect } from 'react';
import { useMutation, useQuery, gql } from '@apollo/client';
import { Form, Button, Alert, Container, Table } from 'react-bootstrap';

const GET_DAILY_RECORDS = gql`
  query GetDailyRecords($userId: ID!) {
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

  // Get user data from localStorage
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = user.id;
  console.log('Current userId from localStorage:', userId);

  const { data: recordsData, loading: recordsLoading, error: queryError, refetch } = useQuery(GET_DAILY_RECORDS, {
    variables: { userId },
    skip: !userId,
    onCompleted: (data) => {
      console.log('Query completed. Received data:', data);
    },
    onError: (error) => {
      console.error('Query error:', error);
    }
  });

  useEffect(() => {
    console.log('Records data updated:', recordsData);
  }, [recordsData]);

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
      const variables = {
        date: formData.date
      };

      if (formData.pulseRate) variables.pulseRate = parseFloat(formData.pulseRate);
      if (formData.bloodPressure) variables.bloodPressure = parseFloat(formData.bloodPressure);
      if (formData.weight) variables.weight = parseFloat(formData.weight);
      if (formData.temperature) variables.temperature = parseFloat(formData.temperature);
      if (formData.respiratoryRate) variables.respiratoryRate = parseFloat(formData.respiratoryRate);

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

  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    try {
      // Handle unix timestamp in milliseconds
      const date = new Date(parseInt(dateString));
      return date.toLocaleString();
    } catch (error) {
      console.error("Error formatting date:", error);
      return dateString;
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

        <Form.Group className="mb-3" controlId="pulseRate">
          <Form.Label>Pulse Rate (bpm)</Form.Label>
          <Form.Control
            type="number"
            name="pulseRate"
            value={formData.pulseRate}
            onChange={handleChange}
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="bloodPressure">
          <Form.Label>Blood Pressure (mmHg)</Form.Label>
          <Form.Control
            type="text"
            name="bloodPressure"
            value={formData.bloodPressure}
            onChange={handleChange}
            placeholder="e.g., 120/80"
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="weight">
          <Form.Label>Weight (kg)</Form.Label>
          <Form.Control
            type="number"
            step="0.1"
            name="weight"
            value={formData.weight}
            onChange={handleChange}
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="temperature">
          <Form.Label>Temperature (°C)</Form.Label>
          <Form.Control
            type="number"
            step="0.1"
            name="temperature"
            value={formData.temperature}
            onChange={handleChange}
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="respiratoryRate">
          <Form.Label>Respiratory Rate (breaths per minute)</Form.Label>
          <Form.Control
            type="number"
            name="respiratoryRate"
            value={formData.respiratoryRate}
            onChange={handleChange}
          />
        </Form.Group>

        <Button variant="primary" type="submit" disabled={submitLoading}>
          {submitLoading ? 'Submitting...' : 'Submit Record'}
        </Button>
      </Form>

      <h3 className="mb-4">Your Daily Records</h3>
      {recordsLoading ? (
        <p>Loading records...</p>
      ) : recordsData?.patientDataByUserId?.dailyRecords?.length > 0 ? (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>Date</th>
              <th>Pulse Rate (bpm)</th>
              <th>Blood Pressure</th>
              <th>Weight (kg)</th>
              <th>Temperature (°C)</th>
              <th>Respiratory Rate</th>
            </tr>
          </thead>
          <tbody>
            {recordsData.patientDataByUserId.dailyRecords.map((record) => (
              <tr key={record.id}>
                <td>{formatDate(record.date)}</td>
                <td>{record.pulseRate || '-'}</td>
                <td>{record.bloodPressure || '-'}</td>
                <td>{record.weight || '-'}</td>
                <td>{record.temperature || '-'}</td>
                <td>{record.respiratoryRate || '-'}</td>
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