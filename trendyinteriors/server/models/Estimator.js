const mongoose = require('mongoose');

const selectedDesignIdeaSchema = new mongoose.Schema(
  {
    id: { type: String, trim: true },
    name: { type: String, trim: true },
    image: { type: String, trim: true },
    room: { type: String, trim: true },
    planTier: { type: String, trim: true },
    tag: { type: String, trim: true },
  },
  { _id: false }
);

const roomDimensionSchema = new mongoose.Schema(
  {
    length: { type: Number, min: 0 },
    width: { type: Number, min: 0 },
    height: { type: Number, min: 0 },
    selectedDesignIdea: selectedDesignIdeaSchema,
  },
  { _id: false }
);

const roomLineItemSchema = new mongoose.Schema(
  {
    roomId: { type: String, required: true, trim: true },
    roomName: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    areaSqFt: { type: Number, required: true, min: 0 },
    ratePerSqFt: { type: Number, required: true, min: 0 },
    roomMultiplier: { type: Number, required: true, min: 0 },
    estimatedCost: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const quoteSummarySchema = new mongoose.Schema(
  {
    totalAreaSqFt: { type: Number, default: 0, min: 0 },
    estimatedAmount: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: 'USD', trim: true },
    lineItems: { type: [roomLineItemSchema], default: [] },
  },
  { _id: false }
);

const customerInfoSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    location: { type: String, trim: true },
  },
  { _id: false }
);

const estimatorSchema = new mongoose.Schema(
  {
    rooms: {
      type: Map,
      of: Number,
      required: true,
      default: {},
    },
    budgetPlan: {
      type: String,
      required: true,
      enum: ['starter', 'budgetFriendly', 'premium', 'signature'],
      trim: true,
    },
    selectedRoomForDimensions: {
      type: String,
      default: '',
      trim: true,
    },
    roomDimensionsByRoom: {
      type: Map,
      of: roomDimensionSchema,
      default: {},
    },
    quoteSummary: {
      type: quoteSummarySchema,
      default: () => ({
        totalAreaSqFt: 0,
        estimatedAmount: 0,
        currency: 'USD',
        lineItems: [],
      }),
    },
    customerInfo: {
      type: customerInfoSchema,
      default: () => ({}),
    },
    status: {
      type: String,
      enum: ['draft', 'submitted', 'quoted', 'closed'],
      default: 'submitted',
    },
    extraAddons: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Estimator', estimatorSchema);
