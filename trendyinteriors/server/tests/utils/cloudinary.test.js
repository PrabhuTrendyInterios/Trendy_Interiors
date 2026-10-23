jest.mock('cloudinary', () => {
  const mockUploadStream = jest.fn();
  const mockDestroy = jest.fn();

  return {
    v2: {
      config: jest.fn(),
      uploader: {
        upload_stream: mockUploadStream,
        destroy: mockDestroy,
      },
      _mocks: { mockUploadStream, mockDestroy },
    },
  };
});

const cloudinaryMod = require('cloudinary').v2;
const { mockUploadStream, mockDestroy } = cloudinaryMod._mocks;

const { uploadToCloudinary, deleteFromCloudinary, extractCloudinaryPublicId } = require('../../utils/cloudinary');

beforeEach(() => jest.clearAllMocks());

describe('server/utils/cloudinary — extractCloudinaryPublicId', () => {
  test('extracts public_id without version segment', () => {
    const url = 'https://res.cloudinary.com/demo/image/upload/v1234567890/projects/abc.jpg';
    expect(extractCloudinaryPublicId(url)).toBe('projects/abc');
  });

  test('extracts public_id without version in URL', () => {
    const url = 'https://res.cloudinary.com/demo/image/upload/team-members/headshot.png';
    expect(extractCloudinaryPublicId(url)).toBe('team-members/headshot');
  });

  test('returns null for empty string', () => {
    expect(extractCloudinaryPublicId('')).toBeNull();
  });

  test('returns null for non-cloudinary URL', () => {
    expect(extractCloudinaryPublicId('https://example.com/img.jpg')).toBeNull();
  });

  test('returns null when called with no argument', () => {
    expect(extractCloudinaryPublicId()).toBeNull();
  });
});

describe('server/utils/cloudinary — uploadToCloudinary', () => {
  const simulateStream = (result, error = null) => {
    mockUploadStream.mockImplementation((_opts, cb) => {
      const writable = require('stream').Writable({
        write(_chunk, _enc, done) { done(); },
      });
      writable.on('finish', () => cb(error, result));
      return writable;
    });
  };

  test('resolves with fileId and url on success', async () => {
    simulateStream({ public_id: 'projects/abc123', secure_url: 'https://res.cloudinary.com/demo/image/upload/projects/abc123.jpg' });

    const result = await uploadToCloudinary(Buffer.from('data'), 'photo.jpg', 'projects');

    expect(result.fileId).toBe('projects/abc123');
    expect(result.url).toBe('https://res.cloudinary.com/demo/image/upload/projects/abc123.jpg');
    expect(mockUploadStream).toHaveBeenCalledWith(
      expect.objectContaining({ folder: 'projects', resource_type: 'image' }),
      expect.any(Function)
    );
  });

  test('uses "uploads" folder when no folder given', async () => {
    simulateStream({ public_id: 'uploads/xyz', secure_url: 'https://res.cloudinary.com/demo/image/upload/uploads/xyz.jpg' });

    await uploadToCloudinary(Buffer.from('x'), 'img.jpg', '');

    expect(mockUploadStream).toHaveBeenCalledWith(
      expect.objectContaining({ folder: 'uploads' }),
      expect.any(Function)
    );
  });

  test('rejects when upload_stream returns error', async () => {
    simulateStream(null, new Error('Network error'));

    await expect(uploadToCloudinary(Buffer.from('x'), 'img.jpg', 'projects')).rejects.toThrow('Network error');
  });
});

describe('server/utils/cloudinary — deleteFromCloudinary', () => {
  test('calls cloudinary destroy with the public_id', async () => {
    mockDestroy.mockResolvedValue({ result: 'ok' });
    await deleteFromCloudinary('projects/abc123');
    expect(mockDestroy).toHaveBeenCalledWith('projects/abc123');
  });

  test('does not throw when destroy fails (logs error instead)', async () => {
    mockDestroy.mockRejectedValue(new Error('Not found'));
    await expect(deleteFromCloudinary('bad/id')).resolves.toBeUndefined();
  });
});
