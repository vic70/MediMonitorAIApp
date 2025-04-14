import { useState } from 'react';
import { useQuery, gql } from '@apollo/client';
import { Card, Row, Col, Button, Spinner, Alert, ButtonGroup, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';

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

const PostList = () => {
  const [filter, setFilter] = useState('all');
  const { loading, error, data } = useQuery(GET_POSTS);

  if (loading) return (
    <div className="text-center my-5">
      <Spinner animation="border" role="status">
        <span className="visually-hidden">Loading...</span>
      </Spinner>
    </div>
  );

  if (error) return (
    <Alert variant="danger">
      Error loading posts: {error.message}
    </Alert>
  );

  const filteredPosts = filter === 'all' 
    ? data.posts 
    : data.posts.filter(post => post.category === filter);

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

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Community Posts</h2>
        <Link to="/posts/create">
          <Button variant="primary">Create New Post</Button>
        </Link>
      </div>

      <div className="mb-4">
        <ButtonGroup>
          <Button 
            variant={filter === 'all' ? 'primary' : 'outline-primary'} 
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button 
            variant={filter === 'news' ? 'info' : 'outline-info'} 
            onClick={() => setFilter('news')}
          >
            News
          </Button>
          <Button 
            variant={filter === 'discussion' ? 'secondary' : 'outline-secondary'} 
            onClick={() => setFilter('discussion')}
          >
            Discussions
          </Button>
        </ButtonGroup>
      </div>

      {filteredPosts.length === 0 ? (
        <Alert variant="info">
          No posts found in this category.
        </Alert>
      ) : (
        <Row xs={1} md={2} className="g-4">
          {filteredPosts.map(post => (
            <Col key={post.id}>
              <Card className="h-100 shadow-sm">
                <Card.Body>
                  <div className="d-flex justify-content-between">
                    <Card.Title>{post.title}</Card.Title>
                    {getCategoryBadge(post.category)}
                  </div>
                  <Card.Subtitle className="mb-2 text-muted">
                    By {post.author.userName} - {new Date(parseInt(post.createdAt)).toLocaleDateString()}
                  </Card.Subtitle>
                  <Card.Text>
                    {post.aiSummary ? post.aiSummary : post.content.substring(0, 150) + '...'}
                  </Card.Text>
                  <Link to={`/posts/${post.id}`}>
                    <Button variant="outline-primary">Read More</Button>
                  </Link>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
};

export default PostList; 