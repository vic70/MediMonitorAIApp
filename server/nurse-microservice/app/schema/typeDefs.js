import gql from 'graphql-tag';

const typeDefs = gql`
    type MotivationalTipCreator {
        id: ID!
        firstName: String
        lastName: String
        role: String
    }

    type MotivationalTip {
        id: ID!
        content: String!
        patientId: ID!
        category: String
        createdAt: String!
        createdBy: MotivationalTipCreator
        nurseId: ID
    }
    
    type NurseData @key(fields: "id") {
        id: ID!
        userId: ID!
        specialization: String
        motivationalTips: [MotivationalTip!]
        assignedPatients: [ID!]
        createdAt: String!
        updatedAt: String!
    }
    
    extend type User @key(fields: "id") {
        id: ID! @external
        userName: String! @external
        email: String! @external
        role: String! @external
    }
    
    type Query {
        # Nurse queries
        nurseData(userId: ID!): NurseData
        nurseAssignedPatients: [ID!]
        motivationalTips(patientId: ID!): [MotivationalTip]
    }
    
    type Mutation {
        # Nurse data initialization
        initializeNurseData: NurseData
        
        # Patient assignments
        assignPatientToNurse(patientId: ID!): NurseData
        unassignPatientFromNurse(patientId: ID!): NurseData
        
        # Motivational tips
        addMotivationalTip(
            patientId: ID!, 
            content: String!,
            category: String
        ): MotivationalTip
        
        # Specialization
        updateNurseSpecialization(specialization: String!): NurseData
    }
`;

export default typeDefs; 