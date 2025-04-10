import './App.css'
import { ApolloClient, InMemoryCache, createHttpLink, ApolloProvider } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import UserComponent from './components/UserComponent';
import 'bootstrap/dist/css/bootstrap.min.css';

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
  return (
    <div className='App'>
      <ApolloProvider client={client}>
        <div className="container py-4">
          <header className="text-center mb-4">
            <h1 className="display-4">Authentication Service</h1>
            <p className="lead">Please login or create an account</p>
          </header>
          <UserComponent />
        </div>
      </ApolloProvider>
    </div>
  );
}

export default App
