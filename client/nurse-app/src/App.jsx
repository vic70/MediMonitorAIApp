import { ApolloClient, InMemoryCache, createHttpLink, ApolloProvider, gql, useMutation } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import Dashboard from './pages/Dashboard';
import PatientList from './pages/PatientList';
import PatientDetail from './pages/PatientDetail';
import SendMotivationalTip from './pages/SendMotivationalTip';
import ManageRequiredInfo from './pages/ManageRequiredInfo';
import ViewMedicalConditions from './pages/ViewMedicalConditions';
import Navbar from './components/Navbar';

const httpLink = createHttpLink({
  uri: 'http://localhost:4000/graphql',
});

// Auth link for adding the token to headers
const authLink = setContext((_, { headers }) => {
  // Get the token from localStorage
  const token = localStorage.getItem('authToken');
  
  // Return the headers to the context
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    }
  }
});

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});

// Initialize nurse data mutation
const INITIALIZE_NURSE_DATA = gql`
  mutation InitializeNurseData {
    initializeNurseData {
      id
      user
    }
  }
`;

function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [initializing, setInitializing] = useState(true);
  
  // Initialize nurse data
  const [initializeNurseData] = useMutation(INITIALIZE_NURSE_DATA, {
    onCompleted: (data) => {
      console.log('Nurse data initialized:', data);
      setInitializing(false);
    },
    onError: (error) => {
      console.error('Error initializing nurse data:', error);
      setInitializing(false);
    }
  });

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    setAuthenticated(!!token);
    
    // If authenticated, initialize nurse data
    if (token) {
      initializeNurseData();
    } else {
      setInitializing(false);
    }
  }, [initializeNurseData]);

  if (initializing && authenticated) {
    return <div className="d-flex justify-content-center align-items-center vh-100">Initializing...</div>;
  }

  return (
    <ApolloProvider client={client}>
      <Router>
        <div className="App">
          <Navbar authenticated={authenticated} />
          <div className="container mt-4">
            <Routes>
              <Route path="/" element={authenticated ? <Dashboard /> : <Navigate to="/login" />} />
              <Route path="/patients" element={authenticated ? <PatientList /> : <Navigate to="/login" />} />
              <Route path="/patients/:id" element={authenticated ? <PatientDetail /> : <Navigate to="/login" />} />
              <Route path="/patients/:id/tips" element={authenticated ? <SendMotivationalTip /> : <Navigate to="/login" />} />
              <Route path="/patients/:id/required-info" element={authenticated ? <ManageRequiredInfo /> : <Navigate to="/login" />} />
              <Route path="/patients/:id/conditions" element={authenticated ? <ViewMedicalConditions /> : <Navigate to="/login" />} />
              <Route path="/login" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </div>
      </Router>
    </ApolloProvider>
  );
}

export default App;
