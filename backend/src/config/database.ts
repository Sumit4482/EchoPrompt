import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/echoprompt';

export const connectDatabase = async () => {
  try {
    console.log('🔌 Attempting to connect to MongoDB...');
    
    const connection = await mongoose.connect(MONGODB_URI, {
      // Modern mongoose doesn't require these options, but they're included for clarity
      // useNewUrlParser and useUnifiedTopology are deprecated and not needed
    });

    console.log(`✅ MongoDB connected successfully`);
    console.log(`📍 Database: ${connection.connection.name}`);
    console.log(`🌍 Host: ${connection.connection.host}:${connection.connection.port}`);
    
    return connection;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    
    // Check if it's a connection error and suggest solutions
    if (error instanceof Error) {
      if (error.message.includes('ECONNREFUSED')) {
        console.log('💡 MongoDB server appears to be down. Please ensure MongoDB is running:');
        console.log('   - Install MongoDB: https://docs.mongodb.com/manual/installation/');
        console.log('   - Start MongoDB service: `sudo systemctl start mongod` (Linux) or `brew services start mongodb/brew/mongodb-community` (macOS)');
        console.log('   - Or use MongoDB Atlas: https://www.mongodb.com/cloud/atlas');
      } else if (error.message.includes('authentication')) {
        console.log('💡 Authentication failed. Please check your MongoDB credentials in MONGODB_URI');
      }
    }
    
    // For development, we'll continue without MongoDB but log the error
    console.log('🚧 Continuing in development mode without persistent storage...');
    return null;
  }
};

export const disconnectDatabase = async () => {
  try {
    await mongoose.disconnect();
    console.log('📤 MongoDB disconnected successfully');
  } catch (error) {
    console.error('❌ Error disconnecting from MongoDB:', error);
  }
};

// Handle MongoDB connection events
mongoose.connection.on('connected', () => {
  console.log('🔗 MongoDB connection established');
});

mongoose.connection.on('error', (error) => {
  console.error('🔥 MongoDB connection error:', error);
});

mongoose.connection.on('disconnected', () => {
  console.log('📡 MongoDB disconnected');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await disconnectDatabase();
  process.exit(0);
});

export default {
  connectDatabase,
  disconnectDatabase,
  isConnected: () => mongoose.connection.readyState === 1
};