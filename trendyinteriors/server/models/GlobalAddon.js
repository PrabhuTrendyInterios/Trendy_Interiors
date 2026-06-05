const mongoose = require('mongoose');

const globalAddonSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide addon name'],
      trim: true,
      maxlength: 100,
      unique: true,
    },
    price: {
      type: Number,
      required: [true, 'Please provide addon price'],
      min: [0, 'Price cannot be negative'],
      default: 0,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 300,
    },
    applicableRooms: {
      type: [String],
      enum: ['Kitchen', 'Bedroom', 'Hall', 'Pooja Room'],
      default: ['Hall'],
    },
    active: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('GlobalAddon', globalAddonSchema);
