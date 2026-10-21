jest.mock('googleapis', () => {
  const mockPermissionsCreate = jest.fn().mockResolvedValue({});
  const mockFilesCreate = jest.fn();
  const mockFilesDelete = jest.fn().mockResolvedValue({});
  const mockFilesList = jest.fn();

  const mockDrive = {
    files: {
      create: mockFilesCreate,
      delete: mockFilesDelete,
      list: mockFilesList,
    },
    permissions: {
      create: mockPermissionsCreate,
    },
  };

  return {
    google: {
      auth: {
        GoogleAuth: jest.fn().mockImplementation(() => ({})),
      },
      drive: jest.fn().mockReturnValue(mockDrive),
      _mockDrive: mockDrive,
    },
  };
});

const { google } = require('googleapis');
const { uploadFileToDrive, deleteFileFromDrive, extractDriveFileId } = require('../../utils/googleDrive');

const mockDrive = google._mockDrive;

beforeEach(() => {
  jest.clearAllMocks();
  // Reset the in-memory folder ID cache between tests by re-requiring the module
  jest.resetModules();
});

// Re-require after resetModules to get a fresh cache each time
const getFreshModule = () => {
  jest.mock('googleapis', () => {
    const mockPermissionsCreate = jest.fn().mockResolvedValue({});
    const mockFilesCreate = jest.fn();
    const mockFilesDelete = jest.fn().mockResolvedValue({});
    const mockFilesList = jest.fn();

    const mockDriveInner = {
      files: { create: mockFilesCreate, delete: mockFilesDelete, list: mockFilesList },
      permissions: { create: mockPermissionsCreate },
    };

    return {
      google: {
        auth: { GoogleAuth: jest.fn().mockImplementation(() => ({})) },
        drive: jest.fn().mockReturnValue(mockDriveInner),
        _mockDrive: mockDriveInner,
      },
    };
  });
  return require('../../utils/googleDrive');
};

describe('server/utils/googleDrive — extractDriveFileId', () => {
  const { extractDriveFileId: extract } = require('../../utils/googleDrive');

  test('extracts ID from lh3.googleusercontent.com URL', () => {
    expect(extract('https://lh3.googleusercontent.com/d/ABC123xyz')).toBe('ABC123xyz');
  });

  test('extracts ID from drive.google.com/uc?id= URL', () => {
    expect(extract('https://drive.google.com/uc?id=FILE_ID_HERE&export=view')).toBe('FILE_ID_HERE');
  });

  test('extracts ID from drive.google.com/file/d/ URL', () => {
    expect(extract('https://drive.google.com/file/d/FILEID99/view?usp=sharing')).toBe('FILEID99');
  });

  test('returns null for non-Drive URL', () => {
    expect(extract('https://example.com/image.jpg')).toBeNull();
  });

  test('returns null for empty string', () => {
    expect(extract('')).toBeNull();
  });

  test('returns null for undefined', () => {
    expect(extract()).toBeNull();
  });
});

describe('server/utils/googleDrive — uploadFileToDrive', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.GOOGLE_DRIVE_FOLDER_ID = 'ROOT_FOLDER_ID';
  });

  test('uploads to root folder when no folderName given', async () => {
    mockDrive.files.create.mockResolvedValue({ data: { id: 'FILE_001' } });

    const { fileId, url } = await uploadFileToDrive(
      Buffer.from('data'),
      'photo.jpg',
      'image/jpeg'
    );

    expect(fileId).toBe('FILE_001');
    expect(url).toBe('https://lh3.googleusercontent.com/d/FILE_001');

    const createCall = mockDrive.files.create.mock.calls[0][0];
    expect(createCall.requestBody.parents).toEqual(['ROOT_FOLDER_ID']);
    expect(mockDrive.permissions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        fileId: 'FILE_001',
        requestBody: { role: 'reader', type: 'anyone' },
      })
    );
  });

  test('uploads to root when folderName is not in the allowed list', async () => {
    mockDrive.files.create.mockResolvedValue({ data: { id: 'FILE_002' } });

    await uploadFileToDrive(Buffer.from('x'), 'img.png', 'image/png', 'unknown-folder');

    const createCall = mockDrive.files.create.mock.calls[0][0];
    expect(createCall.requestBody.parents).toEqual(['ROOT_FOLDER_ID']);
  });

  test('creates subfolder when it does not exist, then uploads there', async () => {
    // First call: list returns empty (subfolder missing)
    mockDrive.files.list.mockResolvedValueOnce({ data: { files: [] } });
    // Second call: create subfolder
    mockDrive.files.create
      .mockResolvedValueOnce({ data: { id: 'SUB_FOLDER_projects' } }) // create folder
      .mockResolvedValueOnce({ data: { id: 'FILE_003' } });           // create file

    const { fileId } = await uploadFileToDrive(
      Buffer.from('x'),
      'cover.jpg',
      'image/jpeg',
      'projects'
    );

    expect(fileId).toBe('FILE_003');

    // The folder-create call should use folder MIME type
    const folderCreateCall = mockDrive.files.create.mock.calls[0][0];
    expect(folderCreateCall.requestBody.mimeType).toBe('application/vnd.google-apps.folder');
    expect(folderCreateCall.requestBody.name).toBe('projects');

    // The file-create call should be parented to the new subfolder
    const fileCreateCall = mockDrive.files.create.mock.calls[1][0];
    expect(fileCreateCall.requestBody.parents).toEqual(['SUB_FOLDER_projects']);
  });

  test('reuses existing subfolder ID from Drive search', async () => {
    mockDrive.files.list.mockResolvedValueOnce({
      data: { files: [{ id: 'EXISTING_TEAM_FOLDER' }] },
    });
    mockDrive.files.create.mockResolvedValueOnce({ data: { id: 'FILE_004' } });

    const { fileId } = await uploadFileToDrive(
      Buffer.from('x'),
      'headshot.jpg',
      'image/jpeg',
      'team-members'
    );

    expect(fileId).toBe('FILE_004');
    // Should NOT have called create for the folder (only for the file)
    const createCalls = mockDrive.files.create.mock.calls;
    expect(createCalls.length).toBe(1);
    expect(createCalls[0][0].requestBody.mimeType).not.toBe('application/vnd.google-apps.folder');

    const fileCreateCall = mockDrive.files.create.mock.calls[0][0];
    expect(fileCreateCall.requestBody.parents).toEqual(['EXISTING_TEAM_FOLDER']);
  });

  test('filename is prefixed with timestamp_originalName', async () => {
    mockDrive.files.create.mockResolvedValue({ data: { id: 'FILE_005' } });

    await uploadFileToDrive(Buffer.from('x'), 'myimage.png', 'image/png');

    const createCall = mockDrive.files.create.mock.calls[0][0];
    expect(createCall.requestBody.name).toMatch(/^\d+_myimage\.png$/);
  });

  test('makes uploaded file publicly readable', async () => {
    mockDrive.files.create.mockResolvedValue({ data: { id: 'FILE_006' } });

    await uploadFileToDrive(Buffer.from('x'), 'img.jpg', 'image/jpeg');

    expect(mockDrive.permissions.create).toHaveBeenCalledWith({
      fileId: 'FILE_006',
      requestBody: { role: 'reader', type: 'anyone' },
    });
  });
});

describe('server/utils/googleDrive — uploadFileToDrive without GOOGLE_DRIVE_FOLDER_ID', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.GOOGLE_DRIVE_FOLDER_ID;
  });

  afterEach(() => {
    process.env.GOOGLE_DRIVE_FOLDER_ID = 'ROOT_FOLDER_ID';
  });

  test('uploads to Drive root (no parents) when GOOGLE_DRIVE_FOLDER_ID is unset', async () => {
    mockDrive.files.create.mockResolvedValue({ data: { id: 'FILE_NOROOT' } });

    const { fileId } = await uploadFileToDrive(Buffer.from('x'), 'img.jpg', 'image/jpeg');

    expect(fileId).toBe('FILE_NOROOT');
    const createCall = mockDrive.files.create.mock.calls[0][0];
    expect(createCall.requestBody.parents).toBeUndefined();
  });

  test('subfolder search omits root folder constraint when GOOGLE_DRIVE_FOLDER_ID is unset', async () => {
    // Use a unique folder name so cache doesn't interfere from earlier tests
    mockDrive.files.list.mockResolvedValueOnce({ data: { files: [{ id: 'SUB_NOROOT' }] } });
    mockDrive.files.create.mockResolvedValueOnce({ data: { id: 'FILE_SUB_NOROOT' } });

    await uploadFileToDrive(Buffer.from('x'), 'img.jpg', 'image/jpeg', 'testimonials');

    expect(mockDrive.files.list).toHaveBeenCalled();
    const listCall = mockDrive.files.list.mock.calls[0][0];
    expect(listCall.q).not.toContain("in parents");
  });
});

describe('server/utils/googleDrive — deleteFileFromDrive', () => {
  beforeEach(() => jest.clearAllMocks());

  test('calls drive.files.delete with the given fileId', async () => {
    mockDrive.files.delete.mockResolvedValue({});
    await deleteFileFromDrive('FILE_TO_DELETE');
    expect(mockDrive.files.delete).toHaveBeenCalledWith({ fileId: 'FILE_TO_DELETE' });
  });

  test('does not throw when delete fails (logs error instead)', async () => {
    mockDrive.files.delete.mockRejectedValue(new Error('Not found'));
    await expect(deleteFileFromDrive('BAD_ID')).resolves.toBeUndefined();
  });
});
