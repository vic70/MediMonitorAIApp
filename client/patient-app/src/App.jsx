import { ApolloClient, InMemoryCache, createHttpLink, ApolloProvider } from '@apollo/client';
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

function App() {
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    setAuthenticated(!!token);
  }, []);

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
              <Route path="/login" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </div>
      </Router>
    </ApolloProvider>
  );
}

export default App;
