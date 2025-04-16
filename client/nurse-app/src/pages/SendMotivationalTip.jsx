import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';
import { useQuery, useMutation, gql } from '@apollo/client';
import formatDate from '../util/formatDate';
const GET_PATIENT = gql`
  query GetPatient($id: ID!) {
    patientDataByUserId(userId: $id) {
      id
      user
    }
  }
`;

const GET_USER = gql`
  query GetUser($id: ID!) {
    userById(id: $id) {
      id
      userName
    }
  }
`;

const GET_MOTIVATIONAL_TIPS = gql`
  query GetMotivationalTips($patientId: ID!) {
    motivationalTips(patientId: $patientId) {
      id
      content
      createdAt
    }
  }
`;

const ADD_MOTIVATIONAL_TIP = gql`
  mutation AddMotivationalTip($patientId: ID!, $content: String!) {
    addMotivationalTip(patientId: $patientId, content: $content) {
      id
      content
      createdAt
    }
  }
`;

const SendMotivationalTip = () => {
  const { id: patientId } = useParams();
  
  const [tipContent, setTipContent] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  const { data: patientData, loading: patientLoading } = useQuery(GET_PATIENT, {
    variables: { id: patientId },
    skip: !patientId
  });
  
  const patient = patientData?.patientDataByUserId;
  
  const { data: userData, loading: userLoading } = useQuery(GET_USER, {
    variables: { id: patient?.user },
    skip: !patient?.user
  });
  
  const { data: tipsData, loading: tipsLoading, refetch } = useQuery(GET_MOTIVATIONAL_TIPS, {
    variables: { patientId },
    skip: !patientId
  });
  
  const [addMotivationalTip, { loading: addingTip }] = useMutation(ADD_MOTIVATIONAL_TIP, {
    onCompleted: () => {
      setTipContent('');
      setSuccessMessage('Motivational tip sent successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      refetch();
    },
    onError: (error) => {
      setErrorMessage(`Error sending tip: ${error.message}`);
      setTimeout(() => setErrorMessage(''), 5000);
    }
  });
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!tipContent.trim()) {
      setErrorMessage('Please enter a tip content');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }
    
    try {
      await addMotivationalTip({
        variables: {
          patientId,
          content: tipContent
        }
      });
    } catch (error) {
      console.error('Error sending motivational tip:', error);
    }
  };
  
  const loading = patientLoading || userLoading || tipsLoading;
  const tips = tipsData?.motivationalTips || [];
  


  if (loading && !tips.length) {
    return <Container><p>Loading...</p></Container>;
  }
  
  if (!patient) {
    return (
      <Container>
        <Alert variant="danger">
          Patient not found or you don't have permission to view this patient.
        </Alert>
        <Link to="/patients" className="btn btn-primary">Back to Patients</Link>
      </Container>
    );
  }

  return (
    <Container>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Send Motivational Tips</h1>
        <Link to={`/patients/${patientId}`} className="btn btn-outline-primary">Back to Patient</Link>
      </div>
      
      <Card className="shadow-sm mb-4">
        <Card.Body>
          <Card.Title>Send a tip to {userData?.userById?.userName || 'Patient'}</Card.Title>
          
          {successMessage && <Alert variant="success">{successMessage}</Alert>}
          {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
          
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Motivational Tip Content</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={tipContent}
                onChange={(e) => setTipContent(e.target.value)}
                placeholder="Enter your motivational tip here..."
                required
              />
            </Form.Group>
            
            <div className="d-grid">
              <Button variant="success" type="submit" disabled={addingTip}>
                {addingTip ? 'Sending...' : 'Send Tip'}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
      
      <Card className="shadow-sm">
        <Card.Body>
          <Card.Title className="mb-3">Previous Tips</Card.Title>
          
          {tips.length > 0 ? (
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {[...tips].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map(tip => (
                <Card key={tip.id} className="mb-2" border="success">
                  <Card.Subtitle className="mb-2 text-muted">{formatDate(tip.createdAt)}</Card.Subtitle>
                  <Card.Text>{tip.content}</Card.Text>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center my-4">No motivational tips sent yet</p>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default SendMotivationalTip; 