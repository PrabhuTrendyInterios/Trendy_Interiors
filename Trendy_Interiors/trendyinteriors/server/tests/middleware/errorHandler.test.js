const errorHandler = require('../../middleware/errorHandler');
const { createMockRes } = require('../helpers/mockExpress');

describe('server/middleware/errorHandler', () => {
  test('returns status from error and message', () => {
    const req = {};
    const res = createMockRes();
    const err = { status: 418, message: 'I am teapot' };

    errorHandler(err, req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(418);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'I am teapot',
    });
  });

  test('falls back to 500 and generic message', () => {
    const req = {};
    const res = createMockRes();
    const err = {};

    errorHandler(err, req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Internal Server Error',
    });
  });
});
