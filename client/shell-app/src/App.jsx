import { useState, useEffect, lazy, Suspense } from 'react'
import { useQuery, gql, useMutation } from '@apollo/client';
import './App.css'

const AuthApp = lazy(() => import('authApp/App'));
const PatientApp = lazy(() => import('patientApp/App'));
const NurseApp = lazy(() => import('nurseApp/App'));

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
  const [userData, setUserData] = useState(null);

  const { loading, error, data, refetch } = useQuery(CURRENT_USER_QUERY, {
    fetchPolicy: 'network-only',
  });

  const [logout] = useMutation(LOGOUT_MUTATION);

  // Function to handle manual refetch
  const refreshUserData = async () => {
    console.log("Manually refreshing user data");
    try {
      const result = await refetch();
      console.log("Refetch result:", result?.data?.user ? "User data received" : "No user data");
      return result;
    } catch (err) {
      console.error("Error refetching user data:", err);
    }
  };

  useEffect(() => {
    // Listen for the custom loginSuccess event from the UserApp
    const handleLoginSuccess = async (event) => {
      console.log("Login success event received");
      
      // Set login state from event
      setIsLoggedIn(true);
      
      // Store user data from the event
      if (event.detail?.user) {
        setUserData(event.detail.user);
      }
      
      // Refetch data to update Apollo cache
      await refreshUserData();
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
      setUserData(null);
      
      // Refetch to update cache
      refetch();
    };

    window.addEventListener('loginSuccess', handleLoginSuccess);
    window.addEventListener('logout', handleLogout);

    // Check if token exists in localStorage on mount
    const token = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('user');
    
    console.log("Initial check - Token:", token ? "exists" : "missing");
    
    if (token) {
      setIsLoggedIn(true);
      
      // Try to load user data from localStorage
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUserData(parsedUser);
          console.log("Loaded user from localStorage:", parsedUser?.role);
        } catch (e) {
          console.error("Error parsing stored user:", e);
        }
      }
      
      // Also refresh from server
      refreshUserData();
    }

    // Update userData when query returns
    if (!loading && !error && data?.user) {
      console.log("Query returned user data:", data.user?.role);
      setUserData(data.user);
      setIsLoggedIn(true);
    }

    return () => {
      window.removeEventListener('loginSuccess', handleLoginSuccess);
      window.removeEventListener('logout', handleLogout);
    };
  }, [loading, error, data, logout, refetch]);

  // Update when data changes from query
  useEffect(() => {
    if (data?.user) {
      setUserData(data.user);
      setIsLoggedIn(true);
    }
  }, [data]);

  if (loading && !userData) return <div>Loading...</div>;
  if (error) return <div>Error! {error.message}</div>;

  // Determine which app to render based on login state and user role
  const renderApp = () => {
    if (!isLoggedIn) {
      return <AuthApp />;
    }
    
    // First try to use data from Apollo query
    if (data?.user?.role) {
      return data.user.role === 'PATIENT' ? <PatientApp /> : <NurseApp />;
    }
    
    // Fall back to userData from localStorage or login event
    if (userData?.role) {
      return userData.role === 'PATIENT' ? <PatientApp /> : <NurseApp />;
    }
    
    // If we have a token but no role information, show AuthApp
    console.log("No role information available despite being logged in");
    return <AuthApp />;
  };

  return (
    <div className="App">
      <Suspense fallback={<div>Loading...</div>}>
        {renderApp()}
      </Suspense>
    </div>
  );
}

export default App
