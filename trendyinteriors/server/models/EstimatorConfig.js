const mongoose = require('mongoose');

// Shape configuration (for multipliers like room shapes affecting pricing)
const shapeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    multiplier: {
      type: Number,
      required: true,
      min: 0.5,
      max: 3,
      default: 1,
    },
    description: {
      type: String,
      trim: true,
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
  { _id: false }
);

// Layout configuration (kitchen, bedroom, etc. layouts)
const layoutSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    description: {
      type: String,
      trim: true,
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
  { _id: false }
);

// Room-specific addon (different from global addons)
const roomAddonSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    description: {
      type: String,
      trim: true,
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
  { _id: false }
);

// Hinge type configuration (for bedroom wardrobes, kitchen cabinets, etc.)
const hingeTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    description: {
      type: String,
      trim: true,
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
  { _id: false }
);

// Room configuration object
const roomConfigSchema = new mongoose.Schema(
  {
    shapes: {
      type: [shapeSchema],
      default: [],
    },
    layouts: {
      type: [layoutSchema],
      default: [],
    },
    hingeTypes: {
      type: [hingeTypeSchema],
      default: [],
    },
    addons: {
      type: [roomAddonSchema],
      default: [],
    },
  },
  { _id: false }
);

// Main EstimatorConfig schema
const estimatorConfigSchema = new mongoose.Schema(
  {
    // Room configurations - only 4 rooms: Kitchen, Bedroom, Hall, Pooja Room
    rooms: {
      Kitchen: {
        type: roomConfigSchema,
        default: () => ({}),
      },
      Bedroom: {
        type: roomConfigSchema,
        default: () => ({}),
      },
      Hall: {
        type: roomConfigSchema,
        default: () => ({}),
      },
      'Pooja Room': {
        type: roomConfigSchema,
        default: () => ({}),
      },
    },
    // Room multipliers for pricing
    roomMultipliers: {
      Hall: {
        type: Number,
        default: 1.15,
      },
      Bedroom: {
        type: Number,
        default: 1,
      },
      Kitchen: {
        type: Number,
        default: 1.35,
      },
      'Pooja Room': {
        type: Number,
        default: 1.2,
      },
      Bathroom: {
        type: Number,
        default: 1.25,
      },
      'Home Office': {
        type: Number,
        default: 1.1,
      },
      'Dining Room': {
        type: Number,
        default: 1.05,
      },
    },
  },
  { timestamps: true }
);

// Ensure only one document exists
estimatorConfigSchema.pre('save', async function (next) {
  if (!this.isNew && this.isModified()) {
    return next();
  }
  if (this.isNew) {
    const count = await this.constructor.countDocuments();
    if (count > 0) {
      throw new Error('Only one EstimatorConfig document is allowed');
    }
  }
  next();
});

module.exports = mongoose.model('EstimatorConfig', estimatorConfigSchema);
