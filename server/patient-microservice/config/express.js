import config from './config.js';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { buildSubgraphSchema } from '@apollo/subgraph';
import jwt from 'jsonwebtoken';

// Import resolvers
import patientResolvers from '../app/resolvers/patient.resolver.js';
import typeDefs from '../app/schema/typeDefs.js';

process.env.NODE_ENV = config.nodeEnv;

const JWT_SECRET = config.jwtSecret;

// Combine resolvers
const resolvers = {
    Query: {
        ...patientResolvers.Query,
    },
    Mutation: {
        ...patientResolvers.Mutation,
    },
    Patient: patientResolvers.Patient
};

const server = new ApolloServer({
    schema: buildSubgraphSchema([{ typeDefs, resolvers }]),
});

await server.start();

const app = express();

// Middleware to parse cookies
app.use(cookieParser());

// CORS middleware
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:4000', 'http://localhost:4001', 'http://localhost:4002'],
    credentials: true,
}));

app.use(express.json());

// Apply Apollo Server middleware to Express
app.use(
    '/graphql',
    expressMiddleware(server, {
        context: async ({ req, res }) => {
            // Get token from Authorization header instead of cookies
            const authHeader = req.headers.authorization;
            let token = null;

            if (authHeader && authHeader.startsWith('Bearer ')) {
                token = authHeader.split(' ')[1];
                console.log('Token from Authorization header:', token);
            }

            let user = null;
            if (token) {
                try {
                    // Verify token
                    user = jwt.verify(token, JWT_SECRET);
                } catch (err) {
                    console.error('JWT verification failed in patient service:', err.message);
                }
            }
            req.user = user;
            // The context now includes req, res, token, and user info
            return { req, res, token, user };
        }
    })
);

export default app;
