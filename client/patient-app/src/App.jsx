import { ApolloClient, InMemoryCache, createHttpLink, ApolloProvider, gql, useMutation } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import Dashboard from './pages/Dashboard';
import EmergencyAlert from './pages/EmergencyAlert';
import DailyRecords from './pages/DailyRecords';
import SymptomsList from './pages/SymptomsList';
import MotivationalTips from './pages/MotivationalTips';
import Profile from './pages/Profile';
import Appointments from './pages/Appointments';
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
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'network-only',
      errorPolicy: 'all',
    },
    query: {
      fetchPolicy: 'network-only',
      errorPolicy: 'all',
    },
  },
});

// Initialize patient data mutation
const INITIALIZE_PATIENT_DATA = gql`
  mutation InitializePatientData {
    initializePatientData {
      id
      user
    }
  }
`;

function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [initializing, setInitializing] = useState(true);
  
  // Initialize patient data
  const [initializePatientData] = useMutation(INITIALIZE_PATIENT_DATA, {
    onCompleted: (data) => {
      console.log('Patient data initialized:', data);
      setInitializing(false);
    },
    onError: (error) => {
      console.error('Error initializing patient data:', error);
      setInitializing(false);
    }
  });

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    setAuthenticated(!!token);
    
    // If authenticated, initialize patient data
    if (token) {
      initializePatientData();
    } else {
      setInitializing(false);
    }
  }, [initializePatientData]);

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
              <Route path="/emergency-alert" element={authenticated ? <EmergencyAlert /> : <Navigate to="/login" />} />
              <Route path="/daily-records" element={authenticated ? <DailyRecords /> : <Navigate to="/login" />} />
              <Route path="/symptoms" element={authenticated ? <SymptomsList /> : <Navigate to="/login" />} />
              <Route path="/motivational-tips" element={authenticated ? <MotivationalTips /> : <Navigate to="/login" />} />
              <Route path="/profile" element={authenticated ? <Profile /> : <Navigate to="/login" />} />
              <Route path="/appointments" element={authenticated ? <Appointments /> : <Navigate to="/login" />} />
              <Route path="/login" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </div>
      </Router>
    </ApolloProvider>
  );
}

export default App;
