import gql from 'graphql-tag';

const typeDefs = gql`  
    type Post{
        id: ID!
        title: String!
        content: String!
        category: String!
        aiSummary: String
        author: User!
        createdAt: String!
        updatedAt: String
    }
    
    type HelpRequest {
        id: ID!
        description: String!
        location: String
        isResolved: Boolean!
        volunteers: [User]
        author: User!
        createdAt: String!
        updatedAt: String
    }
    
    extend type User @key(fields: "id") {
        id: ID! @external
        userName: String! @external
        email: String! @external
        role: String! @external
    }
    
    type Query {
        posts: [Post]
        post(id: ID!): Post
        helpRequests: [HelpRequest]
        helpRequest(id: ID!): HelpRequest
    }
    
    type Mutation {
        createPost(title: String!, content: String!, category: String!): Post
        updatePost(id: ID!, title: String, content: String, category: String): Post
        deletePost(id: ID!): Boolean
        
        createHelpRequest(description: String!, location: String): HelpRequest
        updateHelpRequest(id: ID!, description: String, location: String): HelpRequest
        addVolunteerToHelpRequest(id: ID!, volunteerId: ID!): HelpRequest
        resolveHelpRequest(id: ID!, isResolved: Boolean!): HelpRequest
        deleteHelpRequest(id: ID!): Boolean
    }
`;

export default typeDefs;
