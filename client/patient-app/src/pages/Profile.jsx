import { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Alert, Row, Col } from 'react-bootstrap';
import { useMutation, useQuery, gql } from '@apollo/client';

const GET_USER_DATA = gql`
  query GetUserData($userId: ID!) {
    user(id: $userId) {
      id
      firstName
      lastName
      email
      phoneNumber
    }
    patientByUserId(userId: $userId) {
      id
      dateOfBirth
      gender
      address
      emergencyContact {
        name
        relationship
        phoneNumber
      }
      medicalHistory
      allergies
      medications
    }
  }
`;

const UPDATE_USER = gql`
  mutation UpdateUser($id: ID!, $firstName: String!, $lastName: String!, $email: String!, $phoneNumber: String) {
    updateUser(id: $id, firstName: $firstName, lastName: $lastName, email: $email, phoneNumber: $phoneNumber) {
      id
      firstName
      lastName
      email
      phoneNumber
    }
  }
`;

const UPDATE_PATIENT_PROFILE = gql`
  mutation UpdatePatientProfile(
    $id: ID!,
    $dateOfBirth: String,
    $gender: String,
    $address: String,
    $emergencyContactName: String,
    $emergencyContactRelationship: String,
    $emergencyContactPhone: String,
    $medicalHistory: [String],
    $allergies: [String],
    $medications: [String]
  ) {
    updatePatient(
      id: $id,
      dateOfBirth: $dateOfBirth,
      gender: $gender,
      address: $address,
      emergencyContactName: $emergencyContactName,
      emergencyContactRelationship: $emergencyContactRelationship,
      emergencyContactPhone: $emergencyContactPhone,
      medicalHistory: $medicalHistory,
      allergies: $allergies,
      medications: $medications
    ) {
      id
    }
  }
`;

const Profile = () => {
  const userId = localStorage.getItem('userId');
  const [patientId, setPatientId] = useState(null);
  
  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const [address, setAddress] = useState('');
  
  // Emergency Contact
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyRelationship, setEmergencyRelationship] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  
  // Medical Information
  const [medicalHistoryText, setMedicalHistoryText] = useState('');
  const [allergiesText, setAllergiesText] = useState('');
  const [medicationsText, setMedicationsText] = useState('');
  
  // UI States
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [editMode, setEditMode] = useState(false);
  
  const { data, loading, refetch } = useQuery(GET_USER_DATA, {
    variables: { userId },
    skip: !userId,
    fetchPolicy: 'network-only'
  });
  
  const [updateUser, { loading: updatingUser }] = useMutation(UPDATE_USER, {
    onError: (error) => {
      setErrorMessage(`Error updating user: ${error.message}`);
    }
  });
  
  const [updatePatient, { loading: updatingPatient }] = useMutation(UPDATE_PATIENT_PROFILE, {
    onError: (error) => {
      setErrorMessage(`Error updating profile: ${error.message}`);
    }
  });
  
  // Initialize form with data
  useEffect(() => {
    if (data) {
      const { user, patientByUserId } = data;
      
      // User data
      if (user) {
        setFirstName(user.firstName || '');
        setLastName(user.lastName || '');
        setEmail(user.email || '');
        setPhoneNumber(user.phoneNumber || '');
      }
      
      // Patient data
      if (patientByUserId) {
        setPatientId(patientByUserId.id);
        setDateOfBirth(patientByUserId.dateOfBirth || '');
        setGender(patientByUserId.gender || '');
        setAddress(patientByUserId.address || '');
        
        // Emergency contact
        if (patientByUserId.emergencyContact) {
          setEmergencyName(patientByUserId.emergencyContact.name || '');
          setEmergencyRelationship(patientByUserId.emergencyContact.relationship || '');
          setEmergencyPhone(patientByUserId.emergencyContact.phoneNumber || '');
        }
        
        // Medical info
        setMedicalHistoryText((patientByUserId.medicalHistory || []).join('\n'));
        setAllergiesText((patientByUserId.allergies || []).join('\n'));
        setMedicationsText((patientByUserId.medications || []).join('\n'));
      }
    }
  }, [data]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    
    try {
      // Update user info
      await updateUser({
        variables: {
          id: userId,
          firstName,
          lastName,
          email,
          phoneNumber: phoneNumber || null
        }
      });
      
      // Process array fields
      const medicalHistory = medicalHistoryText
        .split('\n')
        .map(item => item.trim())
        .filter(item => item.length > 0);
        
      const allergies = allergiesText
        .split('\n')
        .map(item => item.trim())
        .filter(item => item.length > 0);
        
      const medications = medicationsText
        .split('\n')
        .map(item => item.trim())
        .filter(item => item.length > 0);
      
      // Update patient info
      await updatePatient({
        variables: {
          id: patientId,
          dateOfBirth: dateOfBirth || null,
          gender: gender || null,
          address: address || null,
          emergencyContactName: emergencyName || null,
          emergencyContactRelationship: emergencyRelationship || null,
          emergencyContactPhone: emergencyPhone || null,
          medicalHistory,
          allergies,
          medications
        }
      });
      
      setSuccessMessage('Profile updated successfully!');
      setEditMode(false);
      refetch();
      
      // Clear success message after a few seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setErrorMessage('An error occurred while updating profile.');
    }
  };
  
  if (loading) {
    return <Container className="mt-4"><p>Loading your profile...</p></Container>;
  }
  
  return (
    <Container className="my-4">
      <h1 className="mb-4">My Profile</h1>
      
      {successMessage && <Alert variant="success">{successMessage}</Alert>}
      {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
      
      {!editMode ? (
        <div>
          <Card className="shadow-sm mb-4">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <Card.Title>Personal Information</Card.Title>
                <Button variant="outline-primary" onClick={() => setEditMode(true)}>
                  Edit Profile
                </Button>
              </div>
              
              <Row className="mb-3">
                <Col md={6}>
                  <p className="mb-1"><strong>Name:</strong> {firstName} {lastName}</p>
                  <p className="mb-1"><strong>Email:</strong> {email}</p>
                  <p className="mb-1"><strong>Phone:</strong> {phoneNumber || 'Not provided'}</p>
                </Col>
                <Col md={6}>
                  <p className="mb-1"><strong>Date of Birth:</strong> {dateOfBirth || 'Not provided'}</p>
                  <p className="mb-1"><strong>Gender:</strong> {gender || 'Not provided'}</p>
                  <p className="mb-1"><strong>Address:</strong> {address || 'Not provided'}</p>
                </Col>
              </Row>
            </Card.Body>
          </Card>
          
          <Card className="shadow-sm mb-4">
            <Card.Body>
              <Card.Title className="mb-3">Emergency Contact</Card.Title>
              <p className="mb-1"><strong>Name:</strong> {emergencyName || 'Not provided'}</p>
              <p className="mb-1"><strong>Relationship:</strong> {emergencyRelationship || 'Not provided'}</p>
              <p className="mb-1"><strong>Phone:</strong> {emergencyPhone || 'Not provided'}</p>
            </Card.Body>
          </Card>
          
          <Card className="shadow-sm mb-4">
            <Card.Body>
              <Card.Title className="mb-3">Medical Information</Card.Title>
              
              <h6 className="mt-3">Medical History</h6>
              {medicalHistoryText ? (
                <ul>
                  {medicalHistoryText.split('\n').map((item, i) => (
                    item.trim() && <li key={i}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p>No medical history provided</p>
              )}
              
              <h6 className="mt-3">Allergies</h6>
              {allergiesText ? (
                <ul>
                  {allergiesText.split('\n').map((item, i) => (
                    item.trim() && <li key={i}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p>No allergies provided</p>
              )}
              
              <h6 className="mt-3">Medications</h6>
              {medicationsText ? (
                <ul>
                  {medicationsText.split('\n').map((item, i) => (
                    item.trim() && <li key={i}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p>No medications provided</p>
              )}
            </Card.Body>
          </Card>
        </div>
      ) : (
        <Form onSubmit={handleSubmit}>
          <Card className="shadow-sm mb-4">
            <Card.Body>
              <Card.Title className="mb-3">Personal Information</Card.Title>
              
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>First Name</Form.Label>
                    <Form.Control
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Last Name</Form.Label>
                    <Form.Control
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>
              
              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Phone Number</Form.Label>
                <Form.Control
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </Form.Group>
              
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Date of Birth</Form.Label>
                    <Form.Control
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Gender</Form.Label>
                    <Form.Select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Non-binary">Non-binary</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
              
              <Form.Group className="mb-3">
                <Form.Label>Address</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </Form.Group>
            </Card.Body>
          </Card>
          
          <Card className="shadow-sm mb-4">
            <Card.Body>
              <Card.Title className="mb-3">Emergency Contact</Card.Title>
              
              <Form.Group className="mb-3">
                <Form.Label>Name</Form.Label>
                <Form.Control
                  type="text"
                  value={emergencyName}
                  onChange={(e) => setEmergencyName(e.target.value)}
                />
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Relationship</Form.Label>
                <Form.Control
                  type="text"
                  value={emergencyRelationship}
                  onChange={(e) => setEmergencyRelationship(e.target.value)}
                />
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Phone Number</Form.Label>
                <Form.Control
                  type="tel"
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                />
              </Form.Group>
            </Card.Body>
          </Card>
          
          <Card className="shadow-sm mb-4">
            <Card.Body>
              <Card.Title className="mb-3">Medical Information</Card.Title>
              <p className="text-muted small">Enter each item on a new line</p>
              
              <Form.Group className="mb-3">
                <Form.Label>Medical History</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  value={medicalHistoryText}
                  onChange={(e) => setMedicalHistoryText(e.target.value)}
                  placeholder="Enter each medical condition on a new line"
                />
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Allergies</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={allergiesText}
                  onChange={(e) => setAllergiesText(e.target.value)}
                  placeholder="Enter each allergy on a new line"
                />
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Medications</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={medicationsText}
                  onChange={(e) => setMedicationsText(e.target.value)}
                  placeholder="Enter each medication on a new line"
                />
              </Form.Group>
            </Card.Body>
          </Card>
          
          <div className="d-flex justify-content-between mb-4">
            <Button variant="secondary" onClick={() => setEditMode(false)}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              type="submit" 
              disabled={updatingUser || updatingPatient}
            >
              {updatingUser || updatingPatient ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </Form>
      )}
    </Container>
  );
};

export default Profile; 