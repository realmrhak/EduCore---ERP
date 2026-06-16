// backend/src/utils/cloudinary.js
const cloudinary = require('cloudinary').v2;

const isConfigured = () => {
  return !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
};

// Only configure if credentials are present
if (isConfigured()) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  console.log('Cloudinary configured successfully');
} else {
  console.log('Cloudinary not configured — file uploads will use local storage');
}

module.exports = cloudinary;
module.exports.isCloudinaryConfigured = isConfigured;
