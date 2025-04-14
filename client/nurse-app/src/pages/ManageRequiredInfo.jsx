import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';
import { useQuery, useMutation, gql } from '@apollo/client';

const GET_PATIENT = gql`
  query GetPatient($id: ID!) {
    patient(id: $id) {
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

const GET_USER = gql`
  query GetUser($id: ID!) {
    user(id: $id) {
      id
      userName
    }
  }
`;

const UPDATE_REQUIRED_INFO = gql`
  mutation UpdatePatientDailyInfoRequired(
    $patientId: ID!
    $pulseRate: Boolean
    $bloodPressure: Boolean
    $weight: Boolean
    $temperature: Boolean
    $respiratoryRate: Boolean
  ) {
    updatePatientDailyInfoRequired(
      patientId: $patientId
      pulseRate: $pulseRate
      bloodPressure: $bloodPressure
      weight: $weight
      temperature: $temperature
      respiratoryRate: $respiratoryRate
    ) {
      id
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

const ManageRequiredInfo = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [formState, setFormState] = useState({
    pulseRate: false,
    bloodPressure: false,
    weight: false,
    temperature: false,
    respiratoryRate: false
  });
  
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  const { data: patientData, loading: patientLoading } = useQuery(GET_PATIENT, {
    variables: { id },
    skip: !id
  });
  
  const patient = patientData?.patient;
  
  const { data: userData, loading: userLoading } = useQuery(GET_USER, {
    variables: { id: patient?.userId },
    skip: !patient?.userId
  });
  
  const [updateRequiredInfo, { loading: updateLoading }] = useMutation(UPDATE_REQUIRED_INFO, {
    onCompleted: () => {
      setSuccessMessage('Required information updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    },
    onError: (error) => {
      setErrorMessage(`Error updating required information: ${error.message}`);
      setTimeout(() => setErrorMessage(''), 5000);
    }
  });
  
  useEffect(() => {
    if (patient?.dailyInfoRequired) {
      setFormState({
        pulseRate: patient.dailyInfoRequired.pulseRate,
        bloodPressure: patient.dailyInfoRequired.bloodPressure,
        weight: patient.dailyInfoRequired.weight,
        temperature: patient.dailyInfoRequired.temperature,
        respiratoryRate: patient.dailyInfoRequired.respiratoryRate
      });
    }
  }, [patient]);
  
  const handleChange = (e) => {
    const { name, checked } = e.target;
    setFormState(prev => ({
      ...prev,
      [name]: checked
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await updateRequiredInfo({
        variables: {
          patientId: id,
          ...formState
        }
      });
    } catch (error) {
      console.error('Error updating required info:', error);
    }
  };
  
  const loading = patientLoading || userLoading;
  
  if (loading) {
    return <Container><p>Loading patient data...</p></Container>;
  }
  
  if (!patient) {
    return (
      <Container>
        <Alert variant="danger">
          Patient not found or you don't have permission to modify this patient.
        </Alert>
        <Link to="/patients" className="btn btn-primary">Back to Patients</Link>
      </Container>
    );
  }

  return (
    <Container>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Manage Required Information</h1>
        <Link to={`/patients/${id}`} className="btn btn-outline-primary">Back to Patient</Link>
      </div>
      
      <Card className="shadow-sm">
        <Card.Body>
          <Card.Title>Required Daily Information for {userData?.user?.userName || 'Patient'}</Card.Title>
          <Card.Subtitle className="mb-4 text-muted">
            Select the information that the patient needs to provide on a daily basis
          </Card.Subtitle>
          
          {successMessage && <Alert variant="success">{successMessage}</Alert>}
          {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
          
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Check 
                type="switch"
                id="pulseRate"
                name="pulseRate"
                label="Pulse Rate"
                checked={formState.pulseRate}
                onChange={handleChange}
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Check 
                type="switch"
                id="bloodPressure"
                name="bloodPressure"
                label="Blood Pressure"
                checked={formState.bloodPressure}
                onChange={handleChange}
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Check 
                type="switch"
                id="weight"
                name="weight"
                label="Weight"
                checked={formState.weight}
                onChange={handleChange}
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Check 
                type="switch"
                id="temperature"
                name="temperature"
                label="Temperature"
                checked={formState.temperature}
                onChange={handleChange}
              />
            </Form.Group>
            
            <Form.Group className="mb-4">
              <Form.Check 
                type="switch"
                id="respiratoryRate"
                name="respiratoryRate"
                label="Respiratory Rate"
                checked={formState.respiratoryRate}
                onChange={handleChange}
              />
            </Form.Group>
            
            <div className="d-grid">
              <Button variant="primary" type="submit" disabled={updateLoading}>
                {updateLoading ? 'Updating...' : 'Update Required Information'}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ManageRequiredInfo; 