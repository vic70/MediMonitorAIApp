import { useState } from 'react';
import { Container, Card, Alert, ListGroup, Badge } from 'react-bootstrap';
import { useQuery, gql } from '@apollo/client';

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
      createdBy {
        id
        firstName
        lastName
        role
      }
      category
    }
  }
`;

const MotivationalTips = () => {
  const userId = localStorage.getItem('userId');
  const [patientId, setPatientId] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Get patient ID from user ID
  const { loading: loadingPatient } = useQuery(GET_PATIENT_DATA, {
    variables: { userId },
    skip: !userId,
    onCompleted: (data) => {
      if (data?.patientByUserId?.id) {
        setPatientId(data.patientByUserId.id);
      }
    },
    onError: (error) => {
      console.error('Error fetching patient ID:', error);
    }
  });
  
  // Get motivational tips
  const { data, loading } = useQuery(GET_MOTIVATIONAL_TIPS, {
    variables: { patientId },
    skip: !patientId,
    fetchPolicy: 'network-only'
  });
  
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    try {
      // Handle unix timestamp in milliseconds
      const date = new Date(parseInt(dateString));
      return date.toLocaleString();
    } catch (error) {
      console.error("Error formatting date:", error);
      return dateString;
    }
  };

  
  // Get all tips or filter by category
  const getTips = () => {
    if (!data?.motivationalTips) return [];
    
    const tips = [...data.motivationalTips];
    
    // Sort by date - newest first
    tips.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Filter by category if needed
    if (selectedCategory !== 'all') {
      return tips.filter(tip => tip.category === selectedCategory);
    }
    
    return tips;
  };
  
  // Get unique categories for filter
  const getCategories = () => {
    if (!data?.motivationalTips) return [];
    
    const categories = new Set();
    data.motivationalTips.forEach(tip => {
      if (tip.category) {
        categories.add(tip.category);
      }
    });
    
    return Array.from(categories);
  };
  
  // Get category badge color
  const getCategoryColor = (category) => {
    switch (category?.toLowerCase()) {
      case 'exercise':
        return 'success';
      case 'nutrition':
        return 'warning';
      case 'mental health':
        return 'info';
      case 'medication':
        return 'primary';
      default:
        return 'secondary';
    }
  };
  
  const filteredTips = getTips();
  const categories = getCategories();

  return (
    <Container className="my-4">
      <h1 className="mb-4">Motivational Tips</h1>
      
      {loading || loadingPatient ? (
        <p>Loading motivational tips...</p>
      ) : (
        <>
          {/* Category filters */}
          {categories.length > 0 && (
            <div className="d-flex flex-wrap gap-2 mb-4">
              <Badge 
                bg={selectedCategory === 'all' ? 'dark' : 'light'} 
                text={selectedCategory === 'all' ? 'white' : 'dark'}
                className="px-3 py-2 me-2" 
                style={{ cursor: 'pointer' }}
                onClick={() => setSelectedCategory('all')}
              >
                All Tips
              </Badge>
              
              {categories.map(category => (
                <Badge 
                  key={category}
                  bg={selectedCategory === category ? getCategoryColor(category) : 'light'} 
                  text={selectedCategory === category ? 'white' : 'dark'}
                  className="px-3 py-2 me-2" 
                  style={{ cursor: 'pointer' }}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </Badge>
              ))}
            </div>
          )}
          
          {filteredTips.length > 0 ? (
            <div className="mb-4">
              {filteredTips.map(tip => (
                <Card key={tip.id} className="mb-3 shadow-sm">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <small className="text-muted">
                          {formatDate(tip.createdAt)}
                        </small>
                        {tip.category && (
                          <Badge 
                            bg={getCategoryColor(tip.category)} 
                            className="ms-2"
                          >
                            {tip.category}
                          </Badge>
                        )}
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
              {selectedCategory === 'all' 
                ? "You don't have any motivational tips yet." 
                : `No tips found in the '${selectedCategory}' category.`}
            </Alert>
          )}
        </>
      )}
    </Container>
  );
};

export default MotivationalTips; 