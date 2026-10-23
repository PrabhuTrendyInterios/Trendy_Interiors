const { google } = require('googleapis');
const { Readable } = require('stream');

// Valid subfolder names and their Drive folder IDs (populated lazily)
const FOLDER_NAMES = ['projects', 'rooms', 'layouts', 'addons', 'team-members', 'designs', 'services', 'testimonials', 'expertise'];
const folderIdCache = {};

const getAuthClient = () => {
  // Prefer OAuth2 (personal Gmail) — files are owned by the user, quota applies normally
  if (process.env.GOOGLE_OAUTH_REFRESH_TOKEN) {
    const oauth2 = new google.auth.OAuth2(
      process.env.GOOGLE_OAUTH_CLIENT_ID,
      process.env.GOOGLE_OAUTH_CLIENT_SECRET,
      'urn:ietf:wg:oauth:2.0:oob'
    );
    oauth2.setCredentials({ refresh_token: process.env.GOOGLE_OAUTH_REFRESH_TOKEN });
    return oauth2;
  }

  // Fallback: service account (requires Shared Drive or Workspace)
  const credentials = {
    type: 'service_account',
    project_id: process.env.GOOGLE_PROJECT_ID,
    private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
    private_key: (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    client_id: process.env.GOOGLE_CLIENT_ID,
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token',
  };

  return new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive'],
  });
};

const getDriveClient = async () => {
  const auth = getAuthClient();
  return google.drive({ version: 'v3', auth });
};

/**
 * Get or create a named subfolder under the root Drive folder.
 * Results are cached in memory for the lifetime of the process.
 */
const getOrCreateSubfolder = async (drive, folderName) => {
  if (folderIdCache[folderName]) return folderIdCache[folderName];

  const rootFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

  // Search for an existing folder with this name under root
  const searchQuery = [
    `name = '${folderName}'`,
    `mimeType = 'application/vnd.google-apps.folder'`,
    `trashed = false`,
    ...(rootFolderId ? [`'${rootFolderId}' in parents`] : []),
  ].join(' and ');

  const searchRes = await drive.files.list({
    q: searchQuery,
    fields: 'files(id, name)',
    spaces: 'drive',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  if (searchRes.data.files && searchRes.data.files.length > 0) {
    const id = searchRes.data.files[0].id;
    folderIdCache[folderName] = id;
    return id;
  }

  // Create the subfolder
  const createRes = await drive.files.create({
    requestBody: {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      ...(rootFolderId ? { parents: [rootFolderId] } : {}),
    },
    fields: 'id',
    supportsAllDrives: true,
  });

  const newId = createRes.data.id;
  console.log(`[GoogleDrive] Created subfolder "${folderName}" (${newId})`);
  folderIdCache[folderName] = newId;
  return newId;
};

/**
 * Upload a file buffer to Google Drive and return its public URL.
 * @param {Buffer} buffer - File content
 * @param {string} originalName - Original filename
 * @param {string} mimeType - MIME type of the file
 * @param {string} [folderName] - Subfolder name (e.g. 'projects', 'rooms'). Falls back to root folder.
 * @returns {Promise<{fileId: string, url: string}>}
 */
const uploadFileToDrive = async (buffer, originalName, mimeType, folderName) => {
  const drive = await getDriveClient();

  let targetFolderId;

  if (folderName && FOLDER_NAMES.includes(folderName)) {
    targetFolderId = await getOrCreateSubfolder(drive, folderName);
  } else {
    targetFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  }

  const fileMetadata = {
    name: `${Date.now()}_${originalName}`,
    ...(targetFolderId ? { parents: [targetFolderId] } : {}),
  };

  const media = {
    mimeType,
    body: Readable.from(buffer),
  };

  const response = await drive.files.create({
    requestBody: fileMetadata,
    media,
    fields: 'id, name',
    supportsAllDrives: true,
  });

  const fileId = response.data.id;

  // Make the file publicly readable
  await drive.permissions.create({
    fileId,
    requestBody: {
      role: 'reader',
      type: 'anyone',
    },
  });

  const url = `https://lh3.googleusercontent.com/d/${fileId}`;

  return { fileId, url };
};

/**
 * Delete a file from Google Drive by its file ID.
 * @param {string} fileId
 */
const deleteFileFromDrive = async (fileId) => {
  try {
    const drive = await getDriveClient();
    await drive.files.delete({ fileId, supportsAllDrives: true });
  } catch (err) {
    console.error(`[GoogleDrive] Failed to delete file ${fileId}:`, err.message);
  }
};

/**
 * Extract the Google Drive file ID from a drive URL.
 * Handles: https://lh3.googleusercontent.com/d/{id}
 *          https://drive.google.com/uc?id={id}
 *          https://drive.google.com/file/d/{id}/view
 * Returns null if the URL is not a Drive URL.
 */
const extractDriveFileId = (url = '') => {
  if (!url) return null;

  const lhMatch = url.match(/lh3\.googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/);
  if (lhMatch) return lhMatch[1];

  const ucMatch = url.match(/drive\.google\.com\/uc\?.*id=([a-zA-Z0-9_-]+)/);
  if (ucMatch) return ucMatch[1];

  const fileMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch) return fileMatch[1];

  return null;
};

module.exports = { uploadFileToDrive, deleteFileFromDrive, extractDriveFileId };
