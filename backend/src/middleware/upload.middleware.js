const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { isCloudinaryConfigured } = require('../utils/cloudinary');
const cloudinary = require('../utils/cloudinary');
const logger = require('../utils/logger');

// Ensure uploads folder exists (for local development / fallback)
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  try {
    fs.mkdirSync(uploadDir, { recursive: true });
  } catch (err) {
    logger.warn('Could not create uploads directory:', err.message);
  }
}

// ── Storage Configuration ────────────────────────────────────────────────────
// Use memory storage when Cloudinary is configured (no local disk writes needed)
// Use disk storage as fallback for local development without Cloudinary

const storage = isCloudinaryConfigured()
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, uploadDir);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
      },
    });

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'text/csv', 'application/csv', 'application/vnd.ms-excel',
    'application/pdf',
  ];
  if (allowedMimeTypes.includes(file.mimetype) || file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image, CSV, and PDF files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: fileFilter,
});

/**
 * Upload a file to Cloudinary (if configured) or return local path
 * @param {string|Buffer} fileInput - Local file path or Buffer
 * @param {string} folder - Cloudinary folder (e.g. 'results', 'profiles', 'challans')
 * @param {object} options - Additional Cloudinary upload options
 * @returns {Promise<{url: string, publicId: string|null}>}
 */
const uploadToCloudinary = async (fileInput, folder = 'educore', options = {}) => {
  // If Cloudinary is not configured, return local file URL
  if (!isCloudinaryConfigured()) {
    const filename = typeof fileInput === 'string' ? path.basename(fileInput) : `upload-${Date.now()}`;
    return {
      url: `/uploads/${filename}`,
      publicId: null,
    };
  }

  try {
    // Support both file paths (string) and buffers (from memoryStorage)
    const uploadOptions = {
      folder: `educore/${folder}`,
      resource_type: 'auto',
      ...options,
    };

    // If fileInput is a Buffer, use upload stream; if string, use path
    let result;
    if (Buffer.isBuffer(fileInput)) {
      result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
          if (error) reject(error);
          else resolve(result);
        });
        stream.end(fileInput);
      });
    } else {
      result = await cloudinary.uploader.upload(fileInput, uploadOptions);

      // Clean up local file after successful Cloudinary upload
      if (typeof fileInput === 'string') {
        fs.unlink(fileInput, (err) => {
          if (err) logger.warn('Error deleting temp file:', err.message);
        });
      }
    }

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    logger.error('Cloudinary upload error:', error.message);
    throw new Error('File upload to cloud storage failed');
  }
};

/**
 * Delete a file from Cloudinary by public ID
 */
const deleteFromCloudinary = async (publicId) => {
  if (!isCloudinaryConfigured() || !publicId) return;

  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: 'auto' });
  } catch (error) {
    logger.error('Cloudinary delete error:', error.message);
  }
};

/**
 * Middleware: Upload a single file to Cloudinary after multer processes it.
 * Handles both disk storage (req.file.path) and memory storage (req.file.buffer).
 * Adds req.cloudinaryResult with { url, publicId }.
 */
const uploadToCloudinaryMiddleware = (folder = 'general') => {
  return async (req, res, next) => {
    if (!req.file) return next();

    try {
      // Use buffer if available (memoryStorage), otherwise use path (diskStorage)
      const fileInput = req.file.buffer || req.file.path;
      const result = await uploadToCloudinary(fileInput, folder);
      req.cloudinaryResult = result;
      next();
    } catch (error) {
      // Clean up local file on error (disk storage only)
      if (req.file && req.file.path) {
        fs.unlink(req.file.path, () => {});
      }
      next(error);
    }
  };
};

module.exports = upload;
module.exports.uploadToCloudinary = uploadToCloudinary;
module.exports.deleteFromCloudinary = deleteFromCloudinary;
module.exports.uploadToCloudinaryMiddleware = uploadToCloudinaryMiddleware;
