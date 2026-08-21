const mongoose = require('mongoose');
require('dotenv').config();
const Category = require('./models/Category');
const connectDB = require('./config/db');

const seedCategories = async ({ closeConnection = true } = {}) => {
    try {
        await connectDB();

        const defaultCategories = [
            {
                name: 'residential',
                displayName: 'Residential',
                description: 'Residential interior design projects',
                order: 1,
                isActive: true
            },
            {
                name: 'commercial',
                displayName: 'Commercial',
                description: 'Commercial and office interior projects',
                order: 2,
                isActive: true
            },
            {
                name: 'art-craft',
                displayName: 'Art & Craft',
                description: 'Art and craft projects',
                order: 3,
                isActive: true
            }
        ];

        for (const category of defaultCategories) {
            await Category.findOneAndUpdate({ name: category.name }, category, {
                upsert: true,
                new: true,
                runValidators: true,
                setDefaultsOnInsert: true,
            });
        }

        console.log('✓ Default categories seeded successfully');

        if (closeConnection && mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
        }
    } catch (error) {
        console.error('Error seeding categories:', error.message);
        if (closeConnection && mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
        }
        throw error;
    }
};

if (require.main === module) {
    seedCategories()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}

module.exports = seedCategories;
