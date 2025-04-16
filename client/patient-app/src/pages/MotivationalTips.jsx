import { Container, Card, Alert } from 'react-bootstrap';
import { useQuery, gql } from '@apollo/client';
import formatDate from '../util/formatDate';

const GET_PATIENT_DATA = gql`
  query GetPatientData($userId: ID!) {
    patientByUserId(userId: $userId) {
      id
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

const MotivationalTips = () => {
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = storedUser.id;
  console.log('MotivationalTips rendering with storedUser:', storedUser);

  console.log('MotivationalTips rendering with userId:', userId);
  
  // Get motivational tips
  const { data, loading } = useQuery(GET_MOTIVATIONAL_TIPS, {
    variables: { patientId: userId },
    skip: !userId,
    fetchPolicy: 'network-only'
  });

  console.log('MotivationalTips data:', data);
  
  // Get all tips sorted by date
  const getTips = () => {
    if (!data?.motivationalTips) return [];
    
    const tips = [...data.motivationalTips];
    
    // Sort by date - newest first
    tips.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    return tips;
  };
  
  const tips = getTips();

  return (
    <Container className="my-4">
      <h1 className="mb-4">Motivational Tips</h1>
      
      {loading  ? (
        <p>Loading motivational tips...</p>
      ) : (
        <>
          {tips.length > 0 ? (
            <div className="mb-4">
              {tips.map(tip => (
                <Card key={tip.id} className="mb-3 shadow-sm">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <small className="text-muted">
                          {formatDate(tip.createdAt)}
                        </small>
                      </div>
                      
                      {tip.createdBy && (
                        <small className="text-muted">
                          From: {tip.createdBy.firstName} {tip.createdBy.lastName} 
                          {tip.createdBy.role && ` (${tip.createdBy.role})`}
                        </small>
                      )}
                    </div>
                    
                    <Card.Text>
                      {tip.content}
                    </Card.Text>
                  </Card.Body>
                </Card>
              ))}
            </div>
          ) : (
            <Alert variant="info">
              You don't have any motivational tips yet.
            </Alert>
          )}
        </>
      )}
    </Container>
  );
};

export default MotivationalTips; 