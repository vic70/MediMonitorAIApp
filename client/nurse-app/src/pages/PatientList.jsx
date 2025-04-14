import { useState } from 'react';
import { Container, Table, Button, Badge, Form, InputGroup, Row, Col, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, gql } from '@apollo/client';

// Updated to use nurseData queries
const GET_NURSE_DATA = gql`
  query GetNurseData($userId: ID!) {
    nurseData(userId: $userId) {
      id
      userId
      assignedPatients
    }
  }
`;

// Updated to use patientData queries
const GET_PATIENTS_DATA = gql`
  query GetPatientsData {
    patientsData {
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
      firstName
      lastName
      email
      role
    }
  }
`;

// Updated to use assignPatientToNurse without nurseId parameter
const ASSIGN_PATIENT = gql`
  mutation AssignPatientToNurse($patientId: ID!) {
    assignPatientToNurse(patientId: $patientId) {
      id
      assignedPatients
    }
  }
`;

// New mutation to unassign a patient
const UNASSIGN_PATIENT = gql`
  mutation UnassignPatientFromNurse($patientId: ID!) {
    unassignPatientFromNurse(patientId: $patientId) {
      id
      assignedPatients
    }
  }
`;

const PatientList = () => {
  const userId = localStorage.getItem('userId');
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyAssigned, setShowOnlyAssigned] = useState(false);
  
  // Get nurse data to find assigned patients
  const { data: nurseData, loading: nurseLoading, refetch: refetchNurse } = useQuery(GET_NURSE_DATA, {
    variables: { userId },
    skip: !userId,
    fetchPolicy: 'network-only'
  });
  
  // Get all patients
  const { data: patientsData, loading: patientsLoading } = useQuery(GET_PATIENTS_DATA, {
    fetchPolicy: 'network-only'
  });
  
  // Get user data for all users
  const { data: usersData, loading: usersLoading } = useQuery(GET_USERS);
  
  // Mutation to assign a patient to the nurse
  const [assignPatient, { loading: assigning }] = useMutation(ASSIGN_PATIENT, {
    onCompleted: () => {
      refetchNurse();
    },
    onError: (error) => {
      console.error('Error assigning patient:', error);
    }
  });
  
  // Mutation to unassign a patient from the nurse
  const [unassignPatient, { loading: unassigning }] = useMutation(UNASSIGN_PATIENT, {
    onCompleted: () => {
      refetchNurse();
    },
    onError: (error) => {
      console.error('Error unassigning patient:', error);
    }
  });
  
  // Handle assigning a patient
  const handleAssign = (patientId) => {
    assignPatient({
      variables: { patientId }
    });
  };
  
  // Handle unassigning a patient
  const handleUnassign = (patientId) => {
    unassignPatient({
      variables: { patientId }
    });
  };
  
  // Filter patients based on search term and assigned status
  const getFilteredPatients = () => {
    if (!patientsData?.patientsData || !usersData?.users) return [];
    
    const assignedPatientIds = nurseData?.nurseData?.assignedPatients || [];
    
    return patientsData.patientsData
      .filter(patientData => {
        const user = usersData.users.find(u => u.id === patientData.userId);
        if (!user) return false;
        
        // Filter by assigned status if the option is enabled
        if (showOnlyAssigned && !assignedPatientIds.includes(patientData.userId)) {
          return false;
        }
        
        // Filter by search term
        const searchLower = searchTerm.toLowerCase();
        return (
          user.userName.toLowerCase().includes(searchLower) || 
          (user.firstName && user.firstName.toLowerCase().includes(searchLower)) ||
          (user.lastName && user.lastName.toLowerCase().includes(searchLower)) ||
          user.email.toLowerCase().includes(searchLower)
        );
      })
      .map(patientData => {
        const user = usersData.users.find(u => u.id === patientData.userId);
        return {
          ...patientData,
          userName: user?.userName || 'Unknown',
          firstName: user?.firstName || '',
          lastName: user?.lastName || '',
          fullName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Unknown',
          email: user?.email || '',
          isAssigned: assignedPatientIds.includes(patientData.userId)
        };
      });
  };
  
  const filteredPatients = getFilteredPatients();
  const isLoading = nurseLoading || patientsLoading || usersLoading;
  
  return (
    <Container>
      <h2 className="mb-4">My Patients</h2>
      
      <Card className="mb-4">
        <Card.Body>
          <Row className="align-items-center">
            <Col lg={6}>
              <InputGroup>
                <Form.Control
                  placeholder="Search patients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <Button 
                    variant="outline-secondary"
                    onClick={() => setSearchTerm('')}
                  >
                    Clear
                  </Button>
                )}
              </InputGroup>
            </Col>
            <Col lg={6} className="mt-3 mt-lg-0 d-flex justify-content-lg-end">
              <Form.Check
                type="switch"
                id="show-assigned"
                label="Show only my patients"
                checked={showOnlyAssigned}
                onChange={(e) => setShowOnlyAssigned(e.target.checked)}
              />
            </Col>
          </Row>
        </Card.Body>
      </Card>
      
      {isLoading ? (
        <p>Loading patients...</p>
      ) : filteredPatients.length > 0 ? (
        <div className="table-responsive">
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.map(patient => (
                <tr key={patient.id}>
                  <td>{patient.fullName}</td>
                  <td>{patient.email}</td>
                  <td>
                    {patient.isAssigned ? (
                      <Badge bg="success">Assigned to you</Badge>
                    ) : (
                      <Badge bg="secondary">Not assigned</Badge>
                    )}
                  </td>
                  <td>
                    <div className="d-flex gap-2">
                      <Link to={`/patients/${patient.userId}`}>
                        <Button size="sm" variant="primary">View</Button>
                      </Link>
                      
                      {patient.isAssigned ? (
                        <Button 
                          size="sm" 
                          variant="outline-danger"
                          onClick={() => handleUnassign(patient.userId)}
                          disabled={unassigning}
                        >
                          Unassign
                        </Button>
                      ) : (
                        <Button 
                          size="sm" 
                          variant="outline-success"
                          onClick={() => handleAssign(patient.userId)}
                          disabled={assigning}
                        >
                          Assign
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      ) : (
        <Card className="text-center p-4">
          <Card.Body>
            <Card.Title>No patients found</Card.Title>
            <Card.Text>
              {searchTerm 
                ? "No patients match your search criteria." 
                : showOnlyAssigned 
                  ? "You don't have any patients assigned to you yet." 
                  : "There are no patients in the system yet."}
            </Card.Text>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default PatientList; 