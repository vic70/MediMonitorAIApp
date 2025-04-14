import gql from 'graphql-tag';

const typeDefs = gql`  
    type EmergencyAlert {
        id: ID!
        content: String!
        createdAt: String!
    }
    
    type DailyInfoRequired {
        pulseRate: Boolean!
        bloodPressure: Boolean!
        weight: Boolean!
        temperature: Boolean!
        respiratoryRate: Boolean!
    }
    
    type DailyRecord {
        id: ID!
        date: String!
        pulseRate: Float
        bloodPressure: String
        weight: Float
        temperature: Float
        respiratoryRate: Float
    }
    
    type Symptom {
        id: ID!
        date: String!
        symptoms: [String!]
        notes: String
    }
    
    type Patient @key(fields: "id") {
        id: ID!
        userId: ID!
        emergencyAlerts: [EmergencyAlert!]
        dailyInfoRequired: DailyInfoRequired!
        dailyRecords: [DailyRecord!]
        symptoms: [Symptom!]
        createdAt: String!
        updatedAt: String!
    }
    
    extend type User @key(fields: "id") {
        id: ID! @external
        userName: String! @external
        email: String! @external
        role: String! @external
    }
    
    extend type Nurse @key(fields: "id") {
        id: ID! @external
    }
    
    type Query {
        # Patient queries
        patients: [Patient]
        patient(id: ID!): Patient
        patientByUserId(userId: ID!): Patient
        emergencyAlerts: [EmergencyAlert]
        patientEmergencyAlerts(patientId: ID!): [EmergencyAlert]
        patientDailyRecords(patientId: ID!): [DailyRecord]
        patientDailyRecord(patientId: ID!, recordId: ID!): DailyRecord
        patientSymptoms(patientId: ID!): [Symptom]
    }
    
    type Mutation {
        # Patient mutations
        createPatient(userId: ID!): Patient
        createEmergencyAlert(patientId: ID!, content: String!): EmergencyAlert
        addDailyRecord(
            patientId: ID!, 
            date: String!, 
            pulseRate: Float, 
            bloodPressure: String, 
            weight: Float, 
            temperature: Float, 
            respiratoryRate: Float
        ): DailyRecord
        addSymptom(patientId: ID!, date: String!, symptoms: [String!]!, notes: String): Symptom
        
        # Nurse operations on patient
        updatePatientDailyInfoRequired(
            patientId: ID!, 
            pulseRate: Boolean, 
            bloodPressure: Boolean, 
            weight: Boolean, 
            temperature: Boolean, 
            respiratoryRate: Boolean
        ): Patient
    }
`;

export default typeDefs;
