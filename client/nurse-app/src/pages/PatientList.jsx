import { useState } from 'react';
import { Container, Table, Button, Badge, Form, InputGroup, Row, Col, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useQuery, gql } from '@apollo/client';

const GET_PATIENTS_DATA = gql`
  query GetPatientsData {
    patientsData {
      id
      user
      dailyInfoRequired {
        pulseRate
        bloodPressure
        weight
        temperature
        respiratoryRate
      }
      createdAt
      updatedAt
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

const PatientList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Get all patients
  const { data: patientsData, loading: patientsLoading } = useQuery(GET_PATIENTS_DATA, {
    fetchPolicy: 'network-only'
  });
  
  // Get user data for all users
  const { data: usersData, loading: usersLoading } = useQuery(GET_USERS);
  
  // Filter patients based on search term
  const getFilteredPatients = () => {
    if (!patientsData?.patientsData || !usersData?.users) return [];
    
    return patientsData.patientsData
      .filter(patient => {
        const user = usersData.users.find(u => u.id === patient.user);
        if (!user) return false;
        
        // Filter by search term
        const searchLower = searchTerm.toLowerCase();
        return (
          user.userName.toLowerCase().includes(searchLower) || 
          user.email.toLowerCase().includes(searchLower)
        );
      })
      .map(patient => {
        const user = usersData.users.find(u => u.id === patient.user);
        return {
          ...patient,
          userName: user?.userName || 'Unknown',
          email: user?.email || ''
        };
      });
  };
  
  const filteredPatients = getFilteredPatients();
  const isLoading = patientsLoading || usersLoading;
  
  return (
    <Container>
      <h2 className="mb-4">Patients</h2>
      
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
                <th>Username</th>
                <th>Email</th>
                <th>Required Daily Info</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.map(patient => (
                <tr key={patient.id}>
                  <td>{patient.userName}</td>
                  <td>{patient.email}</td>
                  <td>
                    <div className="d-flex flex-wrap gap-1">
                      {patient.dailyInfoRequired.pulseRate && <Badge bg="info">Pulse Rate</Badge>}
                      {patient.dailyInfoRequired.bloodPressure && <Badge bg="info">Blood Pressure</Badge>}
                      {patient.dailyInfoRequired.weight && <Badge bg="info">Weight</Badge>}
                      {patient.dailyInfoRequired.temperature && <Badge bg="info">Temperature</Badge>}
                      {patient.dailyInfoRequired.respiratoryRate && <Badge bg="info">Respiratory Rate</Badge>}
                    </div>
                  </td>
                  <td>
                    <div className="d-flex gap-2">
                      <Link to={`/patients/${patient.user}`}>
                        <Button size="sm" variant="primary">View</Button>
                      </Link>
                      <Link to={`/patients/${patient.user}/required-info`}>
                        <Button size="sm" variant="outline-primary">Required Info</Button>
                      </Link>
                      <Link to={`/patients/${patient.user}/tips`}>
                        <Button size="sm" variant="outline-success">Send Tip</Button>
                      </Link>
                      <Link to={`/patients/${patient.user}/conditions`}>
                        <Button size="sm" variant="outline-warning">COVID Risk</Button>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      ) : (
        <Card>
          <Card.Body className="text-center py-5">
            <Card.Title>No patients found</Card.Title>
            <Card.Text>
              {searchTerm ? 'Try adjusting your search terms.' : 'There are no patients in the system yet.'}
            </Card.Text>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default PatientList; 