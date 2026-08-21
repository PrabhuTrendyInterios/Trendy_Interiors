const mongoose = require('mongoose');

const meetingRequestSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
      default: '',
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      required: true,
      default: '',
    },
    phone: {
      type: String,
      trim: true,
      required: true,
      default: '',
    },
    preferredDate: {
      type: String,
      trim: true,
      default: '',
    },
    preferredTime: {
      type: String,
      trim: true,
      default: '',
    },
    message: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Completed', 'Cancelled'],
      default: 'Pending',
      required: true,
    },
    projectType: {
      type: String,
      trim: true,
      default: '',
    },
    propertyLocation: {
      type: String,
      trim: true,
      default: '',
    },
    source: {
      type: String,
      trim: true,
      default: 'chatbot',
    },
    rawData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MeetingRequest', meetingRequestSchema);
