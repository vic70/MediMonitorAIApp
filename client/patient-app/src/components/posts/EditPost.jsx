import { useState, useEffect } from 'react';
import { useMutation, useQuery, gql } from '@apollo/client';
import { Form, Button, Card, Alert, Spinner } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';

const GET_POST = gql`
  query GetPost($id: ID!) {
    post(id: $id) {
      id
      title
      content
      category
      author {
        id
        userName
      }
    }
  }
`;

const UPDATE_POST = gql`
  mutation UpdatePost($id: ID!, $title: String!, $content: String!, $category: String!) {
    updatePost(id: $id, title: $title, content: $content, category: $category) {
      id
      title
      content
      category
    }
  }
`;

const EditPost = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: ''
  });
  const [validated, setValidated] = useState(false);
  
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
  
  const { loading: queryLoading, error: queryError, data } = useQuery(GET_POST, {
    variables: { id },
    onCompleted: (data) => {
      setFormData({
        title: data.post.title,
        content: data.post.content,
        category: data.post.category
      });
    }
  });

  const [updatePost, { loading: mutationLoading, error: mutationError }] = useMutation(UPDATE_POST, {
    onCompleted: () => {
      navigate(`/posts/${id}`);
    }
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    
    if (form.checkValidity() === false) {
      e.stopPropagation();
      setValidated(true);
      return;
    }

    updatePost({
      variables: {
        id,
        title: formData.title,
        content: formData.content,
        category: formData.category
      }
    });
  };

  if (queryLoading) return (
    <div className="text-center my-5">
      <Spinner animation="border" role="status">
        <span className="visually-hidden">Loading...</span>
      </Spinner>
    </div>
  );

  if (queryError) return (
    <Alert variant="danger">
      Error loading post: {queryError.message}
    </Alert>
  );

  if (!user) return (
    <Alert variant="warning">
      Please log in to edit this post.
    </Alert>
  );

  // Check authorization (only post author should be able to edit)
  if (data && data.post.author.id !== user.id) {
    return (
      <Alert variant="danger">
        You are not authorized to edit this post.
      </Alert>
    );
  }

  return (
    <div>
      <h2 className="mb-4">Edit Post</h2>
      
      <Card className="shadow">
        <Card.Body>
          {mutationError && (
            <Alert variant="danger">
              Error updating post: {mutationError.message}
            </Alert>
          )}
          
          <Form noValidate validated={validated} onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="postTitle">
              <Form.Label>Title</Form.Label>
              <Form.Control
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                minLength={3}
                maxLength={100}
                placeholder="Enter post title"
              />
              <Form.Control.Feedback type="invalid">
                Please provide a title (3-100 characters).
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3" controlId="postCategory">
              <Form.Label>Category</Form.Label>
              <Form.Select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
              >
                <option value="discussion">Discussion</option>
                <option value="news">News</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3" controlId="postContent">
              <Form.Label>Content</Form.Label>
              <Form.Control
                as="textarea"
                rows={6}
                name="content"
                value={formData.content}
                onChange={handleChange}
                required
                minLength={10}
                placeholder="Write your post content here..."
              />
              <Form.Control.Feedback type="invalid">
                Please provide content (minimum 10 characters).
              </Form.Control.Feedback>
            </Form.Group>

            <div className="d-flex justify-content-between">
              <Button variant="secondary" onClick={() => navigate(`/posts/${id}`)}>
                Cancel
              </Button>
              <Button variant="warning" type="submit" disabled={mutationLoading}>
                {mutationLoading ? 'Updating...' : 'Update Post'}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default EditPost; 