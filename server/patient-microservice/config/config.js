import dotenv from 'dotenv';

dotenv.config();

export default {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 4002,
    jwtSecret: process.env.JWT_SECRET || 'my_secret_key',
    mongoUri: (process.env.MONGODB_URI || process.env.MONGO_HOST || `mongodb://${process.env.IP || "localhost"}:${process.env.MONGO_PORT || "27017"}`) + "/" + process.env.databaseName,
};
