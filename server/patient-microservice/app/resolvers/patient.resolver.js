import Patient from '../models/patient.model.js';
import mongoose from 'mongoose';
import { GraphQLError } from 'graphql';

// Helper function to convert MongoDB ObjectId to String ID
const formatId = (obj) => {
    if (!obj) return null;
    return {
        ...obj._doc,
        id: obj._id.toString()
    };
};

// Helper function to parse ID and validate it's a valid MongoDB ObjectId
const parseId = (id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new GraphQLError(`Invalid ID: ${id}`);
    }
    return mongoose.Types.ObjectId(id);
};

// Helper to ensure user is authenticated
const ensureAuthenticated = (user) => {
    if (!user) {
        throw new GraphQLError('Not authenticated', {
            extensions: {
                code: 'UNAUTHENTICATED'
            }
        });
    }
};

const patientResolvers = {
    Patient: {
        __resolveReference: async (reference) => {
            const { id } = reference;
            const patient = await Patient.findById(id);
            return formatId(patient);
        },
        emergencyAlerts: (patient) => {
            return patient.emergencyAlerts.map(alert => ({
                ...alert._doc,
                id: alert._id.toString()
            }));
        },
        dailyRecords: (patient) => {
            return patient.dailyRecords.map(record => ({
                ...record._doc,
                id: record._id.toString(),
                date: record.date.toISOString()
            }));
        },
        symptoms: (patient) => {
            return patient.symptoms.map(symptom => ({
                ...symptom._doc,
                id: symptom._id.toString(),
                date: symptom.date.toISOString()
            }));
        }
    },

    Query: {
        patients: async (_, __, { user }) => {
            ensureAuthenticated(user);
            if (user.role !== 'NURSE') {
                throw new GraphQLError('Not authorized to view all patients');
            }

            const patients = await Patient.find({});
            return patients.map(formatId);
        },

        patient: async (_, { id }, { user }) => {
            ensureAuthenticated(user);
            const patientId = parseId(id);
            const patient = await Patient.findById(patientId);

            if (!patient) {
                throw new GraphQLError(`Patient with ID ${id} not found`);
            }

            // Check if user is authorized to view this patient
            if (user.role !== 'NURSE' && patient.userId !== user.id) {
                throw new GraphQLError('Not authorized to view this patient');
            }

            return formatId(patient);
        },

        patientByUserId: async (_, { userId }, { user }) => {
            ensureAuthenticated(user);

            // Users can only access their own patient record unless they are nurse
            if (user.role !== 'NURSE' && userId !== user.id) {
                throw new GraphQLError('Not authorized to view this patient');
            }

            const patient = await Patient.findOne({ userId });
            if (!patient) {
                return null; // No patient record exists for this user
            }

            return formatId(patient);
        },

        emergencyAlerts: async (_, __, { user }) => {
            ensureAuthenticated(user);
            if (user.role !== 'NURSE') {
                throw new GraphQLError('Not authorized to view all emergency alerts');
            }

            const patients = await Patient.find({});
            const allAlerts = [];

            patients.forEach(patient => {
                patient.emergencyAlerts.forEach(alert => {
                    allAlerts.push({
                        ...alert._doc,
                        id: alert._id.toString(),
                        patientId: patient._id.toString()
                    });
                });
            });

            return allAlerts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        },

        patientEmergencyAlerts: async (_, { patientId }, { user }) => {
            ensureAuthenticated(user);
            const id = parseId(patientId);
            const patient = await Patient.findById(id);

            if (!patient) {
                throw new GraphQLError(`Patient with ID ${patientId} not found`);
            }

            // Check if user is authorized to view this patient's alerts
            if (user.role !== 'NURSE' && patient.userId !== user.id) {
                throw new GraphQLError('Not authorized to view this patient\'s emergency alerts');
            }

            return patient.emergencyAlerts.map(alert => ({
                ...alert._doc,
                id: alert._id.toString()
            }));
        },

        patientDailyRecords: async (_, { patientId }, { user }) => {
            ensureAuthenticated(user);
            const id = parseId(patientId);
            const patient = await Patient.findById(id);

            if (!patient) {
                throw new GraphQLError(`Patient with ID ${patientId} not found`);
            }

            // Check if user is authorized to view this patient's records
            if (user.role !== 'NURSE' && patient.userId !== user.id) {
                throw new GraphQLError('Not authorized to view this patient\'s daily records');
            }

            return patient.dailyRecords.map(record => ({
                ...record._doc,
                id: record._id.toString(),
                date: record.date.toISOString()
            }));
        },

        patientDailyRecord: async (_, { patientId, recordId }, { user }) => {
            ensureAuthenticated(user);
            const patient = await Patient.findById(parseId(patientId));

            if (!patient) {
                throw new GraphQLError(`Patient with ID ${patientId} not found`);
            }

            // Check if user is authorized to view this patient's records
            if (user.role !== 'NURSE' && patient.userId !== user.id) {
                throw new GraphQLError('Not authorized to view this patient\'s daily records');
            }

            const record = patient.dailyRecords.id(recordId);
            if (!record) {
                throw new GraphQLError(`Record with ID ${recordId} not found`);
            }

            return {
                ...record._doc,
                id: record._id.toString(),
                date: record.date.toISOString()
            };
        },

        patientSymptoms: async (_, { patientId }, { user }) => {
            ensureAuthenticated(user);
            const id = parseId(patientId);
            const patient = await Patient.findById(id);

            if (!patient) {
                throw new GraphQLError(`Patient with ID ${patientId} not found`);
            }

            // Check if user is authorized to view this patient's symptoms
            if (user.role !== 'NURSE' && patient.userId !== user.id) {
                throw new GraphQLError('Not authorized to view this patient\'s symptoms');
            }

            return patient.symptoms.map(symptom => ({
                ...symptom._doc,
                id: symptom._id.toString(),
                date: symptom.date.toISOString()
            }));
        }
    },

    Mutation: {
        createPatient: async (_, { userId }, { user }) => {
            ensureAuthenticated(user);

            // Only allow creating for self (if patient) or for others if nurse
            if (user.role !== 'NURSE' && userId !== user.id) {
                throw new GraphQLError('Not authorized to create patient record for another user');
            }

            // Check if patient already exists
            const existingPatient = await Patient.findOne({ userId });
            if (existingPatient) {
                throw new GraphQLError('Patient record already exists for this user');
            }

            // Create new patient
            const newPatient = new Patient({ userId });
            await newPatient.save();

            return formatId(newPatient);
        },

        createEmergencyAlert: async (_, { patientId, content }, { user }) => {
            ensureAuthenticated(user);
            const id = parseId(patientId);
            const patient = await Patient.findById(id);

            if (!patient) {
                throw new GraphQLError(`Patient with ID ${patientId} not found`);
            }

            // Only patient can create their own emergency alert
            if (patient.userId !== user.id) {
                throw new GraphQLError('Not authorized to create emergency alert for this patient');
            }

            const newAlert = {
                content,
                createdAt: new Date()
            };

            patient.emergencyAlerts.push(newAlert);
            await patient.save();

            const savedAlert = patient.emergencyAlerts[patient.emergencyAlerts.length - 1];
            return {
                ...savedAlert._doc,
                id: savedAlert._id.toString()
            };
        },

        addDailyRecord: async (_, { patientId, date, pulseRate, bloodPressure, weight, temperature, respiratoryRate }, { user }) => {
            ensureAuthenticated(user);
            const id = parseId(patientId);
            const patient = await Patient.findById(id);

            if (!patient) {
                throw new GraphQLError(`Patient with ID ${patientId} not found`);
            }

            // Only patient can add their own daily record
            if (patient.userId !== user.id) {
                throw new GraphQLError('Not authorized to add daily record for this patient');
            }

            const newDailyRecord = {
                date: new Date(date),
                pulseRate,
                bloodPressure,
                weight,
                temperature,
                respiratoryRate
            };

            patient.dailyRecords.push(newDailyRecord);
            await patient.save();

            const savedRecord = patient.dailyRecords[patient.dailyRecords.length - 1];
            return {
                ...savedRecord._doc,
                id: savedRecord._id.toString(),
                date: savedRecord.date.toISOString()
            };
        },

        addSymptom: async (_, { patientId, date, symptoms, notes }, { user }) => {
            ensureAuthenticated(user);
            const id = parseId(patientId);
            const patient = await Patient.findById(id);

            if (!patient) {
                throw new GraphQLError(`Patient with ID ${patientId} not found`);
            }

            // Only patient can add their own symptoms
            if (patient.userId !== user.id) {
                throw new GraphQLError('Not authorized to add symptoms for this patient');
            }

            const newSymptom = {
                date: new Date(date),
                symptoms,
                notes
            };

            patient.symptoms.push(newSymptom);
            await patient.save();

            const savedSymptom = patient.symptoms[patient.symptoms.length - 1];
            return {
                ...savedSymptom._doc,
                id: savedSymptom._id.toString(),
                date: savedSymptom.date.toISOString()
            };
        },

        updatePatientDailyInfoRequired: async (_, { patientId, pulseRate, bloodPressure, weight, temperature, respiratoryRate }, { user }) => {
            ensureAuthenticated(user);
            const id = parseId(patientId);
            const patient = await Patient.findById(id);

            if (!patient) {
                throw new GraphQLError(`Patient with ID ${patientId} not found`);
            }

            // Only nurses can update daily info requirements
            if (user.role !== 'NURSE') {
                throw new GraphQLError('Not authorized to update daily info requirements for this patient');
            }

            // Update the daily info required
            if (pulseRate !== undefined) patient.dailyInfoRequired.pulseRate = pulseRate;
            if (bloodPressure !== undefined) patient.dailyInfoRequired.bloodPressure = bloodPressure;
            if (weight !== undefined) patient.dailyInfoRequired.weight = weight;
            if (temperature !== undefined) patient.dailyInfoRequired.temperature = temperature;
            if (respiratoryRate !== undefined) patient.dailyInfoRequired.respiratoryRate = respiratoryRate;

            await patient.save();

            return formatId(patient);
        }
    }
};

export default patientResolvers; 