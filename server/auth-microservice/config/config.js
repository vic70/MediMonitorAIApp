import 'dotenv/config';

const config = {
    server: {
        port: process.env.PORT || 4001,
    },
    port: process.env.PORT || 4001,
    nodeEnv: process.env.NODE_ENV || 'development',
    jwtSecret: process.env.JWT_SECRET || 'my_secret_key',
    mongoUri: (process.env.MONGODB_URI || process.env.MONGO_HOST || `mongodb://${process.env.IP || "localhost"}:${process.env.MONGO_PORT || "27017"}`) + "/" + process.env.databaseName,
};

export default config;