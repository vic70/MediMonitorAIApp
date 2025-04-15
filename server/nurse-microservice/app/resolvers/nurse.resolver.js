import NurseData from '../models/nurse.model.js';
import { GraphQLError } from 'graphql';

// Helper function to convert a MongoDB document to a plain object with string id
const formatId = (obj) => {
    if (!obj) return null;
    return {
        ...obj._doc,
        id: obj._id.toString(),
        createdAt: obj.createdAt ? obj.createdAt.toISOString() : null,
        updatedAt: obj.updatedAt ? obj.updatedAt.toISOString() : null,
    };
};

// Helper to ensure the user is authenticated and has the nurse role
const ensureNurseAuthenticated = (user) => {
    if (!user) {
        throw new GraphQLError('Not authenticated', {
            extensions: { code: 'UNAUTHENTICATED' },
        });
    }
    if (user.role !== 'NURSE') {
        throw new GraphQLError('Not authorized - requires nurse role', {
            extensions: { code: 'FORBIDDEN' },
        });
    }
};

const nurseResolvers = {
    Query: {
        // Get all motivational tips for a specific patient.
        // Patients can view their own tips; nurses can view tips for any patient.
        motivationalTips: async (_, { patientId }, { user }) => {
            if (!user) {
                throw new GraphQLError('Not authenticated');
            }
            // Patients can view only their own tips.
            if (user.role !== 'NURSE' && user.id !== patientId) {
                throw new GraphQLError('Not authorized to view motivational tips for this patient');
            }

            // Find all nurse records and collect tips matching the patient
            const nursesData = await NurseData.find({});
            const allTips = [];
            nursesData.forEach(nurseData => {
                nurseData.motivationalTips.forEach(tip => {
                    // Compare tip.patient (an ObjectId) by converting it to string
                    if (tip.patient.toString() === patientId) {
                        allTips.push({
                            ...tip._doc,
                            id: tip._id.toString(),
                            nurse: nurseData.user.toString(),
                            createdAt: tip.createdAt ? tip.createdAt.toISOString() : null
                        });
                    }
                });
            });
            // Sort descending by createdAt
            return allTips.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        },

        // Get nurse data by user ID.
        // Only the nurse should see their own data.
        nurseData: async (_, { userId }, { user }) => {
            if (!user) {
                throw new GraphQLError('Not authenticated');
            }
            if (userId !== user.id) {
                throw new GraphQLError('Not authorized to view this nurse data');
            }
            // Note: using 'user' field in query to match the schema.
            const nurseData = await NurseData.findOne({ user: userId });
            return nurseData ? formatId(nurseData) : null;
        },
    },

    Mutation: {
        // Initialize nurse data for a user with the nurse role.
        // This creates a new nurse document if it doesn't already exist.
        initializeNurseData: async (_, __, { user }) => {
            console.log("initializeNurseData called with user:", user);

            try {
                ensureNurseAuthenticated(user);
                console.log("User authenticated as nurse");

                let nurseData = await NurseData.findOne({ user: user.id });
                console.log("NurseData query result:", nurseData ? "Found existing record" : "No existing record");

                if (nurseData) {
                    console.log("Returning existing nurse data:", nurseData._id.toString());
                    return formatId(nurseData); // Already initialized
                }

                // Create a new nurse data record using the correct field ("user")
                console.log("Creating new NurseData record for user:", user.id);
                nurseData = new NurseData({
                    user: user.id,
                    motivationalTips: []
                });

                console.log("Saving new nurse data");
                await nurseData.save();
                console.log("New nurse data saved with ID:", nurseData._id.toString());

                const formattedData = formatId(nurseData);
                console.log("Returning formatted nurse data:", formattedData.id);
                return formattedData;
            } catch (error) {
                console.error("Error in initializeNurseData:", error.message);
                console.error("Error stack:", error.stack);
                throw error; // Re-throw to let GraphQL handle it
            }
        },

        // Add a motivational tip for a patient.
        // The nurse creates a tip for a specific patient. Note that we now use "patient" rather than "patientId".
        addMotivationalTip: async (_, { patientId, content, category }, { user }) => {
            ensureNurseAuthenticated(user);
            let nurseData = await NurseData.findOne({ user: user.id });
            if (!nurseData) {
                nurseData = new NurseData({ user: user.id, motivationalTips: [] });
            }

            // Create new tip without createdBy (since it's implied by nurseData.user)
            const newTip = {
                content,
                patient: patientId, // Using patient field to reference a User (patient)
                createdAt: new Date()
            };

            nurseData.motivationalTips.push(newTip);
            await nurseData.save();
            const savedTip = nurseData.motivationalTips[nurseData.motivationalTips.length - 1];

            return {
                ...savedTip._doc,
                id: savedTip._id.toString(),
                nurse: nurseData.user.toString(),
                createdAt: savedTip.createdAt ? savedTip.createdAt.toISOString() : null
            };
        },
    },

    Nurse: {
        // Resolver for the motivationalTips field in Nurse type
        motivationalTips: async (parent) => {
            // Return the tips, ensuring they have proper formatting
            return parent.motivationalTips.map(tip => ({
                ...tip,
                id: tip._id.toString(),
                createdAt: tip.createdAt ? tip.createdAt.toISOString() : null
            }));
        }
    }
};

export default nurseResolvers;
