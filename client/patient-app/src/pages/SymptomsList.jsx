import { useState } from 'react';
import { Container, Card, Form, Button, Alert, ListGroup, Badge } from 'react-bootstrap';
import { useMutation, useQuery, gql } from '@apollo/client';

const GET_PATIENT_SYMPTOMS = gql`
  query GetPatientSymptoms($patientId: ID!) {
    symptomsByPatientId(patientId: $patientId) {
      id
      date
      symptoms
      notes
    }
  }
`;

const REPORT_SYMPTOMS = gql`
  mutation ReportSymptoms($patientId: ID!, $symptoms: [String]!, $notes: String) {
    reportSymptoms(patientId: $patientId, symptoms: $symptoms, notes: $notes) {
      id
    }
  }
`;

// Common symptoms
const SYMPTOM_OPTIONS = [
  'Fever', 'Cough', 'Shortness of Breath', 'Fatigue', 'Headache',
  'Sore Throat', 'Runny Nose', 'Muscle Pain', 'Nausea', 'Vomiting',
  'Diarrhea', 'Loss of Taste', 'Loss of Smell', 'Chest Pain', 'Rash'
];

const SymptomsList = ({ patientId }) => {
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [notes, setNotes] = useState('');
  const [customSymptom, setCustomSymptom] = useState('');
  const [reportSymptoms, { loading: submitting, error }] = useMutation(REPORT_SYMPTOMS);
  const { data, loading } = useQuery(GET_PATIENT_SYMPTOMS, { variables: { patientId } });

  const handleSymptomToggle = (symptom) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptom) ? prev.filter((s) => s !== symptom) : [...prev, symptom]
    );
  };

  const handleAddCustomSymptom = () => {
    if (customSymptom.trim() && !selectedSymptoms.includes(customSymptom.trim())) {
      setSelectedSymptoms([...selectedSymptoms, customSymptom.trim()]);
      setCustomSymptom('');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedSymptoms.length === 0) return;
    reportSymptoms({ variables: { patientId, symptoms: selectedSymptoms, notes } });
  };

  return (
    <Container>
      <h2>Symptom Tracker</h2>
      <Card className="mb-4">
        <Card.Body>
          {error && <Alert variant="danger">Error reporting symptoms: {error.message}</Alert>}
          <Form onSubmit={handleSubmit}>
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
            <Form.Group className="mt-3">
              <Form.Label>Other Symptoms</Form.Label>
              <div className="d-flex">
                <Form.Control
                  type="text"
                  value={customSymptom}
                  onChange={(e) => setCustomSymptom(e.target.value)}
                  placeholder="Enter custom symptom"
                />
                <Button variant="outline-primary" onClick={handleAddCustomSymptom}>
                  Add
                </Button>
              </div>
            </Form.Group>
            <Form.Group className="mt-3">
              <Form.Label>Notes</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional details..."
              />
            </Form.Group>
            <Button variant="danger" type="submit" disabled={submitting}>
              {submitting ? 'Reporting...' : 'Report Symptoms'}
            </Button>
          </Form>
        </Card.Body>
      </Card>

      <Card>
        <Card.Body>
          <Card.Title>Previous Reports</Card.Title>
          {loading ? (
            <p>Loading...</p>
          ) : data?.symptomsByPatientId?.length > 0 ? (
            <ListGroup>
              {data.symptomsByPatientId.map((report) => (
                <ListGroup.Item key={report.id}>
                  <strong>{new Date(report.date).toLocaleDateString()}</strong>
                  <p>Symptoms: {report.symptoms.join(', ')}</p>
                  {report.notes && <p>Notes: {report.notes}</p>}
                </ListGroup.Item>
              ))}
            </ListGroup>
          ) : (
            <p>No previous symptom reports.</p>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default SymptomsList;