const mongoose = require('mongoose');

const teamMemberSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
      maxlength: 100,
    },
    role: {
      type: String,
      required: [true, 'Please provide a role'],
      trim: true,
      maxlength: 100,
    },
    contact: {
      type: String,
      required: [true, 'Please provide contact information'],
      trim: true,
      maxlength: 100,
    },
    imageUrl: {
      type: String,
      required: [true, 'Please provide an image URL'],
      trim: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    linkedin: {
      type: String,
      trim: true,
      default: '',
    },
    instagram: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

teamMemberSchema.index({ status: 1, displayOrder: 1 });

module.exports = mongoose.model('TeamMember', teamMemberSchema);
