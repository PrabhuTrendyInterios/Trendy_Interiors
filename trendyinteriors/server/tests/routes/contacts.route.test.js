jest.mock('../../models/Contact', () => {
  const save = jest.fn();
  const Contact = jest.fn(function ContactCtor(payload) {
    Object.assign(this, payload, { _id: 'c1', createdAt: new Date() });
    this.save = save;
  });
  Contact.find = jest.fn();
  Contact.findById = jest.fn();
  Contact.findByIdAndUpdate = jest.fn();
  Contact.findByIdAndDelete = jest.fn();
  Contact.__save = save;
  return Contact;
});

jest.mock('../../middleware/authMiddleware', () => ({
  protect: jest.fn((req, _res, next) => {
    req.user = { role: 'admin' };
    next();
  }),
  authorize: jest.fn(() => (_req, _res, next) => next()),
}));

jest.mock('../../utils/mail', () => ({ sendAdminEmail: jest.fn().mockResolvedValue(undefined) }));

const express = require('express');
const request = require('supertest');
const Contact = require('../../models/Contact');
const routes = require('../../routes/contacts');

describe('server/routes/contacts', () => {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.app.set('io', { emit: jest.fn() });
    next();
  });
  app.use('/api/contacts', routes);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('POST /api/contacts creates contact', async () => {
    Contact.__save.mockResolvedValue(undefined);

    const res = await request(app).post('/api/contacts').send({
      name: 'Asha',
      email: 'asha@example.com',
      purpose: 'Kitchen',
      mobileNumber: '9876543210',
      message: 'Need design consultation with premium finish.',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  test('GET /api/contacts returns list', async () => {
    Contact.find.mockReturnValue({ sort: jest.fn().mockResolvedValue([{ _id: 'c1' }]) });

    const res = await request(app).get('/api/contacts');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
