const mongoose = require('mongoose');

const CONNECT_OPTIONS = {
  serverSelectionTimeoutMS: 8000,
  socketTimeoutMS: 45000,
};

let memoryServer = null;

const summarizeMongoError = (error) => {
  const message = error?.message || String(error);

  if (message.includes("IP that isn't whitelisted") || message.includes('IP whitelist')) {
    return 'Atlas blocked this machine (IP not whitelisted). Add your current IP in MongoDB Atlas → Network Access.';
  }

  if (message.includes('ECONNREFUSED') && message.includes('127.0.0.1')) {
    return 'Local MongoDB is not running on port 27017. Start MongoDB locally or use Atlas with a whitelisted IP.';
  }

  if (message.includes('authentication failed') || message.includes('bad auth')) {
    return 'MongoDB credentials are invalid. Check MONGODB_URI username/password in server/.env.';
  }

  return message.split('\n')[0];
};

const cleanupFailedConnection = async () => {
  if (mongoose.connection.readyState === 0) return;

  try {
    await mongoose.disconnect();
  } catch {
    // Ignore disconnect errors from half-open connections.
  }
};

const connectWithUri = async (uri, label) => {
  const conn = await mongoose.connect(uri, CONNECT_OPTIONS);
  console.log(`MongoDB connected (${label}): ${conn.connection.host}`);
  return conn;
};

const runIndexCleanup = async () => {
  try {
    const collection = mongoose.connection.collection('users');
    const indexExists = await collection.indexExists('username_1');
    if (indexExists) {
      console.log('Detected legacy unique index on "username". Dropping it to fix registration...');
      await collection.dropIndex('username_1');
      console.log('Successfully dropped "username_1" index.');
    }
  } catch (indexErr) {
    console.log('Index cleanup check:', indexErr.message);
  }
};

const connectInMemory = async () => {
  let MongoMemoryServer;
  try {
    ({ MongoMemoryServer } = require('mongodb-memory-server'));
  } catch {
    throw new Error(
      'MONGODB_DEV_MEMORY=true but mongodb-memory-server is not installed. Run: npm install mongodb-memory-server --save-dev'
    );
  }

  memoryServer = await MongoMemoryServer.create();
  const memoryUri = memoryServer.getUri('trendydev');
  console.warn('Using in-memory MongoDB for development (data resets when the server stops).');
  return connectWithUri(memoryUri, 'in-memory dev');
};

const printConnectionHelp = (failures) => {
  console.error('\nMongoDB connection failed for all configured targets:');
  failures.forEach(({ label, error }) => {
    console.error(`  - ${label}: ${summarizeMongoError(error)}`);
  });
  console.error('\nFix options:');
  console.error('  1. Atlas: MongoDB Atlas → Network Access → Add Current IP Address');
  console.error('  2. Local: install/start MongoDB, then keep MONGODB_FALLBACK_LOCAL=true');
  console.error('  3. Dev only: set MONGODB_DEV_MEMORY=true in server/.env for temporary in-memory DB\n');
};

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  const primaryUri = process.env.MONGODB_URI;
  const localUri = process.env.MONGODB_LOCAL_URI || 'mongodb://127.0.0.1:27017/trendydev';
  const fallbackToLocal = process.env.MONGODB_FALLBACK_LOCAL === 'true';
  const preferLocal = process.env.MONGODB_PREFER_LOCAL === 'true';
  const allowDevMemory =
    process.env.NODE_ENV !== 'production' &&
    process.env.MONGODB_DEV_MEMORY === 'true';

  const targets = [];

  if (preferLocal) {
    targets.push({ uri: localUri, label: 'local' });
    if (primaryUri) targets.push({ uri: primaryUri, label: 'atlas' });
  } else {
    if (primaryUri) targets.push({ uri: primaryUri, label: 'atlas' });
    if (fallbackToLocal) targets.push({ uri: localUri, label: 'local fallback' });
  }

  if (targets.length === 0) {
    console.error('No MongoDB URI configured. Set MONGODB_URI in server/.env');
    process.exit(1);
  }

  const failures = [];

  for (const target of targets) {
    try {
      await cleanupFailedConnection();
      const conn = await connectWithUri(target.uri, target.label);
      await runIndexCleanup();
      return conn;
    } catch (error) {
      failures.push({ label: target.label, error });
      console.error(`MongoDB connection failed (${target.label}):`, summarizeMongoError(error));
      await cleanupFailedConnection();
    }
  }

  if (allowDevMemory) {
    try {
      await cleanupFailedConnection();
      const conn = await connectInMemory();
      await runIndexCleanup();
      return conn;
    } catch (error) {
      failures.push({ label: 'in-memory dev', error });
      console.error(`MongoDB connection failed (in-memory dev):`, summarizeMongoError(error));
      await cleanupFailedConnection();
    }
  }

  printConnectionHelp(failures);
  process.exit(1);
};

module.exports = connectDB;
