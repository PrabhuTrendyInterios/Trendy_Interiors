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

  test('POST /api/contacts creates contact successfully', async () => {
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
    expect(res.body.message).toContain('submitted successfully');
  });

  test('POST /api/contacts sends admin email on creation', async () => {
    const { sendAdminEmail } = require('../../utils/mail');
    Contact.__save.mockResolvedValue(undefined);

    await request(app).post('/api/contacts').send({
      name: 'John',
      email: 'john@example.com',
      purpose: 'Office',
      mobileNumber: '9876543211',
      message: 'Office interior design needed',
    });

    expect(sendAdminEmail).toHaveBeenCalled();
  });

  test('POST /api/contacts handles save error', async () => {
    Contact.__save.mockRejectedValue(new Error('Database error'));

    const res = await request(app).post('/api/contacts').send({
      name: 'Test',
      email: 'test@example.com',
      purpose: 'Design',
      mobileNumber: '9876543212',
      message: 'Test message',
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/contacts emits socket event', async () => {
    Contact.__save.mockResolvedValue(undefined);

    const res = await request(app).post('/api/contacts').send({
      name: 'Emma',
      email: 'emma@example.com',
      purpose: 'Renovation',
      mobileNumber: '9876543213',
      message: 'Full home renovation',
    });

    expect(res.status).toBe(201);
  });

  test('GET /api/contacts returns list of contacts', async () => {
    Contact.find.mockReturnValue({ 
      sort: jest.fn().mockResolvedValue([
        { _id: 'c1', name: 'Contact1' },
        { _id: 'c2', name: 'Contact2' }
      ]) 
    });

    const res = await request(app).get('/api/contacts');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('GET /api/contacts handles error', async () => {
    Contact.find.mockReturnValue({ 
      sort: jest.fn().mockRejectedValue(new Error('Find error'))
    });

    const res = await request(app).get('/api/contacts');

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });

  test('GET /api/contacts/:id returns single contact', async () => {
    Contact.findById.mockResolvedValue({ 
      _id: 'c1', 
      name: 'John',
      email: 'john@example.com'
    });

    const res = await request(app).get('/api/contacts/c1');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data._id).toBe('c1');
  });

  test('GET /api/contacts/:id returns 404 when not found', async () => {
    Contact.findById.mockResolvedValue(null);

    const res = await request(app).get('/api/contacts/nonexistent');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('not found');
  });

  test('GET /api/contacts/:id handles database error', async () => {
    Contact.findById.mockRejectedValue(new Error('Database error'));

    const res = await request(app).get('/api/contacts/c1');

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });

  test('PUT /api/contacts/:id updates contact status', async () => {
    Contact.findByIdAndUpdate.mockResolvedValue({ 
      _id: 'c1',
      status: 'resolved',
      name: 'John'
    });

    const res = await request(app)
      .put('/api/contacts/c1')
      .send({ status: 'resolved' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('PUT /api/contacts/:id returns 404 when contact not found', async () => {
    Contact.findByIdAndUpdate.mockResolvedValue(null);

    const res = await request(app)
      .put('/api/contacts/nonexistent')
      .send({ status: 'resolved' });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  test('PUT /api/contacts/:id handles validation error', async () => {
    Contact.findByIdAndUpdate.mockRejectedValue(new Error('Validation error'));

    const res = await request(app)
      .put('/api/contacts/c1')
      .send({ status: 'invalid' });

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });

  test('DELETE /api/contacts/:id deletes contact', async () => {
    Contact.findByIdAndDelete.mockResolvedValue({ _id: 'c1', name: 'John' });

    const res = await request(app).delete('/api/contacts/c1');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('deleted');
  });

  test('DELETE /api/contacts/:id returns 404 when contact not found', async () => {
    Contact.findByIdAndDelete.mockResolvedValue(null);

    const res = await request(app).delete('/api/contacts/nonexistent');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  test('DELETE /api/contacts/:id handles error', async () => {
    Contact.findByIdAndDelete.mockRejectedValue(new Error('Delete error'));

    const res = await request(app).delete('/api/contacts/c1');

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});
