const express = require('express');
const User = require('../../models/User');
const { protect, authorize } = require('../../middleware/authMiddleware');
const { validatePassword } = require('../../utils/passwordValidation');

const router = express.Router();

router.use(protect, authorize('admin'));

// @route   GET /api/cms/admin-users
// @desc    List all admin users
router.get('/', async (req, res) => {
  try {
    const admins = await User.find({ role: 'admin' }).sort({ createdAt: 1 });
    return res.status(200).json({ success: true, data: admins });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/cms/admin-users
// @desc    Create a new admin user
router.post('/', async (req, res) => {
  try {
    let { name, email, password } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }
    if (!password) {
      return res.status(400).json({ success: false, message: 'Password is required' });
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      const errors = Object.values(passwordValidation.errors).filter(Boolean);
      return res.status(400).json({ success: false, message: errors.join('. ') });
    }

    email = email.toLowerCase().trim();
    name = name.trim();

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: `Email ${email} is already in use` });
    }

    const admin = await User.create({ name, email, password, role: 'admin' });

    return res.status(201).json({
      success: true,
      data: { _id: admin._id, name: admin.name, email: admin.email, role: admin.role, createdAt: admin.createdAt },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Email already in use' });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
});

// @route   DELETE /api/cms/admin-users/:id
// @desc    Remove an admin user
router.delete('/:id', async (req, res) => {
  try {
    if (req.params.id === String(req.user._id)) {
      return res.status(400).json({ success: false, message: 'You cannot remove your own admin account' });
    }

    const adminCount = await User.countDocuments({ role: 'admin' });
    if (adminCount <= 1) {
      return res.status(400).json({ success: false, message: 'At least one admin account must remain' });
    }

    const admin = await User.findOneAndDelete({ _id: req.params.id, role: 'admin' });
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin user not found' });
    }

    return res.status(200).json({ success: true, data: {} });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
