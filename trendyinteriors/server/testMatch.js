const mongoose = require('mongoose');
require('dotenv').config();
const Room = require('./models/Room');

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    const room = await Room.findOne({ name: 'Bedroom' });
    const sizeCategory = "Mid";
    const sizeCategoryNormalized = sizeCategory?.toLowerCase().trim();

    const matchedDimension = room.dimensions.find((dim) => {
      const dimIdString = dim._id?.toString();
      const dimIdField = dim.id;
      const dimNameNormalized = dim.name?.toLowerCase().trim();
      
      const isMatch = 
        dimIdString === sizeCategory || 
        dimIdField === sizeCategory || 
        dim.name === sizeCategory || 
        dimNameNormalized === sizeCategoryNormalized;
      
      console.log(`Checking dim: name=${dim.name}, id=${dim.id}, _id=${dim._id}. isMatch? ${isMatch}`);
      return isMatch;
    });

    console.log("Matched:", matchedDimension ? matchedDimension.name : "None");
    if (matchedDimension) {
      console.log("Components count:", matchedDimension.packageComponents.length);
    }
    mongoose.connection.close();
  })
  .catch(console.error);
