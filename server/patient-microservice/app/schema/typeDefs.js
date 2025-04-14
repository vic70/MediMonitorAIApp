import gql from 'graphql-tag';

const typeDefs = gql`  
    type EmergencyAlert {
        id: ID!
        content: String!
        status: String!
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
        notes: String
    }
    
    type Symptom {
        id: ID!
        date: String!
        symptoms: [String!]
        severity: String
        notes: String
    }
    
    type EmergencyContact {
        name: String!
        relationship: String!
        phone: String!
    }
    
    type MedicalCondition {
        name: String!
        diagnosedDate: String
        notes: String
    }
    
    type Medication {
        name: String!
        dosage: String
        frequency: String
        startDate: String
        endDate: String
    }
    
    type Appointment {
        id: ID!
        date: String!
        time: String!
        status: String!
        reason: String!
        notes: String
        nurseId: String
    }
    
    type PatientData @key(fields: "id") {
        id: ID!
        userId: ID!
        emergencyContacts: [EmergencyContact!]
        emergencyAlerts: [EmergencyAlert!]
        dailyInfoRequired: DailyInfoRequired!
        medicalConditions: [MedicalCondition!]
        medications: [Medication!]
        preferredNurses: [ID!]
        dailyRecords: [DailyRecord!]
        symptoms: [Symptom!]
        appointments: [Appointment!]
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
        # Patient queries
        patientsData: [PatientData]
        patientData(id: ID!): PatientData
        patientDataByUserId(userId: ID!): PatientData
        emergencyAlerts: [EmergencyAlert]
        patientEmergencyAlerts(patientId: ID!): [EmergencyAlert]
        patientDailyRecords(patientId: ID!): [DailyRecord]
        patientSymptoms(patientId: ID!): [Symptom]
        appointmentsByPatientId(patientId: ID!): [Appointment]
    }
    
    type Mutation {
        # Patient data initialization
        initializePatientData: PatientData
        
        # Emergency alerts
        createEmergencyAlert(content: String!): EmergencyAlert
        updateEmergencyAlertStatus(patientId: ID!, alertId: ID!, status: String!): EmergencyAlert
        
        # Daily records
        addDailyRecord(
            date: String!, 
            pulseRate: Float, 
            bloodPressure: String, 
            weight: Float, 
            temperature: Float, 
            respiratoryRate: Float,
            notes: String
        ): DailyRecord
        
        # Symptoms
        addSymptom(
            date: String, 
            symptoms: [String!]!, 
            severity: String, 
            notes: String
        ): Symptom
        
        # Appointments
        createAppointment(
            patientId: ID!,
            nurseId: ID,
            date: String!,
            time: String!,
            reason: String!,
            notes: String,
            status: String
        ): Appointment
        
        updateAppointment(
            id: ID!,
            patientId: ID,
            status: String!
        ): Appointment
        
        # Nurse operations on patient
        updatePatientDailyInfoRequired(
            patientId: ID!, 
            pulseRate: Boolean, 
            bloodPressure: Boolean, 
            weight: Boolean, 
            temperature: Boolean, 
            respiratoryRate: Boolean
        ): PatientData
        
        # Emergency contacts
        addEmergencyContact(
            name: String!,
            relationship: String!,
            phone: String!
        ): PatientData
        
        # Preferred nurses
        addPreferredNurse(
            nurseId: ID!
        ): PatientData
    }
`;

export default typeDefs;
