import { useState } from 'react';
import { useMutation, gql } from '@apollo/client';
import { Form, Button, Card, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const CREATE_POST = gql`
  mutation CreatePost($title: String!, $content: String!, $category: String!) {
    createPost(title: $title, content: $content, category: $category) {
      id
      title
      content
      category
    }
  }
`;

// Import the query used in PostList to refetch it after creation
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

const CreatePost = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'discussion'
  });
  const [validated, setValidated] = useState(false);
  const [createPost, { loading, error }] = useMutation(CREATE_POST, {
    refetchQueries: [
      { query: GET_POSTS } // Refetch posts list after creation
    ],
    onCompleted: (data) => {
      navigate(`/posts/${data.createPost.id}`);
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

    createPost({
      variables: {
        title: formData.title,
        content: formData.content,
        category: formData.category
      }
    });
  };

  return (
    <div>
      <h2 className="mb-4">Create New Post</h2>
      
      <Card className="shadow">
        <Card.Body>
          {error && (
            <Alert variant="danger">
              Error creating post: {error.message}
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
              <Button variant="secondary" onClick={() => navigate('/posts')}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Post'}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default CreatePost; 