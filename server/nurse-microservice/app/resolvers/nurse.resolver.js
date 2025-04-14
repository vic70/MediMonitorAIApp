import NurseData from '../models/nurse.model.js';
import { GraphQLError } from 'graphql';

// Helper function to convert MongoDB ObjectId to String ID
const formatId = (obj) => {
    if (!obj) return null;
    return {
        ...obj._doc,
        id: obj._id.toString()
    };
};

// Helper to ensure user is authenticated and has nurse role
const ensureNurseAuthenticated = (user) => {
    if (!user) {
        throw new GraphQLError('Not authenticated', {
            extensions: {
                code: 'UNAUTHENTICATED'
            }
        });
    }

    if (user.role !== 'NURSE') {
        throw new GraphQLError('Not authorized - requires nurse role', {
            extensions: {
                code: 'FORBIDDEN'
            }
        });
    }
};

const nurseResolvers = {
    Query: {
        // Get all motivational tips for a specific patient
        motivationalTips: async (_, { patientId }, { user }) => {
            if (!user) {
                throw new GraphQLError('Not authenticated');
            }

            // Patients can view their own tips, nurses can view tips for any patient
            if (user.role !== 'NURSE' && user.id !== patientId) {
                throw new GraphQLError('Not authorized to view motivational tips for this patient');
            }

            // Find all nurse data records
            const nursesData = await NurseData.find({});
            const allTips = [];

            // Collect all tips for the specified patient
            nursesData.forEach(nurseData => {
                nurseData.motivationalTips.forEach(tip => {
                    if (tip.patientId === patientId) {
                        allTips.push({
                            ...tip._doc,
                            id: tip._id.toString(),
                            nurseId: nurseData.userId
                        });
                    }
                });
            });

            return allTips.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        },

        // Get nurse data by user ID
        nurseData: async (_, { userId }, { user }) => {
            if (!user) {
                throw new GraphQLError('Not authenticated');
            }

            // Users can only access their own nurse data record unless they are admin
            if (userId !== user.id && user.role !== 'ADMIN') {
                throw new GraphQLError('Not authorized to view this nurse data');
            }

            // Find or create nurse data record
            let nurseData = await NurseData.findOne({ userId });

            return nurseData ? formatId(nurseData) : null;
        },

        // Get all patients assigned to a nurse
        nurseAssignedPatients: async (_, __, { user }) => {
            ensureNurseAuthenticated(user);

            const nurseData = await NurseData.findOne({ userId: user.id });

            if (!nurseData) {
                return []; // No nurse data record or no assigned patients
            }

            return nurseData.assignedPatients;
        }
    },

    Mutation: {
        // Initialize nurse data for a user with nurse role
        initializeNurseData: async (_, __, { user }) => {
            ensureNurseAuthenticated(user);

            // Check if nurse data already exists
            let nurseData = await NurseData.findOne({ userId: user.id });

            if (nurseData) {
                return formatId(nurseData); // Already initialized
            }

            // Create new nurse data record
            nurseData = new NurseData({
                userId: user.id,
                assignedPatients: [],
                motivationalTips: []
            });

            await nurseData.save();
            return formatId(nurseData);
        },

        // Add a patient to a nurse's assigned patients
        assignPatientToNurse: async (_, { patientId }, { user }) => {
            ensureNurseAuthenticated(user);

            // Find or create nurse data
            let nurseData = await NurseData.findOne({ userId: user.id });

            if (!nurseData) {
                nurseData = new NurseData({
                    userId: user.id,
                    assignedPatients: [],
                    motivationalTips: []
                });
            }

            // Check if patient is already assigned
            if (nurseData.assignedPatients.includes(patientId)) {
                throw new GraphQLError('Patient already assigned to this nurse');
            }

            // Add patient to assigned patients
            nurseData.assignedPatients.push(patientId);
            await nurseData.save();

            return formatId(nurseData);
        },

        // Remove a patient from a nurse's assigned patients
        unassignPatientFromNurse: async (_, { patientId }, { user }) => {
            ensureNurseAuthenticated(user);

            const nurseData = await NurseData.findOne({ userId: user.id });

            if (!nurseData) {
                throw new GraphQLError('Nurse data not found');
            }

            // Remove patient from assigned patients
            nurseData.assignedPatients = nurseData.assignedPatients.filter(id => id !== patientId);
            await nurseData.save();

            return formatId(nurseData);
        },

        // Add a motivational tip for a patient
        addMotivationalTip: async (_, { patientId, content, category }, { user }) => {
            ensureNurseAuthenticated(user);

            // Find or create nurse data
            let nurseData = await NurseData.findOne({ userId: user.id });

            if (!nurseData) {
                nurseData = new NurseData({
                    userId: user.id,
                    assignedPatients: [],
                    motivationalTips: []
                });
            }

            // Create new tip
            const newTip = {
                content,
                patientId,
                category: category || 'General',
                createdAt: new Date(),
                createdBy: {
                    id: user.id,
                    firstName: user.firstName || '',
                    lastName: user.lastName || '',
                    role: user.role
                }
            };

            // Add tip to nurse's motivational tips
            nurseData.motivationalTips.push(newTip);
            await nurseData.save();

            // Return the newly created tip
            const savedTip = nurseData.motivationalTips[nurseData.motivationalTips.length - 1];
            return {
                ...savedTip._doc,
                id: savedTip._id.toString(),
                nurseId: nurseData.userId
            };
        },

        // Update nurse specialization
        updateNurseSpecialization: async (_, { specialization }, { user }) => {
            ensureNurseAuthenticated(user);

            let nurseData = await NurseData.findOne({ userId: user.id });

            if (!nurseData) {
                nurseData = new NurseData({
                    userId: user.id,
                    specialization,
                    assignedPatients: [],
                    motivationalTips: []
                });
            } else {
                nurseData.specialization = specialization;
            }

            await nurseData.save();
            return formatId(nurseData);
        }
    }
};

export default nurseResolvers; 