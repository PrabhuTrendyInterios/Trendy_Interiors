const mongoose = require('mongoose');
const Testimonial = require('./models/Testimonial');

async function test() {
  try {
    const mongoUri = 'mongodb://127.0.0.1:27017/trendydev';
    console.log('Connecting to:', mongoUri);
    
    const conn = await mongoose.connect(mongoUri);
    console.log('✓ Connected:', conn.connection.db.databaseName);
    
    // Check collection before insert
    const countBefore = await Testimonial.countDocuments();
    console.log('Documents before:', countBefore);
    
    // Insert one test document
    const testDoc = {
      name: 'Test User',
      postalAddress: 'Test Address',
      mobileNumber: '9999999999',
      testimonialText: 'This is a test testimonial that meets minimum requirements',
      rating: 5,
      approved: true
    };
    
    const result = await Testimonial.create(testDoc);
    console.log('✓ Inserted:', result._id);
    
    // Check count after insert
    const countAfter = await Testimonial.countDocuments();
    console.log('Documents after:', countAfter);
    
    // Find the document
    const found = await Testimonial.findById(result._id);
    console.log('✓ Found:', found.name);
    
    // List all
    const all = await Testimonial.find();
    console.log('Total in collection:', all.length);
    all.forEach(doc => {
      console.log('  -', doc.name, '(approved:', doc.approved + ')');
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    if (error.errors) {
      console.error('Validation errors:', error.errors);
    }
    process.exit(1);
  }
}

test();
