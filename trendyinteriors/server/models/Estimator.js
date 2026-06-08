const mongoose = require("mongoose");

const selectedDesignIdeaSchema = new mongoose.Schema(
  {
    layout: {
      type: String,
      trim: true,
      default: "",
    },
    addons: {
      type: [String],
      default: [],
    },
    room: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false }
);

const roomDimensionSchema = new mongoose.Schema(
  {
    length: {
      type: Number,
      min: 0,
      default: 0,
    },
    width: {
      type: Number,
      min: 0,
      default: 0,
    },
    height: {
      type: Number,
      min: 0,
      default: 0,
    },
    selectedDesignIdea: {
      type: selectedDesignIdeaSchema,
      required: false,
      default: () => ({
        layout: "",
        addons: [],
        room: "",
      }),
    },
  },
  { _id: false }
);

const roomLineItemSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      trim: true,
    },
    roomName: {
      type: String,
      required: true,
      trim: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
    length: {
      type: Number,
      min: 0,
      default: 0,
    },
    width: {
      type: Number,
      min: 0,
      default: 0,
    },
    height: {
      type: Number,
      min: 0,
      default: 0,
    },
    areaSqFt: {
      type: Number,
      required: true,
      min: 0,
    },
    ratePerSqFt: {
      type: Number,
      required: true,
      min: 0,
    },
    baseCost: {
      type: Number,
      min: 0,
      default: 0,
    },
    layout: {
      type: String,
      trim: true,
      default: "",
    },
    layoutCost: {
      type: Number,
      min: 0,
      default: 0,
    },
    addons: {
      type: [String],
      default: [],
    },
    addonsCost: {
      type: Number,
      min: 0,
      default: 0,
    },
    addonDetails: {
      type: [
        {
          id: String,
          name: String,
          price: Number,
        },
      ],
      default: [],
    },
    packageComponents: {
      type: [
        {
          id: String,
          name: String,
          description: String,
          price: Number,
          mandatory: Boolean,
        },
      ],
      default: [],
    },
    packageComponentsTotal: {
      type: Number,
      min: 0,
      default: 0,
    },
    estimatedCost: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const quoteSummarySchema = new mongoose.Schema(
  {
    totalAreaSqFt: {
      type: Number,
      default: 0,
      min: 0,
    },
    roomTotals: {
      type: Number,
      default: 0,
      min: 0,
    },
    globalAddonsTotal: {
      type: Number,
      default: 0,
      min: 0,
    },
    estimatedAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      default: "INR",
      trim: true,
    },
    lineItems: {
      type: [roomLineItemSchema],
      default: [],
    },
  },
  { _id: false }
);

const customerInfoSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    location: { type: String, trim: true },
    name: {
      type: String,
      trim: true,
      default: "",
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    location: {
      type: String,
      trim: true,
      default: "",
    },
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
    selectedRoomForDimensions: {
      type: String,
      default: "",
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
        currency: "INR",
        lineItems: [],
      }),
    },
    customerInfo: {
      type: customerInfoSchema,
      default: () => ({}),
    },
    status: {
      type: String,
      enum: ["draft", "submitted", "quoted", "closed"],
      default: "submitted",
    },
    extraAddons: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Estimator", estimatorSchema);
