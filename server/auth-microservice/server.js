
import mongoose from 'mongoose';
import config from './config/config.js';
import app from './config/express.js';

const mongoUri = config.mongoUri;
const port = config.server.port;

const connectDB = async () => {
    try {
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB database successfully!');
    } catch (error) {
        console.error('MongoDB connection failed:', error);
    }
}


connectDB();

app.listen(port, () => {
    console.log(`mongoUri: ${mongoUri}`);
    console.log(`Server is running on port ${port}`);
    console.log(`🚀 Server ready at http://localhost:${port}/graphql`);
})
//Testing purpose