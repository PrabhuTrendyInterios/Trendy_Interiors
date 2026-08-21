jest.mock('axios', () => ({ post: jest.fn() }));
jest.mock('pdf-parse', () => jest.fn());
jest.mock('../../utils/mail', () => ({ sendAdminEmail: jest.fn(), sendUserEmail: jest.fn(), sendEmailWithAttachment: jest.fn() }));
jest.mock('../../services/chatbotContextService', () => jest.fn());
jest.mock('../../services/chatbotApiService', () => ({
  fetchChatbotConfig: jest.fn(),
  fetchChatbotContextData: jest.fn(),
}));
jest.mock('../../models/Settings', () => ({
  findOne: jest.fn(),
}));
jest.mock('../../models/MeetingRequest', () => ({
  create: jest.fn(),
}));

const axios = require('axios');
const pdfParse = require('pdf-parse');
const { sendAdminEmail, sendUserEmail, sendEmailWithAttachment } = require('../../utils/mail');
const buildChatbotContext = require('../../services/chatbotContextService');
const { fetchChatbotConfig, fetchChatbotContextData } = require('../../services/chatbotApiService');
const Settings = require('../../models/Settings');
const MeetingRequest = require('../../models/MeetingRequest');
const { createMockRes } = require('../helpers/mockExpress');
const { sendMessage } = require('../../controllers/chatbotController');

describe('server/controllers/chatbotController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.GROQ_API_KEY = 'groq-key';
    
    // Mock API service responses
    fetchChatbotConfig.mockResolvedValue({
      enabled: true,
      creativeMode: true,
      model: 'llama-3.1-8b-instant',
      temperature: 0.7,
      maxTokens: 256,
      meetingEmailTo: 'admin@test.com',
      allowFileUpload: true,
      maxFileSize: 10 * 1024 * 1024,
      cacheContextTTL: 300,
    });

    fetchChatbotContextData.mockResolvedValue({
      rooms: [],
      addons: [],
      projects: [],
      team: []
    });

    // Mock Settings model
    Settings.findOne.mockResolvedValue({
      companyName: 'TrendyInterios',
      contactPhone: 'Contact us for details',
      contactEmail: 'info@trendyinterios.com',
      contactAddress: 'Erode, Tamil Nadu'
    });

    MeetingRequest.create.mockResolvedValue({ _id: 'record123' });
    sendUserEmail.mockResolvedValue([{ statusCode: 202 }]);
    sendEmailWithAttachment.mockResolvedValue([{ statusCode: 202 }]);
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

  test('meeting intent with complete details saves meeting and sends emails', async () => {
    axios.post.mockResolvedValue({
      data: { choices: [{ message: { content: '{"wantsMeeting":true,"submitRequest":true,"name":"Jane Doe","phone":"+1234567890","email":"jane@example.com","preferredDate":"2025-05-05","preferredTime":"3:00 PM","projectType":"Living Room Redesign","propertyLocation":"Chennai","notes":"Need weekend slot"}' } }] },
    });

    sendAdminEmail.mockResolvedValue([{ statusCode: 202 }]);
    sendEmailWithAttachment.mockResolvedValue([{ statusCode: 202 }]);

    const req = {
      body: {
        message: 'I want to schedule a meeting',
        conversationHistory: [],
      },
    };
    const res = createMockRes();

    await sendMessage(req, res);

    expect(MeetingRequest.create).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Jane Doe',
      email: 'jane@example.com',
      phone: '+1234567890',
      preferredDate: '2025-05-05',
      preferredTime: '3:00 PM',
      message: 'Need weekend slot',
      status: 'Pending',
      projectType: 'Living Room Redesign',
      propertyLocation: 'Chennai',
      source: 'chatbot',
    }));
    expect(sendAdminEmail).toHaveBeenCalledTimes(1);
    expect(sendEmailWithAttachment).toHaveBeenCalledWith(expect.objectContaining({
      to: 'jane@example.com',
      subject: 'Meeting Request Confirmation',
      attachment: expect.objectContaining({ filename: expect.stringContaining('.ics'), type: 'text/calendar' }),
    }));
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      meetingFlow: expect.objectContaining({ status: 'scheduled', meetingRequestId: 'record123' }),
    }));
  });
});
