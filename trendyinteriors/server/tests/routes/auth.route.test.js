jest.mock('../../controllers/authController', () => ({
  register: jest.fn((req, res) => res.status(200).json({ ok: 'register' })),
  login: jest.fn((req, res) => res.status(200).json({ ok: 'login' })),
  getMe: jest.fn((req, res) => res.status(200).json({ ok: 'me' })),
  updateDetails: jest.fn((req, res) => res.status(200).json({ ok: 'update' })),
  changePassword: jest.fn((req, res) => res.status(200).json({ ok: 'changePassword' })),
  forgotPassword: jest.fn((req, res) => res.status(200).json({ ok: 'forgot' })),
  resetPassword: jest.fn((req, res) => res.status(200).json({ ok: 'reset' })),
  verifyResetOTP: jest.fn((req, res) => res.status(200).json({ ok: 'verifyOtp' })),
  sendChangePasswordOTP: jest.fn((req, res) => res.status(200).json({ ok: 'sendChangeOtp' })),
  changePasswordWithOTP: jest.fn((req, res) => res.status(200).json({ ok: 'changeWithOtp' })),
}));

jest.mock('../../middleware/authMiddleware', () => ({
  protect: jest.fn((req, _res, next) => {
    req.user = { id: 'u1', role: 'admin' };
    next();
  }),
}));

jest.mock('../../utils/mail', () => {
  const fn = jest.fn();
  fn.sendAdminEmail = jest.fn().mockResolvedValue(undefined);
  return fn;
});

const express = require('express');
const request = require('supertest');
const routes = require('../../routes/auth');

describe('server/routes/auth', () => {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', routes);

  test('POST /api/auth/register', async () => {
    const res = await request(app).post('/api/auth/register').send({});
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe('register');
  });

  test('GET /api/auth/me uses protect middleware', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe('me');
  });

  test('POST /api/auth/test-email returns success', async () => {
    const res = await request(app).post('/api/auth/test-email').send({});
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
