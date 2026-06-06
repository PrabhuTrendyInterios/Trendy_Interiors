const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a project title'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please add a description'],
    },
    category: {
      type: String,
      required: [true, 'Please select a category'],
      trim: true,
      lowercase: true,
    },
    coverImageUrl: {
      type: String,
      required: [true, 'Please add a cover image URL'],
      trim: true,
    },
    galleryImages: {
      type: [String],
      default: [],
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
  },
  { timestamps: true }
);

projectSchema.index({ status: 1, displayOrder: 1, createdAt: -1 });

module.exports = mongoose.model('Project', projectSchema);
