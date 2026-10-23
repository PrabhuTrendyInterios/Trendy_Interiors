const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a file buffer to Cloudinary.
 * @param {Buffer} buffer
 * @param {string} originalName
 * @param {string} [folder] - Cloudinary folder (e.g. 'projects', 'team-members')
 * @returns {Promise<{fileId: string, url: string}>}
 */
const uploadToCloudinary = (buffer, originalName, folder) => {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder: folder || 'uploads',
      resource_type: 'image',
      use_filename: false,
      unique_filename: true,
    };

    const stream = cloudinary.uploader.upload_stream(uploadOptions, (err, result) => {
      if (err) return reject(err);
      resolve({ fileId: result.public_id, url: result.secure_url });
    });

    Readable.from(buffer).pipe(stream);
  });
};

/**
 * Delete a file from Cloudinary by its public_id.
 * @param {string} publicId
 */
const deleteFromCloudinary = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error(`[Cloudinary] Failed to delete ${publicId}:`, err.message);
  }
};

/**
 * Extract Cloudinary public_id from a secure_url.
 * e.g. https://res.cloudinary.com/<cloud>/image/upload/v123/projects/abc.jpg
 *      → "projects/abc"
 * Returns null if not a Cloudinary URL.
 */
const extractCloudinaryPublicId = (url = '') => {
  if (!url) return null;
  const match = url.match(/\/image\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-z]+)?$/i);
  return match ? match[1] : null;
};

module.exports = { uploadToCloudinary, deleteFromCloudinary, extractCloudinaryPublicId };
