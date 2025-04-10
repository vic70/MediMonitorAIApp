import 'dotenv/config';

const config = {
    server: {
        port: process.env.PORT || 4000,
    },
    port: process.env.PORT || 4000,
    nodeEnv: process.env.NODE_ENV || 'development',
    jwtSecret: process.env.JWT_SECRET || 'my_secret_key',
};

export default config;