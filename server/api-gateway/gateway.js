// Using ES Module import syntax
import http from 'http';
import express from 'express';
import cors from 'cors';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { ApolloGateway, RemoteGraphQLDataSource, IntrospectAndCompose } from '@apollo/gateway';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import { createProxyMiddleware } from 'http-proxy-middleware';
import config from './config/config.js';

const JWT_SECRET = config.jwtSecret;

// Add these logging plugins
// const gatewayLoggingPlugin = {
//     async requestDidStart(requestContext) {
//         console.log(`[Gateway] Request started: ${requestContext.request.query}`);

//         return {
//             async didResolveOperation(context) {
//                 console.log(`[Gateway] Operation resolved: ${context.operationName}`);
//             },
//             async willSendRequest({ request }) {
//                 console.log(`[Gateway] Sending request to subgraph: ${request.operationName} to ${request.serviceDefinition?.name}`);
//                 console.log(`[Gateway] Request query: ${request.query}`);
//                 console.log(`[Gateway] Request variables:`, request.variables);
//             },
//             async didReceiveResponse({ response, request }) {
//                 console.log(`[Gateway] Response from ${request.serviceDefinition?.name}:`,
//                     JSON.stringify(response, null, 2));
//             },
//             async didEncounterError(requestContext) {
//                 console.error(`[Gateway] Error:`, requestContext.errors);
//             },
//         };
//     },
// };

async function startApolloServer() {
    const app = express();
    // Our httpServer handles incoming requests to our Express app.
    // Below, we tell Apollo Server to "drain" this server when stopping, which prevents
    // interrupting active connections.
    const httpServer = http.createServer(app);

    // Same ApolloGateway instance setup as before
    const gateway = new ApolloGateway({
        supergraphSdl: new IntrospectAndCompose({
            subgraphs: [
                { name: "users", url: "http://localhost:4001/graphql" },
                { name: 'community', url: 'http://localhost:4002/graphql' }
            ],
            // Optional: set interval for polling subgraphs for schema updates
            // pollIntervalInMs: 10000, 
        }),
        buildService({ name, url }) {
            return new RemoteGraphQLDataSource({
                url,
                willSendRequest({ request, context }) {

                    if (context.token) {
                        // You can use the standard Authorization header
                        request.http.headers.set('Authorization', `Bearer ${context.token}`);
                        console.log(`[Gateway] Forwarded token to subgraph: ${context.token.substring(0, 20)}...`);
                    } else {
                        console.log(`[Gateway] No token to forward to subgraph`);
                    }
                },
            });
        },
        //debug: true, // Enable debug logging
    });


    // ApolloServer constructor requires schema OR gateway, not both.
    // We pass the gateway instance to the server
    const server = new ApolloServer({
        gateway,
        plugins: [
            ApolloServerPluginDrainHttpServer({ httpServer }),
            // gatewayLoggingPlugin
        ],

        //debug: true, // Enable verbose errors and logging
    });

    // Ensure we wait for our server to start (this will also load the gateway)
    await server.start();
    app.use(cookieParser());

    // Set up our Express middleware to handle CORS, body parsing,
    // and our expressMiddleware function.
    app.use(
        '/graphql', // Or your desired endpoint
        cors({
            origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:4000', 'http://localhost:4001', 'http://localhost:4002'],
            credentials: true
        }), // Use cors middleware
        express.json(), // Use express.json middleware for body parsing
        // expressMiddleware accepts the same arguments:
        // an Apollo Server instance and optional configuration options
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
                        // Verify token (using the same secret as in the auth service)
                        console.log('JWT_SECRET at gateway:', JWT_SECRET);
                        user = jwt.verify(token, JWT_SECRET);
                        console.log('Token verified at gateway:', user);
                    } catch (err) {
                        console.error('JWT verification failed in gateway:', err.message);
                    }
                }

                req.user = user;
                // The context now includes req, res, token, and user info
                console.log('JWT verification in gateway: req.user:', req.user);

                return { req, res, token, user };
            },
        }),
    );

    // Modified server startup
    await new Promise((resolve) => httpServer.listen({ port: 4000 }, resolve));
    console.log(`🚀 Server ready at http://localhost:4000/graphql`);
}

startApolloServer().catch(error => {
    console.error("Error starting Apollo Gateway:", error);
    process.exit(1);
});
