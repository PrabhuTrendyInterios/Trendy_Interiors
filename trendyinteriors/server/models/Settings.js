const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    currency: {
      type: String,
      trim: true,
      default: 'INR',
      maxlength: 10,
    },
    companyName: {
      type: String,
      trim: true,
      default: 'Trendy Interios',
      maxlength: 150,
    },
    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    contactPhone: {
      type: String,
      trim: true,
      default: '',
    },
    contactAddress: {
      type: String,
      trim: true,
      default: '',
    },
    estimatorEnabled: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

settingsSchema.pre('save', async function enforceSingleton(next) {
  if (this.isNew) {
    const count = await this.constructor.countDocuments();
    if (count > 0) {
      return next(new Error('Only one Settings document is allowed'));
    }
  }
  next();
});

module.exports = mongoose.model('Settings', settingsSchema);
