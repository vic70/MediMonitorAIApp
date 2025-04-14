import Nurse from '../models/nurse.model.js';
import { GraphQLError } from 'graphql';

// Helper function to convert MongoDB ObjectId to String ID
const formatId = (obj) => {
    if (!obj) return null;
    return {
        ...obj._doc,
        id: obj._id.toString()
    };
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

const nurseResolvers = {
    Nurse: {
        __resolveReference: async (reference) => {
            const { id } = reference;
            const nurse = await Nurse.findById(id);
            return formatId(nurse);
        },
        motivationalTips: (nurse) => {
            return nurse.motivationalTips.map(tip => ({
                ...tip._doc,
                id: tip._id.toString()
            }));
        }
    },

    Query: {
        nurses: async (_, __, { user }) => {
            ensureAuthenticated(user);
            if (user.role !== 'NURSE') {
                throw new GraphQLError('Not authorized to view all nurses');
            }

            const nurses = await Nurse.find({});
            return nurses.map(formatId);
        },

        nurse: async (_, { id }, { user }) => {
            ensureAuthenticated(user);
            const nurse = await Nurse.findById(id);

            if (!nurse) {
                throw new GraphQLError(`Nurse with ID ${id} not found`);
            }

            // Check if user is authorized to view this nurse
            if (nurse.userId !== user.id) {
                throw new GraphQLError('Not authorized to view this nurse');
            }

            return formatId(nurse);
        },

        nurseByUserId: async (_, { userId }, { user }) => {
            ensureAuthenticated(user);

            // Users can only access their own nurse record
            if (userId !== user.id && user.role !== 'NURSE') {
                throw new GraphQLError('Not authorized to view this nurse');
            }

            const nurse = await Nurse.findOne({ userId });
            if (!nurse) {
                return null; // No nurse record exists for this user
            }

            return formatId(nurse);
        },

        nursePatients: async (_, { nurseId }, { user }) => {
            ensureAuthenticated(user);
            const nurse = await Nurse.findById(nurseId);

            if (!nurse) {
                throw new GraphQLError(`Nurse with ID ${nurseId} not found`);
            }

            // Check if user is authorized to view this nurse's patients
            if (nurse.userId !== user.id) {
                throw new GraphQLError('Not authorized to view this nurse\'s patients');
            }

            return nurse.patients;
        },

        motivationalTips: async (_, { patientId }, { user }) => {
            ensureAuthenticated(user);

            // Patients can view their own tips, nurses can view all tips
            if (user.role !== 'NURSE' && user.id !== patientId) {
                throw new GraphQLError('Not authorized to view motivational tips for this patient');
            }

            // Find all nurses that have tips for this patient
            const nurses = await Nurse.find({});
            const allTips = [];

            nurses.forEach(nurse => {
                nurse.motivationalTips.forEach(tip => {
                    if (tip.patientId === patientId) {
                        allTips.push({
                            ...tip._doc,
                            id: tip._id.toString(),
                            nurseId: nurse._id.toString()
                        });
                    }
                });
            });

            return allTips.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }
    },

    Mutation: {
        createNurse: async (_, { userId }, { user }) => {
            ensureAuthenticated(user);

            // Only allow creating for self if nurse
            if (userId !== user.id || user.role !== 'NURSE') {
                throw new GraphQLError('Not authorized to create nurse record');
            }

            // Check if nurse already exists
            const existingNurse = await Nurse.findOne({ userId });
            if (existingNurse) {
                throw new GraphQLError('Nurse record already exists for this user');
            }

            // Create new nurse
            const newNurse = new Nurse({ userId });
            await newNurse.save();

            return formatId(newNurse);
        },

        addPatientToNurse: async (_, { nurseId, patientId }, { user }) => {
            ensureAuthenticated(user);
            const nurse = await Nurse.findById(nurseId);

            if (!nurse) {
                throw new GraphQLError(`Nurse with ID ${nurseId} not found`);
            }

            // Check if user is authorized to modify this nurse
            if (nurse.userId !== user.id) {
                throw new GraphQLError('Not authorized to modify this nurse');
            }

            // Check if patient is already assigned to this nurse
            if (nurse.patients.includes(patientId)) {
                throw new GraphQLError('Patient already assigned to this nurse');
            }

            // Add patient to nurse
            nurse.patients.push(patientId);
            await nurse.save();

            return formatId(nurse);
        },

        addMotivationalTip: async (_, { nurseId, patientId, content }, { user }) => {
            ensureAuthenticated(user);
            const nurse = await Nurse.findById(nurseId);

            if (!nurse) {
                throw new GraphQLError(`Nurse with ID ${nurseId} not found`);
            }

            // Check if user is authorized to modify this nurse
            if (nurse.userId !== user.id) {
                throw new GraphQLError('Not authorized to add motivational tip as this nurse');
            }

            // Check if nurse is assigned to this patient
            if (!nurse.patients.includes(patientId)) {
                throw new GraphQLError('Nurse is not assigned to this patient');
            }

            // Add motivational tip
            const newTip = {
                content,
                patientId,
                createdAt: new Date()
            };

            nurse.motivationalTips.push(newTip);
            await nurse.save();

            const savedTip = nurse.motivationalTips[nurse.motivationalTips.length - 1];
            return {
                ...savedTip._doc,
                id: savedTip._id.toString(),
                nurseId: nurse._id.toString()
            };
        }
    }
};

export default nurseResolvers; 