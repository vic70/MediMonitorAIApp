import gql from 'graphql-tag';

const typeDefs = gql`
    type MotivationalTip {
        id: ID!
        content: String!
        patientId: ID!
        createdAt: String!
    }
    
    type Nurse @key(fields: "id") {
        id: ID!
        userId: ID!
        motivationalTips: [MotivationalTip!]
        patients: [ID!]
        createdAt: String!
        updatedAt: String!
    }
    
    extend type User @key(fields: "id") {
        id: ID! @external
        userName: String! @external
        email: String! @external
        role: String! @external
    }
    
    extend type Patient @key(fields: "id") {
        id: ID! @external
    }
    
    type Query {
        # Nurse queries
        nurses: [Nurse]
        nurse(id: ID!): Nurse
        nurseByUserId(userId: ID!): Nurse
        nursePatients(nurseId: ID!): [ID!]
        motivationalTips(patientId: ID!): [MotivationalTip]
    }
    
    type Mutation {
        # Nurse mutations
        createNurse(userId: ID!): Nurse
        addPatientToNurse(nurseId: ID!, patientId: ID!): Nurse
        addMotivationalTip(nurseId: ID!, patientId: ID!, content: String!): MotivationalTip
    }
`;

export default typeDefs; 