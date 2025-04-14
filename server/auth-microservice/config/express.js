import config from './config.js';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import handleError from '../app/middlewares/ErrorHandler.js';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { buildSubgraphSchema } from '@apollo/subgraph';
import userResolvers from '../app/resolvers/user.resolver.js';
import typeDefs from '../app/schema/typeDefs.js';
import jwt from 'jsonwebtoken';


process.env.NODE_ENV = config.nodeEnv;

const JWT_SECRET = config.jwtSecret;

const resolvers = {
    Query: {
        ...userResolvers.Query,
    },
    Mutation: {
        ...userResolvers.Mutation,
    },
    User: userResolvers.User
};

// Define a simple logging plugin
const loggingPlugin = {
    async requestDidStart(requestContext) {
        console.log('[Auth Service Apollo Plugin] Request started! Query:\n' + requestContext.request.query);
        return {
            async didEncounterErrors(requestContext) {
                console.log('[Auth Service Apollo Plugin] Error encountered!:', requestContext.errors);
            },
        };
    },
};

const server = new ApolloServer({
    schema: buildSubgraphSchema([{ typeDefs, resolvers }]),
    // plugins: [loggingPlugin],
});

await server.start();


const app = express();

// Middleware to parse cookies
app.use(cookieParser());

//Middleware
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003', 'http://localhost:4000', 'http://localhost:4001', 'http://localhost:4002', 'http://localhost:4003'],
    credentials: true
}));

app.use(express.json());

// Apply Apollo Server middleware to Express
app.use(
    '/graphql',
    expressMiddleware(server, {
        context: async ({ req, res }) => {
            // First check for the token in cookies (if needed)
            let token = req.cookies.token;
            // Then check the Authorization header (forwarded by the gateway)
            if (!token && req.headers.authorization) {
                token = req.headers.authorization.split(' ')[1];
            }
            let user = null;
            if (token) {
                try {
                    // Verify token (using the same secret as in the auth service)
                    user = jwt.verify(token, JWT_SECRET);
                    req.user = user;
                } catch (err) {
                    console.error('JWT verification failed in auth service:', err.message);
                }
            }
            // The context now includes req, res, token, and user info
            req.user = user;

            return { req, res, token, user };
        },
    }),
);

app.use(handleError);

export default app;
