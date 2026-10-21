jest.mock('../../models/ActivityLog', () => ({
  create: jest.fn(),
}));

const ActivityLog = require('../../models/ActivityLog');
const { trackActivity } = require('../../middleware/activityLogger');

const makeReq = (overrides = {}) => ({
  method: 'POST',
  baseUrl: '/api/projects',
  path: '/',
  user: { _id: 'u1', name: 'Admin', email: 'admin@test.com' },
  ...overrides,
});

const makeRes = (statusCode = 201) => {
  const listeners = {};
  return {
    statusCode,
    on: jest.fn((event, cb) => { listeners[event] = cb; }),
    emit: (event) => listeners[event]?.(),
  };
};

describe('server/middleware/activityLogger — trackActivity', () => {
  beforeEach(() => jest.clearAllMocks());

  test('calls next() for all methods', () => {
    const next = jest.fn();
    const req = makeReq({ method: 'GET' });
    const res = makeRes();
    trackActivity(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('does not attach finish listener for non-mutating methods', () => {
    const next = jest.fn();
    const res = makeRes();
    trackActivity(makeReq({ method: 'GET' }), res, next);
    expect(res.on).not.toHaveBeenCalled();
  });

  test('attaches finish listener for POST', () => {
    const next = jest.fn();
    const res = makeRes();
    trackActivity(makeReq({ method: 'POST' }), res, next);
    expect(res.on).toHaveBeenCalledWith('finish', expect.any(Function));
  });

  test('skips logging when statusCode >= 400', () => {
    const next = jest.fn();
    const res = makeRes(400);
    trackActivity(makeReq(), res, next);
    res.emit('finish');
    expect(ActivityLog.create).not.toHaveBeenCalled();
  });

  test('skips logging when req.user is not set', () => {
    const next = jest.fn();
    const res = makeRes(201);
    const req = makeReq({ user: undefined });
    trackActivity(req, res, next);
    res.emit('finish');
    expect(ActivityLog.create).not.toHaveBeenCalled();
  });

  test('skips logging for forgot-password path (describeRequest returns null)', () => {
    const next = jest.fn();
    const res = makeRes(200);
    const req = makeReq({ baseUrl: '/api/auth', path: '/forgot-password' });
    trackActivity(req, res, next);
    res.emit('finish');
    expect(ActivityLog.create).not.toHaveBeenCalled();
  });

  test('logs activity for successful POST', () => {
    ActivityLog.create.mockResolvedValue({});
    const next = jest.fn();
    const res = makeRes(201);
    trackActivity(makeReq(), res, next);
    res.emit('finish');
    expect(ActivityLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'u1', method: 'POST' })
    );
  });

  test('handles ActivityLog.create failure gracefully', async () => {
    ActivityLog.create.mockReturnValue(Promise.reject(new Error('DB fail')));
    const next = jest.fn();
    const res = makeRes(201);
    trackActivity(makeReq(), res, next);
    res.emit('finish');
    // Give the rejected promise a tick to settle
    await new Promise((r) => setImmediate(r));
    // Should not throw — error is caught internally
  });

  test('logs status updated for /status path', () => {
    ActivityLog.create.mockResolvedValue({});
    const next = jest.fn();
    const res = makeRes(200);
    const req = makeReq({ method: 'PATCH', baseUrl: '/api/projects', path: '/p1/status' });
    trackActivity(req, res, next);
    res.emit('finish');
    expect(ActivityLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'status updated' })
    );
  });

  test('logs reordered for /reorder path', () => {
    ActivityLog.create.mockResolvedValue({});
    const next = jest.fn();
    const res = makeRes(200);
    const req = makeReq({ method: 'PUT', baseUrl: '/api/projects', path: '/reorder' });
    trackActivity(req, res, next);
    res.emit('finish');
    expect(ActivityLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'reordered' })
    );
  });

  test('logs password changed for change-password path', () => {
    ActivityLog.create.mockResolvedValue({});
    const next = jest.fn();
    const res = makeRes(200);
    const req = makeReq({ method: 'PUT', baseUrl: '/api/auth', path: '/change-password' });
    trackActivity(req, res, next);
    res.emit('finish');
    expect(ActivityLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'password changed' })
    );
  });
});
