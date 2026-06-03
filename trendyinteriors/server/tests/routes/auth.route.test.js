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

  test('POST /api/auth/test-email includes recipient info', async () => {
    process.env.ADMIN_EMAIL = 'admin@trendy.com';
    const res = await request(app).post('/api/auth/test-email').send({});
    expect(res.body.details).toBeDefined();
    expect(res.body.details.recipient).toBe('admin@trendy.com');
  });

  test('POST /api/auth/test-email falls back to default admin email', async () => {
    delete process.env.ADMIN_EMAIL;
    const res = await request(app).post('/api/auth/test-email').send({});
    expect(res.body.details.recipient).toBe('trendyadmin123@gmail.com');
  });

  test('POST /api/auth/test-email handles email sending error', async () => {
    const mail = require('../../utils/mail');
    mail.sendAdminEmail.mockRejectedValueOnce(new Error('SMTP connection failed'));

    const res = await request(app).post('/api/auth/test-email').send({});

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/auth/forgot-password calls controller', async () => {
    const authController = require('../../controllers/authController');
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'test@example.com' });
    expect(authController.forgotPassword).toHaveBeenCalled();
  });

  test('POST /api/auth/verify-reset-otp calls controller', async () => {
    const authController = require('../../controllers/authController');
    const res = await request(app)
      .post('/api/auth/verify-reset-otp')
      .send({ email: 'test@example.com', otp: '123456' });
    expect(authController.verifyResetOTP).toHaveBeenCalled();
  });

  test('POST /api/auth/reset-password calls controller', async () => {
    const authController = require('../../controllers/authController');
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ resetToken: 'token', password: 'new', confirmPassword: 'new' });
    expect(authController.resetPassword).toHaveBeenCalled();
  });

  test('POST /api/auth/send-change-password-otp calls controller', async () => {
    const authController = require('../../controllers/authController');
    const res = await request(app)
      .post('/api/auth/send-change-password-otp')
      .send({});
    expect(authController.sendChangePasswordOTP).toHaveBeenCalled();
  });

  test('PUT /api/auth/change-password-with-otp calls controller', async () => {
    const authController = require('../../controllers/authController');
    const res = await request(app)
      .put('/api/auth/change-password-with-otp')
      .send({ otp: '123456', newPassword: 'new', confirmPassword: 'new' });
    expect(authController.changePasswordWithOTP).toHaveBeenCalled();
  });

  test('PUT /api/auth/updatedetails calls controller', async () => {
    const authController = require('../../controllers/authController');
    const res = await request(app)
      .put('/api/auth/updatedetails')
      .send({ name: 'New Name' });
    expect(authController.updateDetails).toHaveBeenCalled();
  });

  test('PUT /api/auth/change-password calls controller', async () => {
    const authController = require('../../controllers/authController');
    const res = await request(app)
      .put('/api/auth/change-password')
      .send({ currentPassword: 'old', newPassword: 'new', confirmPassword: 'new' });
    expect(authController.changePassword).toHaveBeenCalled();
  });

  test('POST /api/auth/login calls controller', async () => {
    const authController = require('../../controllers/authController');
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'pass' });
    expect(authController.login).toHaveBeenCalled();
  });
});
