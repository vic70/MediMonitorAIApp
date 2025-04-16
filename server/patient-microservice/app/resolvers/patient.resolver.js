import PatientData from '../models/patient.model.js';
import mongoose from 'mongoose';
import { GraphQLError } from 'graphql';

// Helper function to convert MongoDB ObjectId to String ID
// and convert Date fields (createdAt, updatedAt) to ISO strings.
const formatId = (obj) => {
    if (!obj) return null;
    return {
        ...obj._doc,
        id: obj._id.toString(),
        createdAt: obj.createdAt ? obj.createdAt.toISOString() : null,
        updatedAt: obj.updatedAt ? obj.updatedAt.toISOString() : null,
    };
};

// Helper function to parse ID and validate it's a valid MongoDB ObjectId
const parseId = (id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new GraphQLError(`Invalid ID: ${id}`);
    }
    return mongoose.Types.ObjectId(id);
};

// Helpers for authentication and role checking
const ensureAuthenticated = (user) => {
    if (!user) {
        throw new GraphQLError('Not authenticated', {
            extensions: { code: 'UNAUTHENTICATED' }
        });
    }
};

const ensurePatientAuthenticated = (user) => {
    ensureAuthenticated(user);
    if (user.role !== 'PATIENT') {
        throw new GraphQLError('Not authorized – requires patient role', {
            extensions: { code: 'FORBIDDEN' }
        });
    }
};

const ensureNurseAuthenticated = (user) => {
    ensureAuthenticated(user);
    if (user.role !== 'NURSE') {
        throw new GraphQLError('Not authorized – requires nurse role', {
            extensions: { code: 'FORBIDDEN' }
        });
    }
};

const patientResolvers = {
    Query: {
        // Get all patients (for nurses only)
        patientsData: async (_, __, { user }) => {
            ensureNurseAuthenticated(user);
            const patientsData = await PatientData.find({});
            return patientsData.map(formatId);
        },

        // Get patient data by ID
        patientData: async (_, { id }, { user }) => {
            ensureAuthenticated(user);
            const patientData = await PatientData.findById(parseId(id));
            if (!patientData) return null;

            // Allow nurses to view any data; patients see only their own record.
            if (user.role !== 'NURSE' && patientData.userId !== user.id) {
                throw new GraphQLError('Not authorized to view this patient data');
            }
            return formatId(patientData);
        },

        // Get patient data by user ID
        patientDataByUserId: async (_, { userId }, { user }) => {
            ensureAuthenticated(user);
            // Users can only access their own patient data unless they are nurse
            if (user.role !== 'NURSE' && userId !== user.id) {
                throw new GraphQLError('Not authorized to view this patient data');
            }
            const patientData = await PatientData.findOne({ user: userId });
            return patientData ? formatId(patientData) : null;
        },

        // Get all emergency alerts (nurse view)
        emergencyAlerts: async (_, __, { user }) => {
            ensureNurseAuthenticated(user);
            const patientsData = await PatientData.find({});
            const allAlerts = [];
            patientsData.forEach(patientData => {
                patientData.emergencyAlerts.forEach(alert => {
                    allAlerts.push({
                        ...alert._doc,
                        id: alert._id.toString(),
                        patientId: patientData.userId, // adjust if your schema field is "user"
                        createdAt: alert.createdAt ? alert.createdAt.toISOString() : null
                    });
                });
            });
            return allAlerts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        },

        // [Patient and Nurse] Get emergency alerts for a specific patient
        patientEmergencyAlerts: async (_, { patientId }, { user }) => {
            ensureAuthenticated(user);
            const patientData = await PatientData.findOne({ user: patientId });
            if (!patientData) return [];
            // Only allow access if user is a nurse or the patient themselves.
            if (user.role !== 'NURSE' && user.id !== patientId) {
                throw new GraphQLError('Not authorized to view this patient\'s emergency alerts');
            }
            return patientData.emergencyAlerts.map(alert => ({
                ...alert._doc,
                id: alert._id.toString(),
                createdAt: alert.createdAt ? alert.createdAt.toISOString() : null
            }));
        },

        // [Patient and Nurse] Get daily records (clinical visits, vital signs)
        patientDailyRecords: async (_, { patientId }, { user }) => {
            ensureAuthenticated(user);
            const patientData = await PatientData.findOne({ user: patientId });
            if (!patientData) return [];
            // Only allow access if user is a nurse or the owner patient.
            if (user.role !== 'NURSE' && user.id !== patientId) {
                throw new GraphQLError('Not authorized to view this patient\'s daily records');
            }
            return patientData.dailyRecords.map(record => ({
                ...record._doc,
                id: record._id.toString(),
                date: record.date ? record.date.toISOString() : null
            }));
        },

        // [Patient & Nurse] Get patient symptoms (symptoms is now a separate subdocument)
        patientSymptoms: async (_, { patientId }, { user }) => {
            ensureAuthenticated(user);
            const patientData = await PatientData.findOne({ user: patientId });
            if (!patientData) return null;
            // Only allow access if user is a nurse or the patient themselves.
            if (user.role !== 'NURSE' && user.id !== patientId) {
                throw new GraphQLError('Not authorized to view this patient\'s symptoms');
            }
            return patientData.symptoms;
        },

        // [Patient & Nurse] Get the daily required info (DailyInfoRequiredSchema) for a patient
        patientDailyInfoRequired: async (_, { patientId }, { user }) => {
            ensureAuthenticated(user);
            const patientData = await PatientData.findOne({ user: patientId });
            if (!patientData) return null;
            // Only allow access if the user is a nurse or the patient themselves.
            if (user.role !== 'NURSE' && user.id !== patientId) {
                throw new GraphQLError('Not authorized to view this patient\'s daily information requirements');
            }
            return patientData.dailyInfoRequired;
        }
    },

    Mutation: {
        // Initialize patient data for a user with patient role
        initializePatientData: async (_, __, { user }) => {
            ensurePatientAuthenticated(user);
            // Check if patient data already exists
            let patientData = await PatientData.findOne({ user: user.id });
            if (patientData) {
                return formatId(patientData); // Already initialized
            }
            // Create new patient data record
            patientData = new PatientData({ user: user.id });
            await patientData.save();
            return formatId(patientData);
        },

        // [Patient] Create an emergency alert to notify first responders
        createEmergencyAlert: async (_, { content }, { user }) => {
            ensurePatientAuthenticated(user);
            let patientData = await PatientData.findOne({ user: user.id });
            if (!patientData) {
                patientData = new PatientData({ user: user.id });
            }
            const newAlert = {
                content,
                createdAt: new Date()
            };
            patientData.emergencyAlerts.push(newAlert);
            await patientData.save();
            const savedAlert = patientData.emergencyAlerts[patientData.emergencyAlerts.length - 1];
            return {
                ...savedAlert._doc,
                id: savedAlert._id.toString(),
                createdAt: savedAlert.createdAt ? savedAlert.createdAt.toISOString() : null
            };
        },

        // [Patient] Add a new daily record (enter daily vital signs)
        addDailyRecord: async (
            _,
            { date, pulseRate, bloodPressure, weight, temperature, respiratoryRate },
            { user }
        ) => {
            ensurePatientAuthenticated(user);
            let patientData = await PatientData.findOne({ user: user.id });
            if (!patientData) {
                patientData = new PatientData({ user: user.id });
            }
            const newDailyRecord = {
                date: new Date(date),
                pulseRate,
                bloodPressure,
                weight,
                temperature,
                respiratoryRate
            };
            patientData.dailyRecords.push(newDailyRecord);
            await patientData.save();
            const savedRecord = patientData.dailyRecords[patientData.dailyRecords.length - 1];
            return {
                ...savedRecord._doc,
                id: savedRecord._id.toString(),
                date: savedRecord.date ? savedRecord.date.toISOString() : null
            };
        },

        // [Patient] Submit a checklist of symptoms 
        addSymptom: async (_, { symptoms }, { user }) => {
            ensurePatientAuthenticated(user);
            let patientData = await PatientData.findOne({ user: user.id });
            if (!patientData) {
                patientData = new PatientData({ user: user.id });
            }
            // Update the symptoms field with the provided checklist.
            patientData.symptoms = { ...symptoms };
            await patientData.save();
            return patientData.symptoms;
        },

        // [Nurse] Update the daily required information for a patient
        updatePatientDailyInfoRequired: async (
            _,
            { patientId, pulseRate, bloodPressure, weight, temperature, respiratoryRate },
            { user }
        ) => {
            ensureNurseAuthenticated(user);
            let patientData = await PatientData.findOne({ user: patientId });
            if (!patientData) {
                // If patient data does not exist, create it.
                patientData = new PatientData({ user: patientId, dailyInfoRequired: {} });
            }
            if (pulseRate !== undefined) patientData.dailyInfoRequired.pulseRate = pulseRate;
            if (bloodPressure !== undefined) patientData.dailyInfoRequired.bloodPressure = bloodPressure;
            if (weight !== undefined) patientData.dailyInfoRequired.weight = weight;
            if (temperature !== undefined) patientData.dailyInfoRequired.temperature = temperature;
            if (respiratoryRate !== undefined) patientData.dailyInfoRequired.respiratoryRate = respiratoryRate;
            await patientData.save();
            return formatId(patientData);
        },

        // [Patient] Report symptoms with notes
        reportSymptoms: async (_, { patientId, symptoms, notes }, { user }) => {
            ensureAuthenticated(user);
            // Only allow if user is a nurse or the patient themselves
            if (user.role !== 'NURSE' && user.id !== patientId) {
                throw new GraphQLError('Not authorized to report symptoms for this patient');
            }

            let patientData = await PatientData.findOne({ user: patientId });
            if (!patientData) {
                patientData = new PatientData({ user: patientId });
            }

            // Create a new daily record with symptoms
            const newRecord = {
                date: new Date(),
                symptoms: symptoms,
                notes: notes
            };

            patientData.dailyRecords.push(newRecord);
            await patientData.save();
            
            return formatId(patientData);
        },
    }
};

export default patientResolvers;
