import PatientData from '../models/patient.model.js';
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

// Helper to ensure user is authenticated and has patient role
const ensurePatientAuthenticated = (user) => {
    if (!user) {
        throw new GraphQLError('Not authenticated', {
            extensions: {
                code: 'UNAUTHENTICATED'
            }
        });
    }

    if (user.role !== 'PATIENT') {
        throw new GraphQLError('Not authorized - requires patient role', {
            extensions: {
                code: 'FORBIDDEN'
            }
        });
    }
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
    Query: {
        // Get all patients (for nurses only)
        patientsData: async (_, __, { user }) => {
            ensureAuthenticated(user);
            if (user.role !== 'NURSE') {
                throw new GraphQLError('Not authorized to view all patients data');
            }

            const patientsData = await PatientData.find({});
            return patientsData.map(formatId);
        },

        // Get patient data by ID
        patientData: async (_, { id }, { user }) => {
            ensureAuthenticated(user);
            const patientData = await PatientData.findById(parseId(id));

            if (!patientData) {
                return null;
            }

            // Check if user is authorized to view this patient data
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

            const patientData = await PatientData.findOne({ userId });
            return patientData ? formatId(patientData) : null;
        },

        // Get all emergency alerts (for nurses only)
        emergencyAlerts: async (_, __, { user }) => {
            ensureAuthenticated(user);
            if (user.role !== 'NURSE') {
                throw new GraphQLError('Not authorized to view all emergency alerts');
            }

            const patientsData = await PatientData.find({});
            const allAlerts = [];

            patientsData.forEach(patientData => {
                patientData.emergencyAlerts.forEach(alert => {
                    allAlerts.push({
                        ...alert._doc,
                        id: alert._id.toString(),
                        patientId: patientData.userId
                    });
                });
            });

            return allAlerts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        },

        // Get emergency alerts for a specific patient
        patientEmergencyAlerts: async (_, { patientId }, { user }) => {
            ensureAuthenticated(user);

            // Find patient data
            const patientData = await PatientData.findOne({ userId: patientId });

            if (!patientData) {
                return [];
            }

            // Check if user is authorized to view this patient's alerts
            if (user.role !== 'NURSE' && user.id !== patientId) {
                throw new GraphQLError('Not authorized to view this patient\'s emergency alerts');
            }

            return patientData.emergencyAlerts.map(alert => ({
                ...alert._doc,
                id: alert._id.toString()
            }));
        },

        // Get daily records for a specific patient
        patientDailyRecords: async (_, { patientId }, { user }) => {
            ensureAuthenticated(user);

            // Find patient data
            const patientData = await PatientData.findOne({ userId: patientId });

            if (!patientData) {
                return [];
            }

            // Check if user is authorized to view this patient's records
            if (user.role !== 'NURSE' && user.id !== patientId) {
                throw new GraphQLError('Not authorized to view this patient\'s daily records');
            }

            return patientData.dailyRecords.map(record => ({
                ...record._doc,
                id: record._id.toString(),
                date: record.date.toISOString()
            }));
        },

        // Get symptoms for a specific patient
        patientSymptoms: async (_, { patientId }, { user }) => {
            ensureAuthenticated(user);

            // Find patient data
            const patientData = await PatientData.findOne({ userId: patientId });

            if (!patientData) {
                return [];
            }

            // Check if user is authorized to view this patient's symptoms
            if (user.role !== 'NURSE' && user.id !== patientId) {
                throw new GraphQLError('Not authorized to view this patient\'s symptoms');
            }

            return patientData.symptoms.map(symptom => ({
                ...symptom._doc,
                id: symptom._id.toString(),
                date: symptom.date.toISOString()
            }));
        },

        // Get appointments for a specific patient
        appointmentsByPatientId: async (_, { patientId }, { user }) => {
            ensureAuthenticated(user);

            // Find patient data
            const patientData = await PatientData.findOne({ userId: patientId });

            if (!patientData) {
                return [];
            }

            // Check if user is authorized to view this patient's appointments
            if (user.role !== 'NURSE' && user.id !== patientId) {
                throw new GraphQLError('Not authorized to view this patient\'s appointments');
            }

            return patientData.appointments.map(appointment => ({
                ...appointment._doc,
                id: appointment._id.toString()
            }));
        }
    },

    Mutation: {
        // Initialize patient data for a user with patient role
        initializePatientData: async (_, __, { user }) => {
            ensurePatientAuthenticated(user);

            // Check if patient data already exists
            let patientData = await PatientData.findOne({ userId: user.id });

            if (patientData) {
                return formatId(patientData); // Already initialized
            }

            // Create new patient data record
            patientData = new PatientData({ userId: user.id });
            await patientData.save();

            return formatId(patientData);
        },

        // Create emergency alert
        createEmergencyAlert: async (_, { content }, { user }) => {
            ensurePatientAuthenticated(user);

            // Find or create patient data
            let patientData = await PatientData.findOne({ userId: user.id });

            if (!patientData) {
                patientData = new PatientData({ userId: user.id });
            }

            // Create new alert
            const newAlert = {
                content,
                status: 'NEW',
                createdAt: new Date()
            };

            patientData.emergencyAlerts.push(newAlert);
            await patientData.save();

            // Return the newly created alert
            const savedAlert = patientData.emergencyAlerts[patientData.emergencyAlerts.length - 1];
            return {
                ...savedAlert._doc,
                id: savedAlert._id.toString()
            };
        },

        // Update emergency alert status (for nurses)
        updateEmergencyAlertStatus: async (_, { patientId, alertId, status }, { user }) => {
            ensureAuthenticated(user);

            if (user.role !== 'NURSE') {
                throw new GraphQLError('Not authorized to update alert status');
            }

            // Find patient data
            const patientData = await PatientData.findOne({ userId: patientId });

            if (!patientData) {
                throw new GraphQLError('Patient data not found');
            }

            // Find the alert
            const alert = patientData.emergencyAlerts.id(alertId);

            if (!alert) {
                throw new GraphQLError('Alert not found');
            }

            // Update status
            alert.status = status;
            await patientData.save();

            return {
                ...alert._doc,
                id: alert._id.toString()
            };
        },

        // Add daily record
        addDailyRecord: async (_, { date, pulseRate, bloodPressure, weight, temperature, respiratoryRate, notes }, { user }) => {
            ensurePatientAuthenticated(user);

            // Find or create patient data
            let patientData = await PatientData.findOne({ userId: user.id });

            if (!patientData) {
                patientData = new PatientData({ userId: user.id });
            }

            // Create new daily record
            const newDailyRecord = {
                date: new Date(date),
                pulseRate,
                bloodPressure,
                weight,
                temperature,
                respiratoryRate,
                notes
            };

            patientData.dailyRecords.push(newDailyRecord);
            await patientData.save();

            // Return the newly created record
            const savedRecord = patientData.dailyRecords[patientData.dailyRecords.length - 1];
            return {
                ...savedRecord._doc,
                id: savedRecord._id.toString(),
                date: savedRecord.date.toISOString()
            };
        },

        // Add symptom
        addSymptom: async (_, { date, symptoms, severity, notes }, { user }) => {
            ensurePatientAuthenticated(user);

            // Find or create patient data
            let patientData = await PatientData.findOne({ userId: user.id });

            if (!patientData) {
                patientData = new PatientData({ userId: user.id });
            }

            // Create new symptom
            const newSymptom = {
                date: new Date(date || Date.now()),
                symptoms,
                severity: severity || 'MODERATE',
                notes
            };

            patientData.symptoms.push(newSymptom);
            await patientData.save();

            // Return the newly created symptom
            const savedSymptom = patientData.symptoms[patientData.symptoms.length - 1];
            return {
                ...savedSymptom._doc,
                id: savedSymptom._id.toString(),
                date: savedSymptom.date.toISOString()
            };
        },

        // Create appointment
        createAppointment: async (_, { patientId, nurseId, date, time, reason, notes, status }, { user }) => {
            ensureAuthenticated(user);

            if (user.role !== 'PATIENT' && user.role !== 'NURSE') {
                throw new GraphQLError('Not authorized to create appointments');
            }

            // If user is a patient, they can only create appointments for themselves
            if (user.role === 'PATIENT' && user.id !== patientId) {
                throw new GraphQLError('Not authorized to create appointments for another patient');
            }

            // Find patient data
            let patientData = await PatientData.findOne({ userId: patientId });

            if (!patientData) {
                if (user.role === 'NURSE') {
                    patientData = new PatientData({ userId: patientId });
                } else {
                    patientData = new PatientData({ userId: user.id });
                }
            }

            // Create new appointment
            const newAppointment = {
                date,
                time,
                reason,
                notes,
                nurseId,
                status: status || 'REQUESTED'
            };

            patientData.appointments.push(newAppointment);
            await patientData.save();

            // Return the newly created appointment
            const savedAppointment = patientData.appointments[patientData.appointments.length - 1];
            return {
                ...savedAppointment._doc,
                id: savedAppointment._id.toString()
            };
        },

        // Update appointment status
        updateAppointment: async (_, { id, patientId, status }, { user }) => {
            ensureAuthenticated(user);

            // Find patient data
            const patientData = await PatientData.findOne(
                patientId ? { userId: patientId } : { 'appointments._id': id }
            );

            if (!patientData) {
                throw new GraphQLError('Patient data or appointment not found');
            }

            // Check permissions
            if (user.role !== 'NURSE' && patientData.userId !== user.id) {
                throw new GraphQLError('Not authorized to update this appointment');
            }

            // Find the appointment
            const appointment = patientData.appointments.id(id);

            if (!appointment) {
                throw new GraphQLError('Appointment not found');
            }

            // Update status
            appointment.status = status;
            await patientData.save();

            return {
                ...appointment._doc,
                id: appointment._id.toString()
            };
        },

        // Update patient's required daily info (nurse only)
        updatePatientDailyInfoRequired: async (_, { patientId, pulseRate, bloodPressure, weight, temperature, respiratoryRate }, { user }) => {
            ensureAuthenticated(user);

            if (user.role !== 'NURSE') {
                throw new GraphQLError('Not authorized to update daily info requirements');
            }

            // Find patient data
            let patientData = await PatientData.findOne({ userId: patientId });

            if (!patientData) {
                patientData = new PatientData({
                    userId: patientId,
                    dailyInfoRequired: {}
                });
            }

            // Update required fields
            if (pulseRate !== undefined) patientData.dailyInfoRequired.pulseRate = pulseRate;
            if (bloodPressure !== undefined) patientData.dailyInfoRequired.bloodPressure = bloodPressure;
            if (weight !== undefined) patientData.dailyInfoRequired.weight = weight;
            if (temperature !== undefined) patientData.dailyInfoRequired.temperature = temperature;
            if (respiratoryRate !== undefined) patientData.dailyInfoRequired.respiratoryRate = respiratoryRate;

            await patientData.save();

            return formatId(patientData);
        },

        // Add emergency contact
        addEmergencyContact: async (_, { name, relationship, phone }, { user }) => {
            ensurePatientAuthenticated(user);

            // Find or create patient data
            let patientData = await PatientData.findOne({ userId: user.id });

            if (!patientData) {
                patientData = new PatientData({ userId: user.id });
            }

            // Add emergency contact
            patientData.emergencyContacts.push({
                name,
                relationship,
                phone
            });

            await patientData.save();

            return formatId(patientData);
        },

        // Add preferred nurse
        addPreferredNurse: async (_, { nurseId }, { user }) => {
            ensurePatientAuthenticated(user);

            // Find or create patient data
            let patientData = await PatientData.findOne({ userId: user.id });

            if (!patientData) {
                patientData = new PatientData({ userId: user.id });
            }

            // Check if nurse is already in preferred nurses
            if (patientData.preferredNurses.includes(nurseId)) {
                return formatId(patientData);
            }

            // Add nurse to preferred nurses
            patientData.preferredNurses.push(nurseId);
            await patientData.save();

            return formatId(patientData);
        }
    }
};

export default patientResolvers; 