const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

const seedAdmin = async ({ closeConnection = true } = {}) => {
    try {
        if (closeConnection) {
            await connectDB();
        }

        const adminEmail = 'trendyadmin123@gmail.com';

        // Check if admin exists
        const userExists = await User.findOne({ email: adminEmail });

        if (userExists) {
            console.log('Admin user already exists. Updating details...');
            userExists.password = 'admin123';
            userExists.role = 'admin';
            userExists.isVerified = true;
            await userExists.save();
            console.log('Admin user updated successfully!');
            console.log('Email: ' + adminEmail);
            console.log('Password: admin123');
            return;
        }

        // Create Admin
        // Note: Password will be hashed by the pre-save hook in User model
        const user = await User.create({
            name: 'Trendy Admin',
            email: adminEmail,
            password: 'admin123',
            role: 'admin',
            isVerified: true
        });

        console.log('-----------------------------------');
        console.log('Admin User Created Successfully!');
        console.log('Email: ' + adminEmail);
        console.log('Password: admin123');
        console.log('Role: ' + user.role);
        console.log('-----------------------------------');

        return;
    } catch (error) {
        console.error('Error seeding admin:', error);
        throw error;
    }
};

// If script is run directly, execute seeding and exit.
if (require.main === module) {
    connectDB()
      .then(() => seedAdmin())
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
}

module.exports = seedAdmin;
