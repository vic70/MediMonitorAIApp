import gql from 'graphql-tag';
const typeDefs = gql`
    enum Role {
        NURSE
        PATIENT
    }

    type User @key(fields: "id") {
        id: ID!
        userName: String!
        email: String!
        password: String!
        role: Role!
    }

    type AuthPayload {
        token: String
        user: User
    }

    type Query {
        isLoggedIn: Boolean!
        user: User
        users: [User]
    }

    type Mutation {
        signup(userName: String!, email: String!, password: String!, role: String!): User
        login(userName: String!, password: String!): AuthPayload
        logout: String
    }

`
export default typeDefs;
