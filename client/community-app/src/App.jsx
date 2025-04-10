import { ApolloClient, InMemoryCache, createHttpLink, ApolloProvider } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import './App.css'
import CommunityComponent from './components/CommunityComponent';
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
        <div className="container-fluid p-0">
          <CommunityComponent />
        </div>
      </ApolloProvider>
    </div>
  );
}

export default App
