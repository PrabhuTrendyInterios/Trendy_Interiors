const { MongoClient } = require('mongodb');
require('dotenv').config();

const seedTestimonials = async () => {
  let client;
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/trendydev';
    console.log('Connecting to:', mongoUri);
    
    client = new MongoClient(mongoUri);
    await client.connect();
    console.log('✓ Connected to MongoDB');

    const db = client.db('trendydev');
    const collection = db.collection('testimonials');

    // Clear existing testimonials
    const deleteResult = await collection.deleteMany({});
    console.log(`✓ Cleared ${deleteResult.deletedCount} existing testimonials`);

    // Create sample testimonials
    const testimonials = [
      {
        name: 'Jennifer Winget',
        postalAddress: 'Mumbai, India',
        mobileNumber: '9876543210',
        testimonialText: "The team at Trendy Interiors transformed our villa into a dream home. The attention to detail in the living room and modular kitchen design was simply outstanding. Highly recommended!",
        rating: 5,
        approved: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Dr. Rajesh Kumar',
        postalAddress: 'Bangalore, India',
        mobileNumber: '9876543211',
        testimonialText: "We wanted a waiting room that felt calm and luxurious for our patients. The design they proposed was perfect. Even after 2 years, we still get compliments on the interior.",
        rating: 5,
        approved: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Ananya Pandey',
        postalAddress: 'Chennai, India',
        mobileNumber: '9876543212',
        testimonialText: "Creative and professional. They understood my requirement for a minimalist studio space and delivered exactly what I envisioned. The color palette selection was spot on.",
        rating: 4,
        approved: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Vikram Singh',
        postalAddress: 'Hyderabad, India',
        mobileNumber: '9876543213',
        testimonialText: "From the initial consultation to the final handover, the experience was seamless. Their craftsmanship in woodwork and custom furniture is world-class.",
        rating: 5,
        approved: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Priya Sharma',
        postalAddress: 'Delhi, India',
        mobileNumber: '9876543214',
        testimonialText: "Absolutely stunning transformation! The bedroom and bathroom designs are beyond my expectations. The team was professional and delivered on time.",
        rating: 5,
        approved: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Rajesh Verma',
        postalAddress: 'Pune, India',
        mobileNumber: '9876543215',
        testimonialText: "Great service and excellent quality. The modular kitchen is very functional. Highly satisfied with the work done.",
        rating: 4,
        approved: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const insertResult = await collection.insertMany(testimonials);
    const inserted = insertResult.insertedIds.length;
    const approved = testimonials.filter(t => t.approved).length;
    const pending = testimonials.filter(t => !t.approved).length;
    
    console.log(`✓ Seeded ${inserted} testimonials`);
    console.log(`  - Approved: ${approved}`);
    console.log(`  - Pending: ${pending}`);
    
    // Verify
    const verify = await collection.countDocuments();
    console.log(`\nVerification - Total in DB: ${verify}`);

    await client.close();
    console.log('✓ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
};

seedTestimonials();
