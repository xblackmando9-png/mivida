const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'rd0u96zt',
  api_key: process.env.CLOUDINARY_API_KEY || '416226374972521',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'jDC8UAKFF8unuGdTJ2ioxY-UFh8'
});

// Storage for personal photos
const personalPhotoStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'mivida/personal_photos',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 400, height: 400, crop: 'limit', quality: 'auto' }]
  }
});

// Storage for car photos
const carPhotoStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'mivida/car_photos',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 800, height: 600, crop: 'limit', quality: 'auto' }]
  }
});

// Combined multer upload with fields
const upload = multer({
  limits: { fileSize: 5 * 1024 * 1024 } // 5 MB max
});

// For resident routes: two fields with different storages
// We handle them separately using cloudinary SDK directly if needed,
// or use a single storage with folder detection.
// Best approach: use a single storage that picks the folder based on field name.

const residentStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const folder =
      file.fieldname === 'personalPhoto'
        ? 'mivida/personal_photos'
        : 'mivida/car_photos';
    return {
      folder,
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      transformation: [{ quality: 'auto' }]
    };
  }
});

const uploadFields = multer({ storage: residentStorage }).fields([
  { name: 'personalPhoto', maxCount: 1 },
  { name: 'carPhoto', maxCount: 1 }
]);

module.exports = { cloudinary, uploadFields };
