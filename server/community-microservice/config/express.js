import config from './config.js';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { buildSubgraphSchema } from '@apollo/subgraph';
import jwt from 'jsonwebtoken';

// Import resolvers
import postResolvers from '../app/resolvers/post.resolver.js';
import helpRequestResolvers from '../app/resolvers/helpRequest.resolver.js';
import typeDefs from '../app/schema/typeDefs.js';

process.env.NODE_ENV = config.nodeEnv;

const JWT_SECRET = config.jwtSecret;

// Combine resolvers
const resolvers = {
    Query: {
        ...postResolvers.Query,
        ...helpRequestResolvers.Query,
    },
    Mutation: {
        ...postResolvers.Mutation,
        ...helpRequestResolvers.Mutation,
    },
    Post: postResolvers.Post,
    HelpRequest: helpRequestResolvers.HelpRequest
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

// // JWT authentication middleware
// app.use((req, res, next) => {
//     console.log('Cookies:', req.cookies);
//     const token = req.cookies.token;
//     if (token) {
//         try {
//             const user = jwt.verify(token, JWT_SECRET);
//             console.log('User authenticated in community service:', user);
//             req.user = user;
//         } catch (err) {
//             console.error('JWT verification failed:', err.message);
//             req.user = null;
//         }
//     }
//     next();
// });

// Apply Apollo Server middleware to Express
app.use(
    '/graphql',
    expressMiddleware(server, {
        // context: async ({ req, res }) => ({ req, res, user: req.user }),
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
                    console.error('JWT verification failed in community service:', err.message);
                }
            }
            req.user = user;
            // The context now includes req, res, token, and user info
            // console.log('JWT verification in community service: req.user:', req.user);
            return { req, res, token, user };
        }
    })
);

export default app;
