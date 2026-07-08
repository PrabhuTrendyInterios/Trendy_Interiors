const mongoose = require('mongoose');
require('dotenv').config();
const Room = require('./models/Room');

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    const bedroom = await Room.findOne({ name: 'Bedroom' });
    console.log("Bedroom Dimensions:", JSON.stringify(bedroom.dimensions.map(d => ({ name: d.name, componentsCount: d.packageComponents.length })), null, 2));
    mongoose.connection.close();
  })
  .catch(console.error);
