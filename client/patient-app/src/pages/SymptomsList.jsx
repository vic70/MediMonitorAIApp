import { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Alert, ListGroup, Badge } from 'react-bootstrap';
import { useMutation, useQuery, gql } from '@apollo/client';
import { jwtDecode } from 'jwt-decode';

const GET_PATIENT_SYMPTOMS = gql`
  query GetPatientSymptoms($patientId: ID!) {
    patientSymptoms(patientId: $patientId) {
      breathingProblem
      fever
      dryCough
      soreThroat
      runningNose
      asthma
      chronicLungDisease
      headache
      heartDisease
      diabetes
      hyperTension
      fatigue
      gastrointestinal
      abroadTravel
      contactWithCovidPatient
      attendedLargeGathering
      visitedPublicExposedPlaces
      familyWorkingInPublicExposedPlaces
      wearingMasks
      sanitizationFromMarket
    }
  }
`;

const ADD_SYMPTOM = gql`
  mutation AddSymptom($symptoms: SymptomsInput!) {
    addSymptom(symptoms: $symptoms) {
      breathingProblem
      fever
      dryCough
      soreThroat
      runningNose
      asthma
      chronicLungDisease
      headache
      heartDisease
      diabetes
      hyperTension
      fatigue
      gastrointestinal
      abroadTravel
      contactWithCovidPatient
      attendedLargeGathering
      visitedPublicExposedPlaces
      familyWorkingInPublicExposedPlaces
      wearingMasks
      sanitizationFromMarket
    }
  }
`;

// Mapping between display names and schema fields
const SYMPTOM_MAPPING = {
  'Shortness of Breath': 'breathingProblem',
  'Fever': 'fever',
  'Cough': 'dryCough',
  'Sore Throat': 'soreThroat',
  'Runny Nose': 'runningNose',
  'Asthma': 'asthma',
  'Chronic Lung Disease': 'chronicLungDisease',
  'Headache': 'headache',
  'Heart Disease': 'heartDisease',
  'Diabetes': 'diabetes',
  'Hypertension': 'hyperTension',
  'Fatigue': 'fatigue',
  'Gastrointestinal': 'gastrointestinal',
  'Abroad Travel': 'abroadTravel',
  'Contact with COVID Patient': 'contactWithCovidPatient',
  'Attended Large Gathering': 'attendedLargeGathering',
  'Visited Public Places': 'visitedPublicExposedPlaces',
  'Family Working in Public Places': 'familyWorkingInPublicExposedPlaces',
  'Wearing Masks': 'wearingMasks',
  'Sanitization from Market': 'sanitizationFromMarket'
};

// Common symptoms (display names)
const SYMPTOM_OPTIONS = Object.keys(SYMPTOM_MAPPING);

const SymptomsList = () => {
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const token = localStorage.getItem('authToken');
  const decodedToken = token ? jwtDecode(token) : null;
  const userId = decodedToken?.id;

  const [addSymptom, { loading: submitting, error }] = useMutation(ADD_SYMPTOM);
  const { data, loading, refetch } = useQuery(GET_PATIENT_SYMPTOMS, { 
    variables: { patientId: userId },
    fetchPolicy: 'cache-and-network',
    skip: !userId
  });

  // Initialize selected symptoms from database data
  useEffect(() => {
    if (data?.patientSymptoms) {
      const activeSymptoms = [];
      
      // Loop through the database symptoms and find active ones
      Object.entries(data.patientSymptoms).forEach(([key, value]) => {
        if (value === true) {  // If the symptom is true
          // Find the display name for this database key by reversing the SYMPTOM_MAPPING
          const displayName = Object.entries(SYMPTOM_MAPPING).find(([_, dbKey]) => dbKey === key)?.[0];
          if (displayName) {
            activeSymptoms.push(displayName);
          }
        }
      });
      
      setSelectedSymptoms(activeSymptoms);
    }
  }, [data?.patientSymptoms]); // Only re-run when patientSymptoms changes

  const handleSymptomToggle = async (symptom) => {
    const updatedSymptoms = selectedSymptoms.includes(symptom)
      ? selectedSymptoms.filter((s) => s !== symptom)
      : [...selectedSymptoms, symptom];
    
    // Update local state immediately for better UX
    setSelectedSymptoms(updatedSymptoms);

    // Create symptoms input object with all symptoms initialized as false
    const symptomsInput = {};
    
    // Initialize all symptoms as false first
    Object.values(SYMPTOM_MAPPING).forEach(key => {
      symptomsInput[key] = false;
    });

    // Set selected symptoms to true
    updatedSymptoms.forEach(displayName => {
      const dbKey = SYMPTOM_MAPPING[displayName];
      if (dbKey) {
        symptomsInput[dbKey] = true;
      }
    });

    try {
      const result = await addSymptom({ 
        variables: { 
          symptoms: symptomsInput
        }
      });
      
      // Verify the mutation was successful
      if (result.data?.addSymptom) {
        // Refetch to ensure we have the latest data
        await refetch();
      }
    } catch (error) {
      console.error('Error updating symptoms:', error);
      // Revert the local state if the mutation failed
      setSelectedSymptoms(selectedSymptoms);
    }
  };

  return (
    <Container>
      <h2>Symptom Tracker</h2>
      <Card className="mb-4">
        <Card.Body>
          {error && <Alert variant="danger">Error reporting symptoms: {error.message}</Alert>}
          <Form>
            <Form.Group>
              <Form.Label>Select Symptoms</Form.Label>
              <div className="d-flex flex-wrap gap-2">
                {SYMPTOM_OPTIONS.map((symptom) => (
                  <Badge
                    key={symptom}
                    bg={selectedSymptoms.includes(symptom) ? 'danger' : 'secondary'}
                    onClick={() => handleSymptomToggle(symptom)}
                    style={{ cursor: 'pointer' }}
                  >
                    {symptom}
                  </Badge>
                ))}
              </div>
            </Form.Group>
          </Form>
        </Card.Body>
      </Card>

      <Card>
        <Card.Body>
          <Card.Title>Current Symptoms</Card.Title>
          {loading ? (
            <p>Loading...</p>
          ) : selectedSymptoms.length > 0 ? (
            <ListGroup>
              {selectedSymptoms.map((symptom) => (
                <ListGroup.Item key={symptom} className="d-flex justify-content-between align-items-center">
                  {symptom}
                  <Badge 
                    bg="danger" 
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleSymptomToggle(symptom)}
                  >
                    Remove
                  </Badge>
                </ListGroup.Item>
              ))}
            </ListGroup>
          ) : (
            <p>No symptoms selected.</p>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default SymptomsList;