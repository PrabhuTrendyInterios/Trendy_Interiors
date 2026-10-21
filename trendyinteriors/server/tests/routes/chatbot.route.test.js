jest.mock('../../controllers/chatbotController', () => ({
  sendMessage: jest.fn((req, res) => res.status(200).json({ success: true, echo: req.body.message || '' })),
}));

const express = require('express');
const request = require('supertest');
const routes = require('../../routes/chatbot');

describe('server/routes/chatbot', () => {
  const app = express();
  app.use(express.json());
  app.use('/api/chatbot', routes);

  test('POST /api/chatbot/chat works without attachment', async () => {
    const res = await request(app).post('/api/chatbot/chat').send({ message: 'Hello bot' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('POST /api/chatbot/chat rejects unsupported attachment type', async () => {
    const res = await request(app)
      .post('/api/chatbot/chat')
      .field('message', 'hello')
      .attach('attachment', Buffer.from('abc'), { filename: 'test.txt', contentType: 'text/plain' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/chatbot/chat accepts PDF attachment', async () => {
    const res = await request(app)
      .post('/api/chatbot/chat')
      .field('message', 'hello')
      .attach('attachment', Buffer.from('%PDF-1.4 content'), { filename: 'floor-plan.pdf', contentType: 'application/pdf' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('POST /api/chatbot/chat accepts image attachment', async () => {
    const res = await request(app)
      .post('/api/chatbot/chat')
      .field('message', 'check this')
      .attach('attachment', Buffer.from('fake-image'), { filename: 'room.jpg', contentType: 'image/jpeg' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('POST /api/chatbot/chat returns 400 for file exceeding size limit', async () => {
    // Create a buffer larger than 10MB
    const bigBuffer = Buffer.alloc(11 * 1024 * 1024, 'x');
    const res = await request(app)
      .post('/api/chatbot/chat')
      .field('message', 'large file')
      .attach('attachment', bigBuffer, { filename: 'huge.pdf', contentType: 'application/pdf' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
