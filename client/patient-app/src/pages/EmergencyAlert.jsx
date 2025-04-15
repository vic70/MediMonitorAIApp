import { useState } from 'react';
import { useMutation, gql } from '@apollo/client';
import { Form, Button, Alert } from 'react-bootstrap';

const CREATE_EMERGENCY_ALERT = gql`
  mutation CreateEmergencyAlert($patientId: ID!, $description: String!) {
    createEmergencyAlert(patientId: $patientId, description: $description) {
      id
      description
      createdAt
    }
  }
`;

const EmergencyAlert = ({ patientId }) => {
  const [description, setDescription] = useState("");
  const [createAlert, { loading, error }] = useMutation(CREATE_EMERGENCY_ALERT);

  const handleSubmit = (e) => {
    e.preventDefault();
    createAlert({ variables: { patientId, description } });
    setDescription("");
  };

  return (
    <Form onSubmit={handleSubmit}>
      {error && <Alert variant="danger">Error sending alert: {error.message}</Alert>}
      <Form.Group controlId="emergencyDescription">
        <Form.Label>Describe Your Emergency</Form.Label>
        <Form.Control
          as="textarea"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </Form.Group>
      <Button variant="danger" type="submit" disabled={loading}>
        {loading ? 'Sending...' : 'Send Alert'}
      </Button>
    </Form>
  );
};

export default EmergencyAlert;