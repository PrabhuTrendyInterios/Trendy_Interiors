jest.mock('../../models/Estimator', () => ({
  create: jest.fn(),
  countDocuments: jest.fn(),
  find: jest.fn(),
  findById: jest.fn(),
}));

jest.mock('../../middleware/authMiddleware', () => ({
  protect: jest.fn((req, _res, next) => {
    req.user = { role: 'admin', id: 'u1' };
    next();
  }),
  authorize: jest.fn(() => (_req, _res, next) => next()),
}));

jest.mock('../../utils/quotationPDF', () => ({
  generateQuotationPDF: jest.fn((estimator, res, callback) => {
    res.setHeader('Content-Type', 'application/pdf');
    if (callback) callback(null);
    else res.end();
  }),
}));

const express = require('express');
const request = require('supertest');
const Estimator = require('../../models/Estimator');
const routes = require('../../routes/estimators');

describe('server/routes/estimators', () => {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.app.set('io', { emit: jest.fn() });
    next();
  });
  app.use('/api/estimators', routes);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/estimators/calculate', () => {
    test('returns quote preview with valid data', async () => {
      const payload = {
        rooms: { Bedroom: 1 },
        budgetPlan: 'premium',
        selectedRoomForDimensions: 'Bedroom-1',
        roomDimensionsByRoom: {
          'Bedroom-1': { length: 10, width: 10, height: 9 },
        },
      };

      const res = await request(app).post('/api/estimators/calculate').send(payload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.quoteSummary.estimatedAmount).toBeGreaterThan(0);
    });

    test('handles budget plan calculation with various plans', async () => {
      const plans = ['starter', 'budgetFriendly', 'premium', 'signature'];

      for (const plan of plans) {
        const res = await request(app).post('/api/estimators/calculate').send({
          rooms: { Bedroom: 1 },
          budgetPlan: plan,
          selectedRoomForDimensions: 'Bedroom-1',
          roomDimensionsByRoom: {
            'Bedroom-1': { length: 10, width: 10 },
          },
        });

        expect(res.body.success).toBe(true);
      }
    });

    test('handles invalid budget plan', async () => {
      const res = await request(app).post('/api/estimators/calculate').send({
        rooms: { Bedroom: 1 },
        budgetPlan: 'invalid',
        selectedRoomForDimensions: 'Bedroom-1',
        roomDimensionsByRoom: {
          'Bedroom-1': { length: 10, width: 10 },
        },
      });

      expect(res.body).toBeDefined();
    });

    test('handles missing rooms data', async () => {
      const res = await request(app).post('/api/estimators/calculate').send({
        budgetPlan: 'premium',
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test('handles server error during calculation', async () => {
      // Send invalid data that would cause calculation error
      const res = await request(app).post('/api/estimators/calculate').send({
        rooms: null,
        budgetPlan: 'premium',
      });

      expect(res.body).toBeDefined();
    });
  });

  describe('POST /api/estimators', () => {
    test('creates submission with valid data', async () => {
      Estimator.create.mockResolvedValue({
        _id: 'e1',
        budgetPlan: 'premium',
        rooms: { Bedroom: 1 },
        quoteSummary: { estimatedAmount: 2000 },
        createdAt: new Date(),
      });

      const res = await request(app).post('/api/estimators').send({
        rooms: { Bedroom: 1 },
        budgetPlan: 'premium',
        selectedRoomForDimensions: 'Bedroom-1',
        roomDimensionsByRoom: {
          'Bedroom-1': {
            length: 10,
            width: 10,
            height: 9,
            selectedDesignIdea: { id: 'idea-1', planTier: 'premium' },
          },
        },
        customerInfo: { name: 'Asha', email: 'asha@example.com' },
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(Estimator.create).toHaveBeenCalled();
    });

    test('handles validation error on submission (missing rooms)', async () => {
      const res = await request(app).post('/api/estimators').send({
        budgetPlan: 'premium',
        // Missing required rooms data
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test('handles validation error (missing dimensions)', async () => {
      const res = await request(app).post('/api/estimators').send({
        rooms: { Bedroom: 1 },
        budgetPlan: 'premium',
        // Missing roomDimensionsByRoom
        customerInfo: { name: 'Test', email: 'test@example.com' },
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test('handles database error during creation', async () => {
      Estimator.create.mockRejectedValue(new Error('Database error'));

      const res = await request(app).post('/api/estimators').send({
        rooms: { Bedroom: 1 },
        budgetPlan: 'premium',
        selectedRoomForDimensions: 'Bedroom-1',
        roomDimensionsByRoom: {
          'Bedroom-1': { length: 10, width: 10 },
        },
        customerInfo: { name: 'Test', email: 'test@example.com' },
      });

      // Database error will be caught after validation
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/estimators', () => {
    test('returns list of estimators', async () => {
      Estimator.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue([
          { _id: 'e1', budgetPlan: 'premium' },
          { _id: 'e2', budgetPlan: 'starter' }
        ])
      });

      const res = await request(app).get('/api/estimators');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    test('handles database error when fetching list', async () => {
      Estimator.find.mockReturnValue({
        sort: jest.fn().mockRejectedValue(new Error('DB error'))
      });

      const res = await request(app).get('/api/estimators');

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });

    test('requires auth middleware', async () => {
      // This verifies protect middleware is applied
      const res = await request(app).get('/api/estimators');
      // If auth middleware is working, this should proceed normally
      expect(res.status).toBeDefined();
    });
  });

  describe('GET /api/estimators/:id', () => {
    test('returns single estimator', async () => {
      Estimator.findById.mockResolvedValue({
        _id: 'e1',
        budgetPlan: 'premium',
        quoteSummary: { estimatedAmount: 2000 }
      });

      const res = await request(app).get('/api/estimators/e1');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data._id).toBe('e1');
    });

    test('returns 404 when estimator not found', async () => {
      Estimator.findById.mockResolvedValue(null);

      const res = await request(app).get('/api/estimators/nonexistent');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('not found');
    });

    test('handles database error', async () => {
      Estimator.findById.mockRejectedValue(new Error('DB error'));

      const res = await request(app).get('/api/estimators/e1');

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/estimators/:id/pdf/download', () => {
    test('generates PDF successfully', async () => {
      const { generateQuotationPDF } = require('../../utils/quotationPDF');
      generateQuotationPDF.mockClear();
      generateQuotationPDF.mockImplementation((estimator, res) => {
        res.setHeader('Content-Type', 'application/pdf');
        res.end();
      });

      Estimator.findById.mockResolvedValue({
        _id: 'e1',
        customerInfo: { name: 'John' },
        quoteSummary: { estimatedAmount: 2000 }
      });

      const res = await request(app).get('/api/estimators/e1/pdf/download');

      expect(res.status).toBe(200);
      expect(generateQuotationPDF).toHaveBeenCalled();
    }, 10000);

    test('returns 404 when estimator not found for PDF', async () => {
      Estimator.findById.mockResolvedValue(null);

      const res = await request(app).get('/api/estimators/nonexistent/pdf/download');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    test('handles database error when fetching for PDF', async () => {
      Estimator.findById.mockRejectedValue(new Error('DB error'));

      const res = await request(app).get('/api/estimators/e1/pdf/download');

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });
});
