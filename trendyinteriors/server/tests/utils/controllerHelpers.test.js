const { formatValidationError, sendSuccess, sendError } = require('../../utils/controllerHelpers');

const createMockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('server/utils/controllerHelpers', () => {
  describe('formatValidationError', () => {
    test('formats mongoose ValidationError into joined message string', () => {
      const err = {
        name: 'ValidationError',
        errors: {
          name: { message: 'name is required' },
          role: { message: 'role is required' },
        },
      };
      expect(formatValidationError(err)).toBe('name is required, role is required');
    });

    test('formats duplicate key error (code 11000) with field and value', () => {
      const err = {
        code: 11000,
        keyPattern: { email: 1 },
        keyValue: { email: 'dup@example.com' },
      };
      expect(formatValidationError(err)).toBe("email 'dup@example.com' already exists");
    });

    test('formats duplicate key error when keyPattern is missing', () => {
      const err = { code: 11000 };
      expect(formatValidationError(err)).toBe("field '' already exists");
    });

    test('formats duplicate key error when keyValue is missing', () => {
      const err = { code: 11000, keyPattern: { slug: 1 } };
      expect(formatValidationError(err)).toBe("slug '' already exists");
    });

    test('returns err.message for generic errors', () => {
      expect(formatValidationError(new Error('Something broke'))).toBe('Something broke');
    });

    test('returns Server Error fallback when err.message is absent', () => {
      expect(formatValidationError({})).toBe('Server Error');
    });
  });

  describe('sendSuccess', () => {
    test('responds with status and success:true payload', () => {
      const res = createMockRes();
      sendSuccess(res, 200, { data: [1, 2] });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: [1, 2] });
    });

    test('responds with 201 on create', () => {
      const res = createMockRes();
      sendSuccess(res, 201, { id: 'new' });
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('sendError', () => {
    test('responds with status and success:false message', () => {
      const res = createMockRes();
      sendError(res, 404, 'Not found');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Not found' });
    });

    test('responds with 500 for server errors', () => {
      const res = createMockRes();
      sendError(res, 500, 'Server Error');
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
