const mongoose = require('mongoose');
const Testimonial = require('./models/Testimonial');

async function diagnose() {
  try {
    const mongoUri = 'mongodb://127.0.0.1:27017/trendydev';
    console.log('Connecting to:', mongoUri);
    
    // Enable mongoose debug logging
    mongoose.set('debug', true);
    
    const conn = await mongoose.connect(mongoUri);
    console.log('Connected to:', conn.connection.db.databaseName);
    console.log('Connection host:', conn.connection.host);
    
    // Get collection info
    const collections = await conn.connection.db.listCollections().toArray();
    console.log('\nCollections in database:');
    collections.forEach(c => console.log('  -', c.name));
    
    // Check testimonials collection
    const testimonialsCollection = conn.connection.collection('testimonials');
    const collectionStats = await testimonialsCollection.countDocuments();
    console.log('\nDirect collection count:', collectionStats);
    
    // Try via model
    const modelCount = await Testimonial.countDocuments();
    console.log('Model count:', modelCount);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

diagnose();
