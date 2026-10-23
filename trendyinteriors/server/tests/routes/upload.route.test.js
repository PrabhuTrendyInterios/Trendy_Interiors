jest.mock('../../utils/cloudinary', () => ({
  uploadToCloudinary: jest.fn(),
}));

jest.mock('../../middleware/authMiddleware', () => ({
  protect: jest.fn((req, _res, next) => {
    req.user = { role: 'admin' };
    next();
  }),
}));

const express = require('express');
const request = require('supertest');
const { uploadToCloudinary } = require('../../utils/cloudinary');
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
    uploadToCloudinary.mockResolvedValue({
      fileId: 'uploads/FILE_ROOT',
      url: 'https://res.cloudinary.com/bazqzf7v/image/upload/uploads/FILE_ROOT.jpg',
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
    expect(res.body.data.fileId).toBe('uploads/FILE_ROOT');
    expect(res.body.data.url).toMatch(/cloudinary\.com/);

    expect(uploadToCloudinary).toHaveBeenCalledWith(
      expect.any(Buffer),
      'test.jpg',
      ''
    );
  });

  test('passes folder=projects to uploadToCloudinary', async () => {
    uploadToCloudinary.mockResolvedValue({
      fileId: 'projects/FILE_PROJ',
      url: 'https://res.cloudinary.com/bazqzf7v/image/upload/projects/FILE_PROJ.jpg',
    });

    await request(app)
      .post('/api/upload?folder=projects')
      .set('Authorization', 'Bearer token')
      .attach('image', Buffer.from('img'), { filename: 'cover.jpg', contentType: 'image/jpeg' });

    expect(uploadToCloudinary).toHaveBeenCalledWith(
      expect.any(Buffer),
      'cover.jpg',
      'projects'
    );
  });

  test('passes folder=team-members to uploadToCloudinary', async () => {
    uploadToCloudinary.mockResolvedValue({
      fileId: 'team-members/FILE_TEAM',
      url: 'https://res.cloudinary.com/bazqzf7v/image/upload/team-members/FILE_TEAM.jpg',
    });

    await request(app)
      .post('/api/upload?folder=team-members')
      .set('Authorization', 'Bearer token')
      .attach('image', Buffer.from('img'), { filename: 'headshot.png', contentType: 'image/png' });

    expect(uploadToCloudinary).toHaveBeenCalledWith(
      expect.any(Buffer),
      'headshot.png',
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
    expect(uploadToCloudinary).not.toHaveBeenCalled();
  });

  test('returns 500 when uploadToCloudinary throws', async () => {
    uploadToCloudinary.mockRejectedValue(new Error('Cloudinary quota exceeded'));

    const res = await request(app)
      .post('/api/upload')
      .set('Authorization', 'Bearer token')
      .attach('image', Buffer.from('img'), { filename: 'x.jpg', contentType: 'image/jpeg' });

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/Cloudinary quota exceeded/i);
  });

  test('rejects file over 6MB with 400', async () => {
    const bigBuffer = Buffer.alloc(6 * 1024 * 1024 + 1, 'x');

    const res = await request(app)
      .post('/api/upload')
      .set('Authorization', 'Bearer token')
      .attach('image', bigBuffer, { filename: 'huge.jpg', contentType: 'image/jpeg' });

    expect(res.status).toBe(400);
    expect(uploadToCloudinary).not.toHaveBeenCalled();
  });
});
