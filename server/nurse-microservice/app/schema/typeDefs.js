import gql from 'graphql-tag';

const typeDefs = gql`
  type MotivationalTip {
    id: ID!
    content: String!
    patient: ID!
    createdAt: String!
    nurse: ID
  }


  type Nurse {
    id: ID!
    user: ID!
    motivationalTips: [MotivationalTip!]!
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
    motivationalTips(patientId: ID!): [MotivationalTip!]!
    
    nurseData(userId: ID!): Nurse
  }
  
  input MotivationalTipInput {
    patientId: ID!
    content: String!
  }
  
  type Mutation {
    initializeNurseData: Nurse
    
    addMotivationalTip(patientId: ID!, content: String!): MotivationalTip
  }
`;

export default typeDefs;
