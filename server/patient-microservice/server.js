import mongoose from 'mongoose';
import app from './config/express.js';
import config from './config/config.js';

// Connect to MongoDB
mongoose.connect(config.mongoUri)
    .then(() => {
        console.log('Connected to MongoDB');

        // Start server
        app.listen(config.port, () => {
            console.log(`Patient service running on port ${config.port}`);
            console.log(`GraphQL endpoint: http://localhost:${config.port}/graphql`);
        });
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });
