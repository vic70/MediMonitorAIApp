import { ApolloClient, InMemoryCache, createHttpLink, ApolloProvider } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import './App.css';
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
