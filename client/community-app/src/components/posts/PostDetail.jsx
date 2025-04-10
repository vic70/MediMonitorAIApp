import { useState, useEffect } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card, Button, Spinner, Alert, Badge, Row, Col, Modal } from 'react-bootstrap';

const GET_POST = gql`
  query GetPost($id: ID!) {
    post(id: $id) {
      id
      title
      content
      category
      aiSummary
      createdAt
      updatedAt
      author {
        id
        userName
      }
    }
  }
`;

const DELETE_POST = gql`
  mutation DeletePost($id: ID!) {
    deletePost(id: $id)
  }
`;

// Import the query used in PostList to refetch it after deletion
const GET_POSTS = gql`
  query GetPosts {
    posts {
      id
      title
      content
      category
      aiSummary
      createdAt
      author {
        id
        userName
      }
    }
  }
`;

const PostDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    // Get user from localStorage
    const userString = localStorage.getItem('user');
    if (userString) {
      try {
        const userData = JSON.parse(userString);
        setUser(userData);
      } catch (error) {
        console.error('Error parsing user data from localStorage:', error);
      }
    }
  }, []);

  const { loading, error, data } = useQuery(GET_POST, {
    variables: { id }
  });

  const [deletePost, { loading: deleteLoading }] = useMutation(DELETE_POST, {
    refetchQueries: [
      { query: GET_POSTS } // Refetch posts list after deletion
    ],
    onCompleted: () => {
      navigate('/posts');
    },
    onError: (error) => {
      console.error('Error deleting post:', error);
      setShowDeleteModal(false);
    }
  });

  const handleDelete = () => {
    deletePost({ variables: { id } });
  };

  if (loading) return (
    <div className="text-center my-5">
      <Spinner animation="border" role="status">
        <span className="visually-hidden">Loading...</span>
      </Spinner>
    </div>
  );

  if (error) return (
    <Alert variant="danger">
      Error loading post: {error.message}
    </Alert>
  );

  if (!user) return (
    <Alert variant="warning">
      Please log in to view this post.
    </Alert>
  );

  const post = data.post;
  
  const getCategoryBadge = (category) => {
    switch(category) {
      case 'news':
        return <Badge bg="info">News</Badge>;
      case 'discussion':
        return <Badge bg="primary">Discussion</Badge>;
      default:
        return <Badge bg="secondary">{category}</Badge>;
    }
  };

  // Check if the current user is the author or a community organizer
  const isAuthor = user.id === post.author.id;
  const isCommunityOrganizer = user.role === 'community_organizer';
  const canManage = isAuthor || isCommunityOrganizer;

  return (
    <div>
      <div className="mb-4">
        <Button variant="outline-primary" onClick={() => navigate('/posts')}>
          Back to Posts
        </Button>
      </div>

      <Card className="mb-4 shadow">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-start mb-3">
            <div>
              <Card.Title className="fs-2">{post.title}</Card.Title>
              <Card.Subtitle className="mb-2 text-muted">
                By {post.author.userName} - {new Date(parseInt(post.createdAt)).toLocaleDateString()}
              </Card.Subtitle>
              {post.updatedAt && (
                <small className="text-muted">
                  (Updated: {new Date(parseInt(post.updatedAt)).toLocaleDateString()})
                </small>
              )}
            </div>
            {getCategoryBadge(post.category)}
          </div>

          {post.aiSummary && (
            <Card className="bg-light mb-3">
              <Card.Body>
                <Card.Subtitle className="mb-2">AI Summary</Card.Subtitle>
                <Card.Text>{post.aiSummary}</Card.Text>
              </Card.Body>
            </Card>
          )}

          <Card.Text className="mt-4" style={{ whiteSpace: 'pre-line' }}>
            {post.content}
          </Card.Text>
        </Card.Body>
      </Card>

      {canManage && (
        <Row className="justify-content-end">
          <Col xs="auto">
            {isAuthor && (
              <Link to={`/posts/edit/${post.id}`}>
                <Button variant="warning" className="me-2">Edit Post</Button>
              </Link>
            )}
            <Button 
              variant="danger" 
              className="me-2"
              onClick={() => setShowDeleteModal(true)}
            >
              Delete Post
            </Button>
          </Col>
        </Row>
      )}

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete this post? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="danger" 
            onClick={handleDelete}
            disabled={deleteLoading}
          >
            {deleteLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default PostDetail; 