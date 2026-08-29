const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userName: { type: String, trim: true, default: 'Unknown' },
    userEmail: { type: String, trim: true, default: '' },
    action: { type: String, required: true, trim: true },
    resource: { type: String, required: true, trim: true },
    method: { type: String, trim: true },
    path: { type: String, trim: true },
    statusCode: { type: Number },
  },
  { timestamps: true }
);

activityLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
