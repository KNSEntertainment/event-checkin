import mongoose from 'mongoose';
import { connectDB } from './database-mongodb';

let isConnected = false;

export const initializeDatabase = async () => {
  if (!isConnected) {
    try {
      await connectDB();
      isConnected = true;
      console.log('✅ Database initialized and connected');
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      throw error;
    }
  }
};

export const isDatabaseConnected = () => isConnected;
