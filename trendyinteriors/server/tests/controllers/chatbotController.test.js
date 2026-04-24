jest.mock('axios', () => ({ post: jest.fn() }));
jest.mock('pdf-parse', () => jest.fn());
jest.mock('../../utils/mail', () => ({ sendAdminEmail: jest.fn() }));

const axios = require('axios');
const pdfParse = require('pdf-parse');
const { sendAdminEmail } = require('../../utils/mail');
const { createMockRes } = require('../helpers/mockExpress');
const { sendMessage } = require('../../controllers/chatbotController');

describe('server/controllers/chatbotController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.GROQ_API_KEY = 'groq-key';
  });

  test('returns 400 when message and attachment are both missing', async () => {
    const req = { body: {} };
    const res = createMockRes();

    await sendMessage(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Message or attachment is required' });
  });

  test('returns 500 when groq api key is missing', async () => {
    delete process.env.GROQ_API_KEY;
    const req = { body: { message: 'Hello' } };
    const res = createMockRes();

    await sendMessage(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Groq API key not configured' });
  });

  test('handles normal text chat response', async () => {
    axios.post.mockResolvedValue({
      data: { choices: [{ message: { content: 'Hi from AI' } }] },
    });

    const req = { body: { message: 'Hi', conversationHistory: [] } };
    const res = createMockRes();

    await sendMessage(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, message: 'Hi from AI' }));
  });

  test('handles pdf attachment flow and returns quotation data', async () => {
    pdfParse.mockResolvedValue({ text: 'Area 1200 sq ft premium interior' });
    axios.post.mockResolvedValue({
      data: { choices: [{ message: { content: '{"detectedAreaSqFt":1200,"serviceTier":"premium","spaceBreakdown":[],"assumptions":[],"confidence":"high"}' } }] },
    });

    const req = {
      body: { message: 'Please estimate', conversationHistory: [] },
      file: {
        originalname: 'plan.pdf',
        mimetype: 'application/pdf',
        buffer: Buffer.from('fake'),
      },
    };
    const res = createMockRes();

    await sendMessage(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      quotation: expect.objectContaining({ areaSqFt: 1200, tier: 'premium' }),
    }));
  });

  test('meeting intent with missing details asks for required fields', async () => {
    axios.post.mockResolvedValue({
      data: { choices: [{ message: { content: '{"wantsMeeting":true,"submitRequest":false,"name":null,"phone":null,"email":null,"preferredDate":null,"preferredTime":null,"projectType":null,"propertyLocation":null,"notes":null}' } }] },
    });

    const req = {
      body: {
        message: 'I want to schedule a meeting',
        conversationHistory: [],
      },
    };
    const res = createMockRes();

    await sendMessage(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      meetingFlow: expect.objectContaining({ status: 'collecting-info' }),
    }));
    expect(sendAdminEmail).not.toHaveBeenCalled();
  });
});
