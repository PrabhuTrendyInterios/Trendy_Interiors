jest.mock('../../models/User', () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
}));
jest.mock('jsonwebtoken', () => ({ sign: jest.fn(() => 'jwt-token') }));
jest.mock('../../utils/passwordValidation', () => ({
  validatePassword: jest.fn(),
}));
jest.mock('../../utils/mail', () => {
  const fn = jest.fn();
  fn.sendAdminEmail = jest.fn();
  return fn;
});
jest.mock('crypto', () => ({
  randomBytes: jest.fn(() => ({
    toString: jest.fn(() => 'reset-token-hash'),
  })),
}));

const User = require('../../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { validatePassword } = require('../../utils/passwordValidation');
const { sendAdminEmail } = require('../../utils/mail');
const controller = require('../../controllers/authController');
const { createMockRes } = require('../helpers/mockExpress');

describe('server/controllers/authController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'secret';
    process.env.JWT_EXPIRE = '30d';
  });

  // REGISTER TESTS
  describe('register', () => {
    test('register returns 400 when name is missing', async () => {
      const req = { body: { name: '', email: 'test@example.com', password: 'secret12' } };
      const res = createMockRes();

      await controller.register(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.stringContaining('Name')
      }));
    });

    test('register returns 400 when email is missing', async () => {
      const req = { body: { name: 'Test', email: '', password: 'secret12' } };
      const res = createMockRes();

      await controller.register(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.stringContaining('Email')
      }));
    });

    test('register returns 400 when password is missing', async () => {
      const req = { body: { name: 'Test', email: 'test@example.com', password: '' } };
      const res = createMockRes();

      await controller.register(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.stringContaining('Password')
      }));
    });

    test('register returns 400 when password is too short', async () => {
      const req = { body: { name: 'Test', email: 'test@example.com', password: 'short' } };
      const res = createMockRes();

      await controller.register(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.stringContaining('at least 6 characters')
      }));
    });

    test('register returns 400 when email already exists', async () => {
      User.findOne.mockResolvedValue({ _id: 'u1', email: 'test@example.com' });

      const req = { body: { name: 'Test', email: 'test@example.com', password: 'secret123' } };
      const res = createMockRes();

      await controller.register(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.stringContaining('already taken')
      }));
    });

    test('register creates user and returns token response', async () => {
      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue({
        _id: 'u1',
        name: 'Asha',
        email: 'asha@example.com',
        role: 'user',
        createdAt: new Date(),
      });

      const req = { body: { name: 'Asha', email: 'ASHA@example.com', password: 'secret123' } };
      const res = createMockRes();

      await controller.register(req, res, jest.fn());

      expect(User.create).toHaveBeenCalledWith({
        name: 'Asha',
        email: 'asha@example.com',
        password: 'secret123',
      });
      expect(jwt.sign).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        token: 'jwt-token'
      }));
    });

    test('register handles duplicate key error from database', async () => {
      User.findOne.mockResolvedValue(null);
      User.create.mockRejectedValue({
        code: 11000,
        keyPattern: { email: 1 },
        keyValue: { email: 'test@example.com' }
      });

      const req = { body: { name: 'Test', email: 'test@example.com', password: 'secret123' } };
      const res = createMockRes();

      await controller.register(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.stringContaining('Email')
      }));
    });

    test('register handles validation errors', async () => {
      User.findOne.mockResolvedValue(null);
      User.create.mockRejectedValue({
        name: 'ValidationError',
        errors: {
          email: { message: 'Invalid email' },
          name: { message: 'Name required' }
        }
      });

      const req = { body: { name: '', email: 'bad', password: 'secret123' } };
      const res = createMockRes();

      await controller.register(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('register handles general server error', async () => {
      User.findOne.mockResolvedValue(null);
      User.create.mockRejectedValue(new Error('Database connection failed'));

      const req = { body: { name: 'Test', email: 'test@example.com', password: 'secret123' } };
      const res = createMockRes();

      await controller.register(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.stringContaining('Database connection failed')
      }));
    });
  });

  // LOGIN TESTS
  describe('login', () => {
    test('login returns 400 when email or password missing', async () => {
      const req = { body: { email: '', password: '' } };
      const res = createMockRes();

      await controller.login(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.stringContaining('email and password')
      }));
    });

    test('login returns 401 when user not found', async () => {
      User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });

      const req = { body: { email: 'missing@example.com', password: 'secret123' } };
      const res = createMockRes();

      await controller.login(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Invalid credentials'
      }));
    });

    test('login returns 401 when password incorrect', async () => {
      const mockUser = {
        _id: 'u1',
        name: 'Test',
        email: 'test@example.com',
        role: 'user',
        createdAt: new Date(),
        matchPassword: jest.fn().mockResolvedValue(false)
      };
      User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(mockUser) });

      const req = { body: { email: 'test@example.com', password: 'wrongpassword' } };
      const res = createMockRes();

      await controller.login(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Invalid credentials'
      }));
    });

    test('login succeeds and returns token', async () => {
      const mockUser = {
        _id: 'u1',
        name: 'Test',
        email: 'test@example.com',
        role: 'user',
        createdAt: new Date(),
        matchPassword: jest.fn().mockResolvedValue(true)
      };
      User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(mockUser) });

      const req = { body: { email: 'test@example.com', password: 'secret123' } };
      const res = createMockRes();

      await controller.login(req, res, jest.fn());

      expect(jwt.sign).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        token: 'jwt-token'
      }));
    });

    test('login sends admin email when admin user logs in', async () => {
      const originalAdminEmail = process.env.ADMIN_EMAIL;
      process.env.ADMIN_EMAIL = 'trendyadmin123@gmail.com';
      const mockUser = {
        _id: 'u1',
        name: 'Admin',
        email: 'admin@example.com',
        role: 'admin',
        createdAt: new Date(),
        matchPassword: jest.fn().mockResolvedValue(true)
      };
      User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(mockUser) });

      const req = { body: { email: 'admin@example.com', password: 'secret123' } };
      const res = createMockRes();

      await controller.login(req, res, jest.fn());

      expect(sendAdminEmail).toHaveBeenCalledWith(expect.objectContaining({
        to: 'trendyadmin123@gmail.com',
        subject: expect.stringContaining('Login Alert')
      }));
      process.env.ADMIN_EMAIL = originalAdminEmail;
    });

    test('login succeeds even if admin email fails', async () => {
      const mockUser = {
        _id: 'u1',
        name: 'Admin',
        email: 'admin@example.com',
        role: 'admin',
        createdAt: new Date(),
        matchPassword: jest.fn().mockResolvedValue(true)
      };
      User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(mockUser) });
      sendAdminEmail.mockRejectedValue(new Error('Email failed'));

      const req = { body: { email: 'admin@example.com', password: 'secret123' } };
      const res = createMockRes();

      await controller.login(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true
      }));
    });
  });

  // GETME TESTS
  describe('getMe', () => {
    test('getMe returns current user', async () => {
      const mockUser = {
        _id: 'u1',
        name: 'Test',
        email: 'test@example.com',
        role: 'user'
      };
      User.findById.mockResolvedValue(mockUser);

      const req = { user: { id: 'u1' } };
      const res = createMockRes();

      await controller.getMe(req, res, jest.fn());

      expect(User.findById).toHaveBeenCalledWith('u1');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: mockUser
      }));
    });

    test('getMe handles error', async () => {
      User.findById.mockRejectedValue(new Error('DB Error'));

      const req = { user: { id: 'u1' } };
      const res = createMockRes();
      const next = jest.fn();

      await controller.getMe(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  // UPDATEDETAILS TESTS
  describe('updateDetails', () => {
    test('updateDetails updates user name and email', async () => {
      const updatedUser = {
        _id: 'u1',
        name: 'Updated',
        email: 'updated@example.com',
        role: 'user'
      };
      User.findByIdAndUpdate.mockResolvedValue(updatedUser);

      const req = {
        user: { id: 'u1' },
        body: { name: 'Updated', email: 'updated@example.com' }
      };
      const res = createMockRes();

      await controller.updateDetails(req, res, jest.fn());

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith('u1', 
        { name: 'Updated', email: 'updated@example.com' },
        { new: true, runValidators: true }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: updatedUser
      }));
    });

    test('updateDetails handles error', async () => {
      User.findByIdAndUpdate.mockRejectedValue(new Error('Update failed'));

      const req = {
        user: { id: 'u1' },
        body: { name: 'Updated', email: 'updated@example.com' }
      };
      const res = createMockRes();
      const next = jest.fn();

      await controller.updateDetails(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  // CHANGEPASSWORD TESTS
  describe('changePassword', () => {
    test('changePassword returns 400 when fields missing', async () => {
      const req = {
        user: { id: 'u1' },
        body: { currentPassword: '', newPassword: '', confirmPassword: '' }
      };
      const res = createMockRes();

      await controller.changePassword(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.stringContaining('required fields')
      }));
    });

    test('changePassword returns 400 when new passwords do not match', async () => {
      const req = {
        user: { id: 'u1' },
        body: {
          currentPassword: 'Old@1234',
          newPassword: 'New@1234',
          confirmPassword: 'Different@1234'
        }
      };
      const res = createMockRes();

      await controller.changePassword(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.stringContaining('do not match')
      }));
    });

    test('changePassword rejects weak new password', async () => {
      validatePassword.mockReturnValue({
        isValid: false,
        errors: { minLength: 'Password must be at least 8 characters', uppercase: '', symbol: '' },
      });

      const req = {
        user: { id: 'u1' },
        body: {
          currentPassword: 'Old@1234',
          newPassword: 'weak',
          confirmPassword: 'weak',
        },
      };
      const res = createMockRes();

      await controller.changePassword(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.stringContaining('8 characters')
      }));
    });

    test('changePassword rejects same password', async () => {
      validatePassword.mockReturnValue({
        isValid: true,
        errors: {},
      });
      const mockUser = {
        _id: 'u1',
        matchPassword: jest.fn().mockResolvedValue(true),
        save: jest.fn()
      };
      User.findById.mockResolvedValue(mockUser);

      const req = {
        user: { id: 'u1' },
        body: {
          currentPassword: 'Old@1234',
          newPassword: 'Old@1234',
          confirmPassword: 'Old@1234',
        },
      };
      const res = createMockRes();

      await controller.changePassword(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.stringContaining('different from current')
      }));
    });

    test('changePassword returns 404 when user not found', async () => {
      validatePassword.mockReturnValue({
        isValid: true,
        errors: {},
      });
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      const req = {
        user: { id: 'u1' },
        body: {
          currentPassword: 'Old@1234',
          newPassword: 'New@1234',
          confirmPassword: 'New@1234',
        },
      };
      const res = createMockRes();

      await controller.changePassword(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'User not found'
      }));
    });

    test('changePassword returns 400 when current password incorrect', async () => {
      validatePassword.mockReturnValue({
        isValid: true,
        errors: {},
      });
      const mockUser = {
        _id: 'u1',
        matchPassword: jest.fn().mockResolvedValue(false),
        save: jest.fn()
      };
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      const req = {
        user: { id: 'u1' },
        body: {
          currentPassword: 'Wrong@1234',
          newPassword: 'New@1234',
          confirmPassword: 'New@1234',
        },
      };
      const res = createMockRes();

      await controller.changePassword(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Current password is incorrect'
      }));
    });

    test('changePassword succeeds and sends admin email', async () => {
      validatePassword.mockReturnValue({
        isValid: true,
        errors: {},
      });
      const mockUser = {
        _id: 'u1',
        name: 'Admin',
        email: 'admin@example.com',
        role: 'admin',
        matchPassword: jest.fn().mockResolvedValue(true),
        save: jest.fn()
      };
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      const req = {
        user: { id: 'u1' },
        body: {
          currentPassword: 'Old@1234',
          newPassword: 'New@1234',
          confirmPassword: 'New@1234',
        },
      };
      const res = createMockRes();

      await controller.changePassword(req, res, jest.fn());

      expect(mockUser.save).toHaveBeenCalled();
      expect(sendAdminEmail).toHaveBeenCalledWith(expect.objectContaining({
        subject: expect.stringContaining('Password Changed')
      }));
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  // FORGOTPASSWORD TESTS
  describe('forgotPassword', () => {
    test('forgotPassword returns 400 when email missing', async () => {
      const req = { body: { email: '' } };
      const res = createMockRes();

      await controller.forgotPassword(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('forgotPassword returns generic success when user not found', async () => {
      User.findOne.mockResolvedValue(null);

      const req = { body: { email: 'missing@example.com' } };
      const res = createMockRes();

      await controller.forgotPassword(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(200);
      expect(sendAdminEmail).not.toHaveBeenCalled();
    });

    test('forgotPassword sends OTP to admin when user found', async () => {
      const mockUser = {
        _id: 'u1',
        email: 'test@example.com',
        save: jest.fn()
      };
      User.findOne.mockResolvedValue(mockUser);
      sendAdminEmail.mockResolvedValue({});

      const req = { body: { email: 'test@example.com' } };
      const res = createMockRes();

      await controller.forgotPassword(req, res, jest.fn());

      expect(mockUser.save).toHaveBeenCalled();
      expect(sendAdminEmail).toHaveBeenCalledWith(expect.objectContaining({
        subject: expect.stringContaining('OTP')
      }));
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('forgotPassword handles email error', async () => {
      const mockUser = {
        _id: 'u1',
        email: 'test@example.com',
        save: jest.fn()
      };
      User.findOne.mockResolvedValue(mockUser);
      sendAdminEmail.mockRejectedValue(new Error('Email service down'));

      const req = { body: { email: 'test@example.com' } };
      const res = createMockRes();

      await controller.forgotPassword(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.stringContaining('Could not send OTP')
      }));
    });
  });

  // VERIFYRESETOTP TESTS
  describe('verifyResetOTP', () => {
    test('verifyResetOTP returns 400 when email or otp missing', async () => {
      const req = { body: { email: '', otp: '' } };
      const res = createMockRes();

      await controller.verifyResetOTP(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('verifyResetOTP returns 400 when OTP invalid or expired', async () => {
      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      const req = { body: { email: 'test@example.com', otp: 'wrongotp' } };
      const res = createMockRes();

      await controller.verifyResetOTP(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.stringContaining('Invalid or expired')
      }));
    });

    test('verifyResetOTP succeeds and returns reset token', async () => {
      const mockUser = {
        _id: 'u1',
        email: 'test@example.com',
        resetOTP: '123456',
        resetOTPExpire: Date.now() + 10 * 60 * 1000,
        save: jest.fn()
      };
      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      const req = { body: { email: 'test@example.com', otp: '123456' } };
      const res = createMockRes();

      await controller.verifyResetOTP(req, res, jest.fn());

      expect(mockUser.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        resetToken: 'reset-token-hash'
      }));
    });
  });

  // RESETPASSWORD TESTS
  describe('resetPassword', () => {
    test('resetPassword returns 400 when fields missing', async () => {
      const req = { body: { resetToken: '', password: '', confirmPassword: '' } };
      const res = createMockRes();

      await controller.resetPassword(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('resetPassword returns 400 when passwords do not match', async () => {
      const req = {
        body: {
          resetToken: 'token',
          password: 'Pass@123',
          confirmPassword: 'Different@123'
        }
      };
      const res = createMockRes();

      await controller.resetPassword(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.stringContaining('do not match')
      }));
    });

    test('resetPassword returns 400 when password weak', async () => {
      validatePassword.mockReturnValue({
        isValid: false,
        errors: { minLength: 'Password must be at least 8 characters' },
      });

      const req = {
        body: {
          resetToken: 'token',
          password: 'weak',
          confirmPassword: 'weak'
        }
      };
      const res = createMockRes();

      await controller.resetPassword(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('resetPassword returns 400 when reset token invalid', async () => {
      validatePassword.mockReturnValue({
        isValid: true,
        errors: {},
      });
      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      const req = {
        body: {
          resetToken: 'invalidtoken',
          password: 'Pass@1234',
          confirmPassword: 'Pass@1234'
        }
      };
      const res = createMockRes();

      await controller.resetPassword(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Invalid reset token'
      }));
    });

    test('resetPassword succeeds', async () => {
      validatePassword.mockReturnValue({
        isValid: true,
        errors: {},
      });
      const mockUser = {
        _id: 'u1',
        name: 'Admin',
        email: 'admin@example.com',
        role: 'admin',
        save: jest.fn()
      };
      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      const req = {
        body: {
          resetToken: 'validtoken',
          password: 'Pass@1234',
          confirmPassword: 'Pass@1234'
        }
      };
      const res = createMockRes();

      await controller.resetPassword(req, res, jest.fn());

      expect(mockUser.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Password reset successfully'
      }));
    });
  });

  // SENDCHANGEPASSWORDOTP TESTS
  describe('sendChangePasswordOTP', () => {
    test('sendChangePasswordOTP returns 404 when user not found', async () => {
      User.findById.mockResolvedValue(null);

      const req = { user: { id: 'u1' } };
      const res = createMockRes();

      await controller.sendChangePasswordOTP(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(404);
    });

    test('sendChangePasswordOTP sends OTP to admin', async () => {
      const mockUser = {
        _id: 'u1',
        save: jest.fn()
      };
      User.findById.mockResolvedValue(mockUser);
      sendAdminEmail.mockResolvedValue({});

      const req = { user: { id: 'u1' } };
      const res = createMockRes();

      await controller.sendChangePasswordOTP(req, res, jest.fn());

      expect(mockUser.save).toHaveBeenCalled();
      expect(sendAdminEmail).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('sendChangePasswordOTP handles email error', async () => {
      const mockUser = {
        _id: 'u1',
        save: jest.fn()
      };
      User.findById.mockResolvedValue(mockUser);
      sendAdminEmail.mockRejectedValue(new Error('Email failed'));

      const req = { user: { id: 'u1' } };
      const res = createMockRes();

      await controller.sendChangePasswordOTP(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // CHANGEPASSWORDWITHOTP TESTS
  describe('changePasswordWithOTP', () => {
    test('changePasswordWithOTP returns 400 when fields missing', async () => {
      const req = {
        user: { id: 'u1' },
        body: { otp: '', newPassword: '', confirmPassword: '' }
      };
      const res = createMockRes();

      await controller.changePasswordWithOTP(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('changePasswordWithOTP returns 400 when passwords do not match', async () => {
      const req = {
        user: { id: 'u1' },
        body: {
          otp: '123456',
          newPassword: 'Pass@1234',
          confirmPassword: 'Different@1234'
        }
      };
      const res = createMockRes();

      await controller.changePasswordWithOTP(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('changePasswordWithOTP returns 400 when password weak', async () => {
      validatePassword.mockReturnValue({
        isValid: false,
        errors: { minLength: 'Password must be at least 8 characters' },
      });

      const req = {
        user: { id: 'u1' },
        body: {
          otp: '123456',
          newPassword: 'weak',
          confirmPassword: 'weak'
        }
      };
      const res = createMockRes();

      await controller.changePasswordWithOTP(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('changePasswordWithOTP returns 404 when user not found', async () => {
      validatePassword.mockReturnValue({
        isValid: true,
        errors: {},
      });
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      const req = {
        user: { id: 'u1' },
        body: {
          otp: '123456',
          newPassword: 'Pass@1234',
          confirmPassword: 'Pass@1234'
        }
      };
      const res = createMockRes();

      await controller.changePasswordWithOTP(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(404);
    });

    test('changePasswordWithOTP returns 400 when OTP invalid', async () => {
      validatePassword.mockReturnValue({
        isValid: true,
        errors: {},
      });
      const mockUser = {
        _id: 'u1',
        changePasswordOTP: '654321',
        changePasswordOTPExpire: Date.now() + 10 * 60 * 1000,
        matchPassword: jest.fn()
      };
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      const req = {
        user: { id: 'u1' },
        body: {
          otp: '123456',
          newPassword: 'Pass@1234',
          confirmPassword: 'Pass@1234'
        }
      };
      const res = createMockRes();

      await controller.changePasswordWithOTP(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Invalid or expired OTP'
      }));
    });

    test('changePasswordWithOTP returns 400 when same as current password', async () => {
      validatePassword.mockReturnValue({
        isValid: true,
        errors: {},
      });
      const mockUser = {
        _id: 'u1',
        name: 'Test',
        email: 'test@example.com',
        changePasswordOTP: '123456',
        changePasswordOTPExpire: Date.now() + 10 * 60 * 1000,
        matchPassword: jest.fn().mockResolvedValue(true),
        save: jest.fn()
      };
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      const req = {
        user: { id: 'u1' },
        body: {
          otp: '123456',
          newPassword: 'Pass@1234',
          confirmPassword: 'Pass@1234'
        }
      };
      const res = createMockRes();

      await controller.changePasswordWithOTP(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.stringContaining('different')
      }));
    });

    test('changePasswordWithOTP succeeds', async () => {
      validatePassword.mockReturnValue({
        isValid: true,
        errors: {},
      });
      const mockUser = {
        _id: 'u1',
        name: 'Admin',
        email: 'admin@example.com',
        role: 'admin',
        changePasswordOTP: '123456',
        changePasswordOTPExpire: Date.now() + 10 * 60 * 1000,
        matchPassword: jest.fn().mockResolvedValue(false),
        save: jest.fn()
      };
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      const req = {
        user: { id: 'u1' },
        body: {
          otp: '123456',
          newPassword: 'Pass@1234',
          confirmPassword: 'Pass@1234'
        }
      };
      const res = createMockRes();

      await controller.changePasswordWithOTP(req, res, jest.fn());

      expect(mockUser.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Password changed successfully'
      }));
    });
  });
});
