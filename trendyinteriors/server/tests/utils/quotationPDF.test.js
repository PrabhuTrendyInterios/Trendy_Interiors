jest.mock('pdfkit');

const PDFDocument = require('pdfkit');
const { generateQuotationPDF } = require('../../utils/quotationPDF');

describe('server/utils/quotationPDF', () => {
  let mockDoc;
  let mockRes;

  beforeEach(() => {
    jest.clearAllMocks();

    mockDoc = {
      pipe: jest.fn(),
      setHeader: jest.fn(),
      end: jest.fn(),
      rect: jest.fn().mockReturnThis(),
      fill: jest.fn().mockReturnThis(),
      fillAndStroke: jest.fn().mockReturnThis(),
      roundedRect: jest.fn().mockReturnThis(),
      text: jest.fn().mockReturnThis(),
      font: jest.fn().mockReturnThis(),
      fontSize: jest.fn().mockReturnThis(),
      fillColor: jest.fn().mockReturnThis(),
      strokeColor: jest.fn().mockReturnThis(),
      lineWidth: jest.fn().mockReturnThis(),
      moveTo: jest.fn().mockReturnThis(),
      lineTo: jest.fn().mockReturnThis(),
      stroke: jest.fn().mockReturnThis(),
      circle: jest.fn().mockReturnThis(),
      addPage: jest.fn().mockReturnThis(),
    };

    PDFDocument.mockImplementation(() => mockDoc);

    mockRes = {
      setHeader: jest.fn(),
      pipe: jest.fn(),
    };
  });

  test('generates PDF with valid estimator data', () => {
    const estimator = {
      _id: 'est123',
      quoteSummary: {
        estimatedAmount: 50000,
        totalAreaSqFt: 1000,
        lineItems: [
          {
            label: 'Living Room',
            areaSqFt: 300,
            ratePerSqFt: 1000,
            estimatedCost: 300000,
          },
        ],
      },
      customerInfo: {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '9876543210',
        location: 'Coimbatore',
      },
      budgetPlan: 'premium',
      rooms: { living: 1, bedroom: 2, kitchen: 1 },
    };

    generateQuotationPDF(estimator, mockRes);

    expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
    expect(mockRes.setHeader).toHaveBeenCalledWith(
      'Content-Disposition',
      expect.stringContaining('quotation-est123.pdf')
    );
    expect(mockDoc.pipe).toHaveBeenCalledWith(mockRes);
    expect(mockDoc.end).toHaveBeenCalled();
  });

  test('handles missing quoteSummary', () => {
    const estimator = {
      _id: 'est123',
      customerInfo: {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '9876543210',
        location: 'Coimbatore',
      },
      budgetPlan: 'standard',
      rooms: {},
    };

    generateQuotationPDF(estimator, mockRes);

    expect(mockDoc.end).toHaveBeenCalled();
  });

  test('handles missing rooms data', () => {
    const estimator = {
      _id: 'est456',
      quoteSummary: {
        estimatedAmount: 100000,
        totalAreaSqFt: 2000,
        lineItems: [],
      },
      customerInfo: {
        name: 'Jane Doe',
        email: 'jane@example.com',
        phone: '9876543211',
        location: 'Chennai',
      },
      budgetPlan: 'basic',
    };

    generateQuotationPDF(estimator, mockRes);

    expect(mockDoc.end).toHaveBeenCalled();
  });

  test('handles Map-type rooms data', () => {
    const roomsMap = new Map();
    roomsMap.set('living', 1);
    roomsMap.set('bedroom', 2);

    const estimator = {
      _id: 'est789',
      quoteSummary: {
        estimatedAmount: 75000,
        totalAreaSqFt: 1500,
        lineItems: [],
      },
      customerInfo: {
        name: 'Test User',
        email: 'test@example.com',
        phone: '9876543212',
        location: 'Erode',
      },
      budgetPlan: 'standard',
      rooms: roomsMap,
    };

    generateQuotationPDF(estimator, mockRes);

    expect(mockDoc.end).toHaveBeenCalled();
  });

  test('handles multiple line items with add-ons', () => {
    const estimator = {
      _id: 'est999',
      quoteSummary: {
        estimatedAmount: 150000,
        totalAreaSqFt: 2500,
        lineItems: [
          {
            label: 'Modular Kitchen',
            roomId: 'kitchen',
            areaSqFt: 150,
            ratePerSqFt: 2000,
            estimatedCost: 300000,
          },
          {
            label: 'Extra Add-ons',
            roomId: 'extra-addons',
            addons: ['wallpaint', 'flooring', 'lighting'],
            estimatedCost: 75000,
          },
          {
            label: 'Bedroom',
            areaSqFt: 200,
            ratePerSqFt: 1500,
            estimatedCost: 300000,
          },
          {
            label: 'Living Room',
            areaSqFt: 300,
            ratePerSqFt: 1200,
            estimatedCost: 360000,
          },
          {
            label: 'Bathroom',
            areaSqFt: 50,
            ratePerSqFt: 2500,
            estimatedCost: 125000,
          },
          {
            label: 'Hallway',
            areaSqFt: 100,
            ratePerSqFt: 1000,
            estimatedCost: 100000,
          },
          {
            label: 'Extra Items',
            areaSqFt: 0,
            ratePerSqFt: 0,
            estimatedCost: 50000,
          },
        ],
      },
      customerInfo: {
        name: 'Premium Client',
        email: 'premium@example.com',
        phone: '9876543213',
        location: 'Bangalore',
      },
      budgetPlan: 'premium',
      rooms: { living: 1, bedroom: 3, kitchen: 1, bathroom: 2 },
    };

    generateQuotationPDF(estimator, mockRes);

    expect(mockDoc.end).toHaveBeenCalled();
  });

  test('handles invalid numbers gracefully', () => {
    const estimator = {
      _id: 'est000',
      quoteSummary: {
        estimatedAmount: 'invalid',
        totalAreaSqFt: 'NaN',
        lineItems: [
          {
            label: 'Invalid Item',
            areaSqFt: 'abc',
            ratePerSqFt: 'xyz',
            estimatedCost: undefined,
          },
        ],
      },
      customerInfo: {
        name: 'Invalid Data',
        email: null,
        phone: undefined,
        location: '',
      },
      budgetPlan: 'standard',
      rooms: null,
    };

    generateQuotationPDF(estimator, mockRes);

    expect(mockDoc.end).toHaveBeenCalled();
  });

  test('handles long text with truncation', () => {
    const estimator = {
      _id: 'est111',
      quoteSummary: {
        estimatedAmount: 50000,
        totalAreaSqFt: 1000,
        lineItems: [
          {
            label: 'This is a very long label that should be truncated to fit in the PDF properly and not overflow the designated area',
            areaSqFt: 300,
            ratePerSqFt: 1000,
            estimatedCost: 300000,
            addons: [
              'very long addon name that should be truncated',
              'another long addon name',
            ],
          },
        ],
      },
      customerInfo: {
        name: 'John Doe with very long name that might cause issues',
        email: 'john.doe.with.very.long.email@verylongexample.com',
        phone: '9876543210123456789',
        location: 'Very Long Location Address that spans multiple lines',
      },
      budgetPlan: 'premium',
      rooms: { 'very-long-room-name': 5, kitchen: 2 },
    };

    generateQuotationPDF(estimator, mockRes);

    expect(mockDoc.end).toHaveBeenCalled();
  });

  test('handles object with toObject method for rooms', () => {
    const roomsObj = {
      toObject: () => ({ living: 1, bedroom: 2 }),
    };

    const estimator = {
      _id: 'est222',
      quoteSummary: {
        estimatedAmount: 50000,
        lineItems: [],
      },
      customerInfo: {
        name: 'Test',
        email: 'test@example.com',
      },
      budgetPlan: 'standard',
      rooms: roomsObj,
    };

    generateQuotationPDF(estimator, mockRes);

    expect(mockDoc.end).toHaveBeenCalled();
  });
});
