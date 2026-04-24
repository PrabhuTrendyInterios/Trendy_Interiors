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

const User = require('../../models/User');
const jwt = require('jsonwebtoken');
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

  test('register returns 400 when required fields are missing', async () => {
    const req = { body: { name: '', email: '', password: '' } };
    const res = createMockRes();

    await controller.register(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
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

    const req = { body: { name: 'Asha', email: 'ASHA@example.com', password: 'secret12' } };
    const res = createMockRes();

    await controller.register(req, res, jest.fn());

    expect(User.create).toHaveBeenCalledWith({
      name: 'Asha',
      email: 'asha@example.com',
      password: 'secret12',
    });
    expect(jwt.sign).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('login rejects invalid credentials', async () => {
    User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });

    const req = { body: { email: 'a@a.com', password: 'x' } };
    const res = createMockRes();

    await controller.login(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(401);
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
  });

  test('forgotPassword returns generic success when user does not exist', async () => {
    User.findOne.mockResolvedValue(null);

    const req = { body: { email: 'missing@example.com' } };
    const res = createMockRes();

    await controller.forgotPassword(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(200);
    expect(sendAdminEmail).not.toHaveBeenCalled();
  });
});
