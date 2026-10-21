jest.mock('../../utils/googleDrive', () => ({
  uploadFileToDrive: jest.fn(),
}));

jest.mock('../../middleware/authMiddleware', () => ({
  protect: jest.fn((req, _res, next) => {
    req.user = { role: 'admin' };
    next();
  }),
}));

const express = require('express');
const request = require('supertest');
const { uploadFileToDrive } = require('../../utils/googleDrive');
const uploadRoute = require('../../routes/upload');

const app = express();
app.use(express.json());
app.use('/api/upload', uploadRoute);

describe('server/routes/upload — POST /api/upload', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 400 when no file is attached', async () => {
    const res = await request(app)
      .post('/api/upload')
      .set('Authorization', 'Bearer token');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/no file/i);
  });

  test('uploads to root (no folder param) and returns url', async () => {
    uploadFileToDrive.mockResolvedValue({
      fileId: 'FILE_ROOT',
      url: 'https://lh3.googleusercontent.com/d/FILE_ROOT',
    });

    const res = await request(app)
      .post('/api/upload')
      .set('Authorization', 'Bearer token')
      .attach('image', Buffer.from('fake-image-data'), {
        filename: 'test.jpg',
        contentType: 'image/jpeg',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.fileId).toBe('FILE_ROOT');
    expect(res.body.data.url).toBe('https://lh3.googleusercontent.com/d/FILE_ROOT');

    expect(uploadFileToDrive).toHaveBeenCalledWith(
      expect.any(Buffer),
      'test.jpg',
      'image/jpeg',
      ''
    );
  });

  test('passes folder=projects to uploadFileToDrive', async () => {
    uploadFileToDrive.mockResolvedValue({
      fileId: 'FILE_PROJ',
      url: 'https://lh3.googleusercontent.com/d/FILE_PROJ',
    });

    await request(app)
      .post('/api/upload?folder=projects')
      .set('Authorization', 'Bearer token')
      .attach('image', Buffer.from('img'), { filename: 'cover.jpg', contentType: 'image/jpeg' });

    expect(uploadFileToDrive).toHaveBeenCalledWith(
      expect.any(Buffer),
      'cover.jpg',
      'image/jpeg',
      'projects'
    );
  });

  test('passes folder=team-members to uploadFileToDrive', async () => {
    uploadFileToDrive.mockResolvedValue({
      fileId: 'FILE_TEAM',
      url: 'https://lh3.googleusercontent.com/d/FILE_TEAM',
    });

    await request(app)
      .post('/api/upload?folder=team-members')
      .set('Authorization', 'Bearer token')
      .attach('image', Buffer.from('img'), { filename: 'headshot.png', contentType: 'image/png' });

    expect(uploadFileToDrive).toHaveBeenCalledWith(
      expect.any(Buffer),
      'headshot.png',
      'image/png',
      'team-members'
    );
  });

  test('rejects non-image file with 400', async () => {
    const res = await request(app)
      .post('/api/upload')
      .set('Authorization', 'Bearer token')
      .attach('image', Buffer.from('not-an-image'), {
        filename: 'doc.pdf',
        contentType: 'application/pdf',
      });

    expect(res.status).toBe(400);
    expect(uploadFileToDrive).not.toHaveBeenCalled();
  });

  test('returns 500 when uploadFileToDrive throws', async () => {
    uploadFileToDrive.mockRejectedValue(new Error('Drive quota exceeded'));

    const res = await request(app)
      .post('/api/upload')
      .set('Authorization', 'Bearer token')
      .attach('image', Buffer.from('img'), { filename: 'x.jpg', contentType: 'image/jpeg' });

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/Drive quota exceeded/i);
  });

  test('rejects file over 6MB with 400', async () => {
    // Create a buffer just over 6MB
    const bigBuffer = Buffer.alloc(6 * 1024 * 1024 + 1, 'x');

    const res = await request(app)
      .post('/api/upload')
      .set('Authorization', 'Bearer token')
      .attach('image', bigBuffer, { filename: 'huge.jpg', contentType: 'image/jpeg' });

    expect(res.status).toBe(400);
    expect(uploadFileToDrive).not.toHaveBeenCalled();
  });
});
