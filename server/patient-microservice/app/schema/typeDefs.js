import gql from 'graphql-tag';

const typeDefs = gql`
    type EmergencyAlert {
        id: ID!
        content: String!
        create_date: String!
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
        bloodPressure: Float
        weight: Float
        temperature: Float
        respiratoryRate: Float
    }

    type Symptoms {
        breathingProblem: Boolean!
        fever: Boolean!
        dryCough: Boolean!
        soreThroat: Boolean!
        runningNose: Boolean!
        asthma: Boolean!
        chronicLungDisease: Boolean!
        headache: Boolean!
        heartDisease: Boolean!
        diabetes: Boolean!
        hyperTension: Boolean!
        fatigue: Boolean!
        gastrointestinal: Boolean!
        abroadTravel: Boolean!
        contactWithCovidPatient: Boolean!
        attendedLargeGathering: Boolean!
        visitedPublicExposedPlaces: Boolean!
        familyWorkingInPublicExposedPlaces: Boolean!
        wearingMasks: Boolean!
        sanitizationFromMarket: Boolean!
    }

    type PatientData @key(fields: "id") {
        id: ID!
        user: ID!
        emergencyAlerts: [EmergencyAlert!]
        dailyInfoRequired: DailyInfoRequired!
        dailyRecords: [DailyRecord!]
        symptoms: Symptoms!
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
        patientsData: [PatientData]
        patientData(id: ID!): PatientData
        patientDataByUserId(userId: ID!): PatientData
        emergencyAlerts: [EmergencyAlert]
        patientEmergencyAlerts(patientId: ID!): [EmergencyAlert]
        patientDailyRecords(patientId: ID!): [DailyRecord]
        patientSymptoms(patientId: ID!): Symptoms
        patientDailyInfoRequired(patientId: ID!): DailyInfoRequired
    }

    type Mutation {
        initializePatientData: PatientData

        createEmergencyAlert(content: String!): EmergencyAlert

        addDailyRecord(
            date: String!,
            pulseRate: Float,
            bloodPressure: Float,
            weight: Float,
            temperature: Float,
            respiratoryRate: Float
        ): DailyRecord

        addSymptom(
            symptoms: SymptomsInput!
        ): Symptoms

        updatePatientDailyInfoRequired(
            patientId: ID!,
            pulseRate: Boolean,
            bloodPressure: Boolean,
            weight: Boolean,
            temperature: Boolean,
            respiratoryRate: Boolean
        ): PatientData
    }

    input SymptomsInput {
        breathingProblem: Boolean
        fever: Boolean
        dryCough: Boolean
        soreThroat: Boolean
        runningNose: Boolean
        asthma: Boolean
        chronicLungDisease: Boolean
        headache: Boolean
        heartDisease: Boolean
        diabetes: Boolean
        hyperTension: Boolean
        fatigue: Boolean
        gastrointestinal: Boolean
        abroadTravel: Boolean
        contactWithCovidPatient: Boolean
        attendedLargeGathering: Boolean
        visitedPublicExposedPlaces: Boolean
        familyWorkingInPublicExposedPlaces: Boolean
        wearingMasks: Boolean
        sanitizationFromMarket: Boolean
    }
`;

export default typeDefs;