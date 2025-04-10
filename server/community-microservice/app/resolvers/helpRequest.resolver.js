import HelpRequest from '../models/helpRequest.model.js';

const helpRequestResolvers = {
    Query: {
        helpRequests: async () => await HelpRequest.find(),
        helpRequest: async (_, { id }) => await HelpRequest.findById(id),
    },
    Mutation: {
        createHelpRequest: async (_, { description, location }, { user }) => {
            if (!user) throw new Error('You must be logged in to create a help request');

            const helpRequest = new HelpRequest({
                description,
                location,
                author: user.id,
            });

            await helpRequest.save();
            return helpRequest;
        },

        updateHelpRequest: async (_, { id, description, location }, { user }) => {
            if (!user) throw new Error('You must be logged in to update a help request');

            const helpRequest = await HelpRequest.findById(id);

            if (!helpRequest) throw new Error('Help request not found');
            if (helpRequest.author.toString() !== user.id) throw new Error('Not authorized to edit this help request');

            const updates = {};
            if (description) updates.description = description;
            if (location) updates.location = location;
            updates.updatedAt = new Date();

            const updatedHelpRequest = await HelpRequest.findByIdAndUpdate(
                id,
                { $set: updates },
                { new: true }
            );

            return updatedHelpRequest;
        },

        addVolunteerToHelpRequest: async (_, { id, volunteerId }, { user }) => {
            if (!user) throw new Error('You must be logged in to add volunteers');
            if (user.role !== 'community_organizer') throw new Error('Only community organizers can add volunteers');

            const helpRequest = await HelpRequest.findById(id);
            if (!helpRequest) throw new Error('Help request not found');

            if (!helpRequest.volunteers.includes(volunteerId)) {
                helpRequest.volunteers.push(volunteerId);
                helpRequest.updatedAt = new Date();
                await helpRequest.save();
            }

            return helpRequest;
        },

        resolveHelpRequest: async (_, { id, isResolved }, { user }) => {
            if (!user) throw new Error('You must be logged in to resolve a help request');

            const helpRequest = await HelpRequest.findById(id);
            if (!helpRequest) throw new Error('Help request not found');

            // Check if user is author or community organizer
            if (helpRequest.author.toString() !== user.id && user.role !== 'community_organizer') {
                throw new Error('Not authorized to resolve this help request');
            }

            helpRequest.isResolved = isResolved;
            helpRequest.updatedAt = new Date();
            await helpRequest.save();

            return helpRequest;
        },

        deleteHelpRequest: async (_, { id }, { user }) => {
            if (!user) throw new Error('You must be logged in to delete a help request');

            const helpRequest = await HelpRequest.findById(id);
            if (!helpRequest) throw new Error('Help request not found');

            // Check if user is author or community organizer
            if (helpRequest.author.toString() !== user.id && user.role !== 'community_organizer') {
                throw new Error('Not authorized to delete this help request');
            }

            await HelpRequest.findByIdAndDelete(id);
            return true;
        }
    },
    HelpRequest: {
        __resolveReference: async (helpRequestRef) => {
            return await HelpRequest.findById(helpRequestRef.id);
        },
        author(helpRequest) {
            return { __typename: 'User', id: helpRequest.author };
        },
        volunteers(helpRequest) {
            return helpRequest.volunteers.map(volunteerId => ({ __typename: 'User', id: volunteerId }));
        }
    }
};

export default helpRequestResolvers;
