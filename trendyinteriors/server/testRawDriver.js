const mongoose = require('mongoose');

async function test() {
  try {
    const mongoUri = 'mongodb://127.0.0.1:27017/trendydev';
    const conn = await mongoose.connect(mongoUri);
    
    const collection = conn.connection.collection('testimonials');
    
    // Clear
    await collection.deleteMany({});
    console.log('Cleared collection');
    
    // Insert using raw driver
    const result = await collection.insertOne({
      name: 'Test User',
      postalAddress: 'Test Address',
      mobileNumber: '9999999999',
      testimonialText: 'This is a test testimonial that meets minimum requirements',
      rating: 5,
      approved: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log('Inserted:', result.insertedId);
    
    // Find using raw driver
    const count = await collection.countDocuments();
    console.log('Count after insert:', count);
    
    const doc = await collection.findOne({});
    console.log('Found doc:', doc?.name);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

test();
