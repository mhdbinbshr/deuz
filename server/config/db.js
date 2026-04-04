
import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    // Disable buffering so queries fail immediately if not connected
    mongoose.set('bufferCommands', false);

    let uri = process.env.MONGO_URI;

    if (!uri) {
      console.log('No MONGO_URI provided, skipping MongoDB connection to prevent crash.');
      return;
    }

    const conn = await mongoose.connect(uri, {
      // Mongoose 6+ defaults these to true, but keeping for clarity if using older versions
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    // Do not exit process, allow server to start and serve frontend
  }
};

export { connectDB };
