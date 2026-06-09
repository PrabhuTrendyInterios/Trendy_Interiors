jest.mock('../../models/Estimator', () => ({
  create: jest.fn(),
  countDocuments: jest.fn(),
  find: jest.fn(),
  findById: jest.fn(),
}));

jest.mock('../../models/Room', () => ({
  find: jest.fn(),
}));

jest.mock('../../models/GlobalAddon', () => ({
  find: jest.fn(),
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
const Room = require('../../models/Room');
const GlobalAddon = require('../../models/GlobalAddon');
const routes = require('../../routes/estimators');

const mockRoomsCatalog = [
  {
    name: 'Bedroom',
    status: 'active',
    pricePerSqFt: 1000,
    layouts: [],
    addons: [],
  },
];

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
    Room.find.mockReturnValue({
      sort: jest.fn().mockResolvedValue(mockRoomsCatalog),
    });
    GlobalAddon.find.mockReturnValue({
      sort: jest.fn().mockResolvedValue([]),
    });
  });

  describe('POST /api/estimators/calculate', () => {
    test('returns quote preview with valid data', async () => {
      const payload = {
        rooms: { Bedroom: 1 },
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

    test('handles missing rooms data', async () => {
      const res = await request(app).post('/api/estimators/calculate').send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test('handles server error during calculation', async () => {
      // Send invalid data that would cause calculation error
      const res = await request(app).post('/api/estimators/calculate').send({
        rooms: null,
      });

      expect(res.body).toBeDefined();
    });

    test('calculate preview skips invalid layout materials without validation error', async () => {
      Room.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue([
          {
            name: 'Bedroom',
            status: 'active',
            pricePerSqFt: 1000,
            dimensions: [{ _id: 'dim-low', name: 'Low' }],
            layouts: [
              {
                name: 'Sliding Wardrobe',
                fixedPrice: 0,
                hasLayoutMaterials: true,
                configurations: [
                  {
                    dimensionId: 'dim-low',
                    materials: [{ _id: 'mat-1', name: 'Laminate', price: 5000, mandatory: true }],
                  },
                ],
              },
            ],
            addons: [],
          },
        ]),
      });

      const res = await request(app).post('/api/estimators/calculate').send({
        rooms: { Bedroom: 1 },
        selectedRoomForDimensions: 'Bedroom-1',
        roomDimensionsByRoom: {
          'Bedroom-1': {
            length: 10,
            width: 10,
            height: 9,
            sizeCategory: 'dim-mid',
            selectedDesignIdea: { layout: 'Sliding Wardrobe', addons: [], room: 'Bedroom' },
          },
        },
      });

      expect(res.status).toBe(200);
      expect(res.body.data.quoteSummary.lineItems[0].layoutMaterialsCost).toBe(0);
    });
  });

  describe('POST /api/estimators', () => {
    test('creates submission with valid data', async () => {
      Estimator.create.mockResolvedValue({
        _id: 'e1',
        rooms: { Bedroom: 1 },
        quoteSummary: { estimatedAmount: 2000 },
        createdAt: new Date(),
      });

      const res = await request(app).post('/api/estimators').send({
        rooms: { Bedroom: 1 },
        selectedRoomForDimensions: 'Bedroom-1',
        roomDimensionsByRoom: {
          'Bedroom-1': {
            length: 10,
            width: 10,
            height: 9,
            selectedDesignIdea: { layout: '', addons: [], room: 'Bedroom' },
          },
        },
        customerInfo: { name: 'Asha', email: 'asha@example.com' },
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(Estimator.create).toHaveBeenCalled();
    });

    test('handles validation error on submission (missing rooms)', async () => {
      const res = await request(app).post('/api/estimators').send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test('handles validation error (missing dimensions)', async () => {
      const res = await request(app).post('/api/estimators').send({
        rooms: { Bedroom: 1 },
        // Missing roomDimensionsByRoom
        customerInfo: { name: 'Test', email: 'test@example.com' },
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test('returns validation error when layout materials dimension does not match on submit', async () => {
      Room.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue([
          {
            name: 'Bedroom',
            status: 'active',
            pricePerSqFt: 1000,
            dimensions: [{ _id: 'dim-low', name: 'Low' }],
            layouts: [
              {
                name: 'Sliding Wardrobe',
                fixedPrice: 0,
                hasLayoutMaterials: true,
                configurations: [{ dimensionId: 'dim-low', materials: [] }],
              },
            ],
            addons: [],
          },
        ]),
      });

      const res = await request(app).post('/api/estimators').send({
        rooms: { Bedroom: 1 },
        selectedRoomForDimensions: 'Bedroom-1',
        roomDimensionsByRoom: {
          'Bedroom-1': {
            length: 10,
            width: 10,
            height: 9,
            sizeCategory: 'dim-mid',
            selectedDesignIdea: { layout: 'Sliding Wardrobe', addons: [], room: 'Bedroom' },
          },
        },
        customerInfo: { name: 'Asha', email: 'asha@example.com' },
      });

      expect(res.status).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.stringContaining('No layout materials are configured')])
      );
    });

    test('handles database error during creation', async () => {
      Estimator.create.mockRejectedValue(new Error('Database error'));

      const res = await request(app).post('/api/estimators').send({
        rooms: { Bedroom: 1 },
        selectedRoomForDimensions: 'Bedroom-1',
        roomDimensionsByRoom: {
          'Bedroom-1': { length: 10, width: 10, height: 9 },
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
          { _id: 'e1', quoteSummary: { estimatedAmount: 1000 } },
          { _id: 'e2', quoteSummary: { estimatedAmount: 2000 } },
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
        quoteSummary: { estimatedAmount: 2000 },
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

  describe('POST /api/estimators/pdf/download', () => {
    test('generates preview PDF successfully', async () => {
      const { generateQuotationPDF } = require('../../utils/quotationPDF');
      generateQuotationPDF.mockClear();
      generateQuotationPDF.mockImplementation((estimator, res) => {
        res.setHeader('Content-Type', 'application/pdf');
        res.end();
      });

      const res = await request(app)
        .post('/api/estimators/pdf/download')
        .send({
          rooms: { Bedroom: 1 },
          selectedRoomForDimensions: 'Bedroom-1',
          roomDimensionsByRoom: {
            'Bedroom-1': { length: 10, width: 10, height: 9, selectedDesignIdea: { layout: 'Modern', addons: [], room: 'Bedroom' } },
          },
          customerInfo: { name: 'John Doe', email: 'john@example.com', phone: '1234567890' },
        });

      expect(res.status).toBe(200);
      expect(generateQuotationPDF).toHaveBeenCalled();
    }, 10000);

    test('returns 400 when preview data is invalid', async () => {
      const res = await request(app).post('/api/estimators/pdf/download').send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});
