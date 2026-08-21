const mongoose = require('mongoose');

const LAYOUT_TYPES = ['L_SHAPE', 'U_SHAPE', 'STRAIGHT'];

const packageComponentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a component name'],
      trim: true,
      maxlength: 100,
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
  },
  { _id: true }
);

const packageSizeSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: [true, 'Please provide a size label'],
      trim: true,
      maxlength: 10,
    },
    dimensions: {
      type: String,
      trim: true,
      maxlength: 50,
      default: '',
    },
    components: {
      type: [packageComponentSchema],
      default: [],
    },
  },
  { _id: true }
);

const packageLayoutSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: {
        values: LAYOUT_TYPES,
        message: '{VALUE} is not a valid layout type',
      },
      required: [true, 'Please provide a layout type'],
      trim: true,
    },
    sizes: {
      type: [packageSizeSchema],
      default: [],
    },
  },
  { _id: true }
);

const packageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a package name'],
      trim: true,
      maxlength: 100,
    },
    roomType: {
      type: String,
      required: [true, 'Please provide a room type'],
      trim: true,
      maxlength: 100,
    },
    layouts: {
      type: [packageLayoutSchema],
      default: [],
    },
    /** @deprecated Legacy flat components — used when `layouts` is empty (backward compatibility) */
    components: {
      type: [packageComponentSchema],
      default: [],
    },
  },
  { timestamps: true }
);

packageSchema.index({ roomType: 1, name: 1 });

/**
 * Resolves components for a layout + size combination.
 * Falls back to legacy root `components` when `layouts` is empty or missing.
 */
const resolvePackageComponents = (packageDoc = {}, layoutType = '', sizeLabel = '') => {
  const layouts = packageDoc.layouts || [];

  if (!layouts.length) {
    return packageDoc.components || [];
  }

  if (!layoutType || !sizeLabel) {
    return [];
  }

  const layoutTypeNormalized = String(layoutType).trim().toUpperCase();
  const sizeLabelNormalized = String(sizeLabel).trim().toUpperCase();

  const matchedLayout = layouts.find(
    (layout) => String(layout.type || '').trim().toUpperCase() === layoutTypeNormalized
  );

  if (!matchedLayout?.sizes?.length) {
    return [];
  }

  const matchedSize = matchedLayout.sizes.find(
    (size) => String(size.label || '').trim().toUpperCase() === sizeLabelNormalized
  );

  return matchedSize?.components || [];
};

packageSchema.methods.resolveComponents = function resolveComponents(layoutType, sizeLabel) {
  return resolvePackageComponents(this, layoutType, sizeLabel);
};

module.exports = mongoose.model('Package', packageSchema);
module.exports.LAYOUT_TYPES = LAYOUT_TYPES;
module.exports.resolvePackageComponents = resolvePackageComponents;
