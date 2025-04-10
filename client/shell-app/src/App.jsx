import { useState, useEffect, lazy, Suspense } from 'react'
import { useQuery, gql, useMutation } from '@apollo/client';
import './App.css'

const AuthApp = lazy(() => import('authApp/App'));
const CommunityApp = lazy(() => import('communityApp/App'));

const CURRENT_USER_QUERY = gql`
  query {
    user {
      id
      userName
      email
      role
    }
  }`;

const LOGOUT_MUTATION = gql`
  mutation Logout {
    logout
  }
`;

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const { loading, error, data, refetch } = useQuery(CURRENT_USER_QUERY, {
    fetchPolicy: 'network-only',
  });

  const [logout] = useMutation(LOGOUT_MUTATION);

  useEffect(() => {
    // Listen for the custom loginSuccess event from the UserApp
    const handleLoginSuccess = (event) => {
      setIsLoggedIn(event.detail.isLoggedIn);
    };

    // Listen for logout event
    const handleLogout = () => {
      // Clear localStorage
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      
      // Call logout mutation
      logout();
      
      // Update state
      setIsLoggedIn(false);
      
      // Refetch to update cache
      refetch();
    };

    window.addEventListener('loginSuccess', handleLoginSuccess);
    window.addEventListener('logout', handleLogout);

    // Check if token exists in localStorage on mount
    const token = localStorage.getItem('authToken');
    if (token) {
      setIsLoggedIn(true);
    }

    // Check the authentication status based on the query's result
    if (!loading && !error) {
      setIsLoggedIn(!!data?.user);
    }

    return () => {
      window.removeEventListener('loginSuccess', handleLoginSuccess);
      window.removeEventListener('logout', handleLogout);
    };
  }, [loading, error, data, logout, refetch]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error! {error.message}</div>;

  return (
    <div className="App">
      <Suspense fallback={<div>Loading...</div>}>
        {!isLoggedIn ? <AuthApp /> : <CommunityApp />}
      </Suspense>
    </div>
  );
}

export default App
