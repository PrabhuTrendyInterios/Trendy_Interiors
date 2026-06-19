const mongoose = require('mongoose');

const packageComponentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a component name'],
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
    price: {
      type: Number,
      required: [true, 'Please provide a price'],
      min: [0, 'Price cannot be negative'],
      default: 0,
    },
    mandatory: {
      type: Boolean,
      default: false,
    },
    displayOrder: {
      type: Number,
      default: 0,
      min: [0, 'Display order cannot be negative'],
    },
  },
  { _id: true }
);

const dimensionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a dimension name'],
      trim: true,
      maxlength: 100,
    },
    length: {
      type: Number,
      min: [0, 'Length cannot be negative'],
      default: 0,
    },
    width: {
      type: Number,
      min: [0, 'Width cannot be negative'],
      default: 0,
    },
    height: {
      type: Number,
      min: [0, 'Height cannot be negative'],
      default: 0,
    },
    packageComponents: {
      type: [packageComponentSchema],
      default: [],
    },
  },
  { _id: true }
);

const layoutMaterialSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    price: {
      type: Number,
      min: [0, 'Price cannot be negative'],
      default: 0,
    },
    mandatory: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true }
);

const layoutConfigurationSchema = new mongoose.Schema(
  {
    dimensionId: {
      type: String,
      required: true,
      description: 'Reference to dimension name or _id',
    },
    materials: {
      type: [layoutMaterialSchema],
      default: [],
    },
  },
  { _id: true }
);

const layoutSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a layout name'],
      trim: true,
      maxlength: 100,
    },
    imageUrl: {
      type: String,
      trim: true,
      default: '',
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
    fixedPrice: {
      type: Number,
      required: [true, 'Please provide a fixed price'],
      min: [0, 'Fixed price cannot be negative'],
      default: 0,
    },
    hasLayoutMaterials: {
      type: Boolean,
      default: false,
    },
    configurations: {
      type: [layoutConfigurationSchema],
      default: [],
    },
  },
  { _id: true }
);

const roomAddonSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide an addon name'],
      trim: true,
      maxlength: 100,
    },
    imageUrl: {
      type: String,
      trim: true,
      default: '',
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
    price: {
      type: Number,
      required: [true, 'Please provide a price'],
      min: [0, 'Price cannot be negative'],
      default: 0,
    },
  },
  { _id: true }
);

const roomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a room name'],
      trim: true,
      unique: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
    imageUrl: {
      type: String,
      trim: true,
      default: '',
    },
    pricePerSqFt: {
      type: Number,
      required: [true, 'Please provide price per sq.ft'],
      min: [0, 'Price per sq.ft cannot be negative'],
      default: 0,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    allowCustomDimensions: {
      type: Boolean,
      default: false,
    },
    requiresDimensions: {
      type: Boolean,
      default: true,
    },
    dimensions: {
      type: [dimensionSchema],
      default: [],
    },
    layouts: {
      type: [layoutSchema],
      default: [],
    },
    addons: {
      type: [roomAddonSchema],
      default: [],
    },
  },
  { timestamps: true }
);

roomSchema.index({ status: 1, name: 1 });

module.exports = mongoose.model('Room', roomSchema);
