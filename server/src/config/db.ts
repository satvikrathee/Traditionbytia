import mongoose from 'mongoose';
import { ENV } from './env.js';

let isChangeStreamSupported = false;

export const connectDB = async (): Promise<typeof mongoose> => {
  try {
    const conn = await mongoose.connect(ENV.MONGODB_URI, {
      serverSelectionTimeoutMS: 20000,
      autoIndex: true,
    });
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);

    // Check if replica set is active (MongoDB Atlas is always a replica set)
    if (conn.connection.host.includes('mongodb.net')) {
      isChangeStreamSupported = true;
      console.log('[Database] MongoDB Atlas Replica Set detected: Change Streams enabled.');
    } else {
      try {
        const adminDb = conn.connection.db?.admin();
        const serverStatus = await adminDb?.command({ replSetGetStatus: 1 });
        if (serverStatus && serverStatus.ok) {
          isChangeStreamSupported = true;
          console.log('[Database] MongoDB Replica Set detected: Change Streams enabled.');
        } else {
          isChangeStreamSupported = false;
        }
      } catch {
        console.log('[Database] Standalone MongoDB detected: Change Streams not supported, using event-driven real-time fallback.');
        isChangeStreamSupported = false;
      }
    }

    return conn;
  } catch (error) {
    console.error('[Database] MongoDB Connection Error:', error);
    throw error;
  }
};

export const getIsChangeStreamSupported = () => isChangeStreamSupported;
