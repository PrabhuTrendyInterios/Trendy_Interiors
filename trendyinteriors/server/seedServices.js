const mongoose = require('mongoose');
require('dotenv').config();
const Service = require('./models/Service');

const connectDB = async () => {
  if (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2) {
    return;
  }

  const uri = process.env.MONGODB_URI;
  const localUri = process.env.MONGODB_LOCAL_URI || 'mongodb://127.0.0.1:27017/trendydev';
  const fallbackToLocal = process.env.MONGODB_FALLBACK_LOCAL === 'true';

  try {
    if (uri) {
      await mongoose.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
    } else {
      throw new Error('No MongoDB URI configured');
    }
  } catch (error) {
    if (fallbackToLocal) {
      console.log('Attempting fallback to local MongoDB at', localUri);
      await mongoose.connect(localUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
    } else {
      throw error;
    }
  }
};

const seedServices = async ({ closeConnection = true } = {}) => {
    try {
        await connectDB();
        console.log('Connected to MongoDB');

        const servicesData = [
            {
                title: 'Interior Design',
                description: 'Transform your space with our expert interior design services. We create personalized environments that reflect your style and enhance your lifestyle with meticulous attention to detail.',
                icon: '🏛️',
                order: 1,
            },
            {
                title: 'Modern Design',
                description: 'Experience contemporary aesthetics with our modern design solutions. We blend functionality with cutting-edge style to create spaces that are both beautiful and practical.',
                icon: '✨',
                order: 2,
            },
            {
                title: 'Planning & Consultation',
                description: 'Comprehensive planning services from concept to completion. Our expert consultants guide you through every step, ensuring your vision becomes reality with precision and care.',
                icon: '📐',
                order: 3,
            },
        ];

        for (const serviceData of servicesData) {
            await Service.findOneAndUpdate({ title: serviceData.title }, serviceData, {
                upsert: true,
                new: true,
                runValidators: true,
                setDefaultsOnInsert: true,
            });
        }

        const count = await Service.countDocuments();
        console.log(`✅ Successfully seeded ${count} services`);

        if (closeConnection && mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
        }
    } catch (error) {
        console.error('❌ Error seeding services:', error);
        if (closeConnection && mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
        }
        throw error;
    }
};

if (require.main === module) {
    seedServices()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
}

module.exports = seedServices;
