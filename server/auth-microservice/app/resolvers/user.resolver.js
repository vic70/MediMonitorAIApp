import User from '../models/user.model.js';
import config from '../../config/config.js';
import jwt from 'jsonwebtoken';
import axios from 'axios';

const JWT_SECRET = config.jwtSecret;
//TODO: need to change to environment variables
const PATIENT_SERVICE_URL = 'http://localhost:4002/graphql';
const NURSE_SERVICE_URL = 'http://localhost:4003/graphql';
const patientMutation = `
  mutation {
    initializePatientData {
      id
      createdAt
      updatedAt
    }
  }
`;

const nurseMutation = `
  mutation {
    initializeNurseData {
      id
      createdAt
      updatedAt
    }
  }
`;

const userResolvers = {
    User: {
        async __resolveReference(userRef) {
            try {
                const resolvedUser = await User.findById(userRef.id);
                return resolvedUser;
            } catch (error) {
                throw error;
            }
        },
    },
    Query: {
        isLoggedIn: (_, __, { req }) => !!req.user,
        user: async (_, __, { req }) => {
            // Get token from Authorization header
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return null;
            }

            const token = authHeader.split(' ')[1];

            try {
                const decoded = jwt.verify(token, JWT_SECRET);
                return await User.findById(decoded.id);
            } catch (error) {
                console.error(`[Auth Service] Error in user resolver:`, error);
                return null;
            }
        },
        userById: async (_, { id }, { req }) => {
            // Get token from Authorization header
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                throw new Error('Authentication required');
            }

            const token = authHeader.split(' ')[1];

            try {
                const decoded = jwt.verify(token, JWT_SECRET);

                // Only allow nurses to fetch any user, or users to fetch themselves
                if (decoded.role !== 'NURSE' && decoded.id !== id) {
                    throw new Error('Not authorized to access this user');
                }

                return await User.findById(id);
            } catch (error) {
                console.error(`[Auth Service] Error in userById resolver:`, error);
                throw error;
            }
        },
        users: async (_, __, { req }) => {
            console.log(`[Auth Service] Resolving users. Req object received: ${req ? 'Yes' : 'No'}`);

            // Get token from Authorization header
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                console.log(`[Auth Service] Access denied for users query. No valid authorization header.`);
                return [];
            }

            const token = authHeader.split(' ')[1];

            try {
                const decoded = jwt.verify(token, JWT_SECRET);

                // Check if the user exists and is a nurse (only nurses can see lists of users)
                if (!decoded || decoded.role !== 'NURSE') {
                    console.log(`[Auth Service] Access denied for users query. User role: ${decoded?.role}`);
                    return [];
                }

                console.log(`[Auth Service] Access granted for users query to user: ${decoded.userName}`);
                return await User.find();
            } catch (error) {
                console.error(`[Auth Service] Error in users resolver:`, error);
                return [];
            }
        },
    },

    Mutation: {
        signup: async (_, { userName, email, password, role }) => {
            // Validate role
            const validRoles = ['NURSE', 'PATIENT'];
            if (role && !validRoles.includes(role)) {
                throw new Error(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
            }

            const newUser = new User({ userName, email, password, role });
            const savedUser = await newUser.save();

            const token = jwt.sign({ id: savedUser.id, userName: savedUser.userName, role: savedUser.role }, JWT_SECRET, { expiresIn: '4h' });

            // Call the external service to create a corresponding record.
            if (savedUser.role === 'PATIENT') {
                try {
                    await axios.post(PATIENT_SERVICE_URL, {
                        query: patientMutation,
                        variables: {}
                    }, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        }
                    });
                } catch (error) {
                    console.error('Error creating patient record:', error.response ? error.response.data : error.message);
                    throw new Error('Failed to create patient record');
                }
            } else if (savedUser.role === 'NURSE') {
                try {
                    await axios.post(NURSE_SERVICE_URL, {
                        query: nurseMutation,
                        variables: {}
                    }, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        }
                    });
                } catch (error) {
                    console.error('Error creating nurse record:', error.response ? error.response.data : error.message);
                    throw new Error('Failed to create nurse record');
                }
            }

            return savedUser;
        },
        login: async (_, { userName, password }, { res }) => {
            const user = await User.findOne({ userName });
            if (!user || !(await user.authenticate(password))) return null;
            console.log(`JWT_SECRET at login: ${JWT_SECRET}`);
            const token = jwt.sign({ id: user.id, userName: user.userName, role: user.role }, JWT_SECRET, { expiresIn: '4h' });
            console.log(`Token at login: ${token}`);
            console.log(`Verifying token: ${JSON.stringify(jwt.verify(token, JWT_SECRET))}`);

            // Return the token and user info instead of setting a cookie
            return {
                token,
                user: {
                    id: user.id,
                    userName: user.userName,
                    email: user.email,
                    role: user.role
                }
            };
        },
        logout: async (_, __, { res }) => {
            // No need to clear cookies, client will clear localStorage
            return 'Logged out successfully!';
        }
    }
}

export default userResolvers;