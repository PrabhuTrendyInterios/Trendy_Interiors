jest.mock('../../models/Estimator', () => ({
  create: jest.fn(),
  countDocuments: jest.fn(),
  find: jest.fn(),
  findById: jest.fn(),
}));

jest.mock('../../middleware/authMiddleware', () => ({
  protect: jest.fn((req, _res, next) => {
    req.user = { role: 'admin' };
    next();
  }),
  authorize: jest.fn(() => (_req, _res, next) => next()),
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

  test('POST /api/estimators/calculate returns quote preview', async () => {
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

  test('POST /api/estimators rejects invalid budget plan', async () => {
    const res = await request(app).post('/api/estimators/calculate').send({
      rooms: { Bedroom: 1 },
      budgetPlan: 'invalid',
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/estimators creates submission', async () => {
    Estimator.create.mockResolvedValue({
      _id: 'e1',
      budgetPlan: 'premium',
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
      customerInfo: { name: 'Asha' },
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });
});
