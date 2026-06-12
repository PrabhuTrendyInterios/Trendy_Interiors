jest.mock('jsonwebtoken', () => ({ verify: jest.fn() }));
jest.mock('../../models/User', () => ({ findById: jest.fn() }));

const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const { protect, authorize } = require('../../middleware/authMiddleware');
const { createMockRes } = require('../helpers/mockExpress');

describe('server/middleware/authMiddleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
  });

  test('protect rejects when token missing', async () => {
    const req = { headers: {} };
    const res = createMockRes();

    await protect(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Not authorized to access this route',
    });
  });

  test('protect attaches user and calls next when token valid', async () => {
    const req = { headers: { authorization: 'Bearer token-1' } };
    const res = createMockRes();
    const next = jest.fn();

    jwt.verify.mockReturnValue({ id: 'u1' });
    User.findById.mockResolvedValue({ _id: 'u1', role: 'admin' });

    await protect(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith('token-1', 'test-secret');
    expect(req.user).toEqual({ _id: 'u1', role: 'admin' });
    expect(next).toHaveBeenCalled();
  });

  test('authorize rejects role mismatch', () => {
    const req = { user: { role: 'user' } };
    const res = createMockRes();
    const next = jest.fn();

    authorize('admin')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test('authorize allows permitted role', () => {
    const req = { user: { role: 'admin' } };
    const res = createMockRes();
    const next = jest.fn();

    authorize('admin')(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});
