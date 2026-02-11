import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars if not already loaded
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const connectDB = async () => {
    try {
        const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
        if (!uri) {
            console.warn('[DB] MongoDB connection URI not found in environment variables');
            console.warn('[DB] Database features will be unavailable');
            return;
        }
        const conn = await mongoose.connect(uri);
        console.log(`[DB] ✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error: any) {
        console.error(`[DB] ❌ Connection Error: ${error.message}`);
        console.error('[DB] Server will continue without database. Static files only.');
        // Don't exit - allow server to continue serving static files
    }
};

export default connectDB;
