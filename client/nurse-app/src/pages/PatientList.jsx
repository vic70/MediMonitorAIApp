import { useState, useEffect } from 'react';
import { Container, Table, Button, Badge, Form, InputGroup, Row, Col, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, gql } from '@apollo/client';

const GET_NURSE_DATA = gql`
  query GetNurseData($userId: ID!) {
    nurseByUserId(userId: $userId) {
      id
      patients
    }
  }
`;

const GET_PATIENTS = gql`
  query GetPatients {
    patients {
      id
      userId
      createdAt
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

const GET_USERS = gql`
  query GetUsers {
    users {
      id
      userName
      email
      role
    }
  }
`;

const ADD_PATIENT_TO_NURSE = gql`
  mutation AddPatientToNurse($nurseId: ID!, $patientId: ID!) {
    addPatientToNurse(nurseId: $nurseId, patientId: $patientId) {
      id
      patients
    }
  }
`;

const PatientList = () => {
  const userId = localStorage.getItem('userId');
  const [nurseId, setNurseId] = useState(null);
  const [myPatientIds, setMyPatientIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data: nurseData, loading: nurseLoading } = useQuery(GET_NURSE_DATA, {
    variables: { userId },
    skip: !userId,
  });
  
  const { data: patientsData, loading: patientsLoading } = useQuery(GET_PATIENTS);
  const { data: usersData, loading: usersLoading } = useQuery(GET_USERS);
  
  const [addPatientToNurse] = useMutation(ADD_PATIENT_TO_NURSE, {
    refetchQueries: [{ query: GET_NURSE_DATA, variables: { userId } }],
  });
  
  useEffect(() => {
    if (nurseData?.nurseByUserId) {
      setNurseId(nurseData.nurseByUserId.id);
      setMyPatientIds(nurseData.nurseByUserId.patients || []);
    }
  }, [nurseData]);
  
  // Function to handle adding a patient to the nurse
  const handleAddPatient = async (patientId) => {
    if (!nurseId) return;
    
    try {
      await addPatientToNurse({
        variables: {
          nurseId,
          patientId
        }
      });
    } catch (error) {
      console.error('Error adding patient:', error);
    }
  };
  
  // Combine patient data with user data for display
  const patients = patientsData?.patients || [];
  const users = usersData?.users || [];
  
  const patientsWithUserInfo = patients.map(patient => {
    const user = users.find(user => user.id === patient.userId);
    return {
      ...patient,
      userName: user?.userName || 'Unknown',
      email: user?.email || 'Unknown'
    };
  });
  
  // Filter patients based on search term
  const filteredPatients = patientsWithUserInfo.filter(patient => 
    patient.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Separate my patients from other patients
  const myPatients = filteredPatients.filter(patient => myPatientIds.includes(patient.id));
  const otherPatients = filteredPatients.filter(patient => !myPatientIds.includes(patient.id));
  
  const loading = nurseLoading || patientsLoading || usersLoading;

  return (
    <Container>
      <h1 className="mb-4">My Patients</h1>
      
      <Card className="mb-4">
        <Card.Body>
          <Form>
            <InputGroup>
              <Form.Control
                placeholder="Search patients by name or email"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Button variant="outline-secondary" onClick={() => setSearchTerm('')}>Clear</Button>
            </InputGroup>
          </Form>
        </Card.Body>
      </Card>
      
      {loading ? (
        <p>Loading patients...</p>
      ) : (
        <>
          <h3>My Assigned Patients</h3>
          {myPatients.length > 0 ? (
            <Table striped hover responsive className="mb-5">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Required Info</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {myPatients.map(patient => (
                  <tr key={patient.id}>
                    <td>{patient.userName}</td>
                    <td>{patient.email}</td>
                    <td>
                      <Row className="g-1">
                        {patient.dailyInfoRequired.pulseRate && <Col><Badge bg="info">Pulse Rate</Badge></Col>}
                        {patient.dailyInfoRequired.bloodPressure && <Col><Badge bg="info">Blood Pressure</Badge></Col>}
                        {patient.dailyInfoRequired.weight && <Col><Badge bg="info">Weight</Badge></Col>}
                        {patient.dailyInfoRequired.temperature && <Col><Badge bg="info">Temperature</Badge></Col>}
                        {patient.dailyInfoRequired.respiratoryRate && <Col><Badge bg="info">Respiratory Rate</Badge></Col>}
                      </Row>
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <Link to={`/patients/${patient.id}`} className="btn btn-sm btn-primary">View Details</Link>
                        <Link to={`/patients/${patient.id}/tips`} className="btn btn-sm btn-success">Send Tips</Link>
                        <Link to={`/patients/${patient.id}/required-info`} className="btn btn-sm btn-info">Edit Required Info</Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <p className="text-center mb-5">No assigned patients found</p>
          )}
        
          <h3>Other Patients</h3>
          {otherPatients.length > 0 ? (
            <Table striped hover responsive>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Required Info</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {otherPatients.map(patient => (
                  <tr key={patient.id}>
                    <td>{patient.userName}</td>
                    <td>{patient.email}</td>
                    <td>
                      <Row className="g-1">
                        {patient.dailyInfoRequired.pulseRate && <Col><Badge bg="info">Pulse Rate</Badge></Col>}
                        {patient.dailyInfoRequired.bloodPressure && <Col><Badge bg="info">Blood Pressure</Badge></Col>}
                        {patient.dailyInfoRequired.weight && <Col><Badge bg="info">Weight</Badge></Col>}
                        {patient.dailyInfoRequired.temperature && <Col><Badge bg="info">Temperature</Badge></Col>}
                        {patient.dailyInfoRequired.respiratoryRate && <Col><Badge bg="info">Respiratory Rate</Badge></Col>}
                      </Row>
                    </td>
                    <td>
                      <Button 
                        variant="outline-success" 
                        size="sm" 
                        onClick={() => handleAddPatient(patient.id)}
                        disabled={!nurseId}
                      >
                        Add to My Patients
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <p className="text-center">No other patients found</p>
          )}
        </>
      )}
    </Container>
  );
};

export default PatientList; 