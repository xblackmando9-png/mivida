const express = require('express');
const router = express.Router();
const Resident = require('../models/Resident');
const { cloudinary, uploadFields } = require('../config/cloudinary');

// Helper: extract Cloudinary public_id from secure_url for deletion
const getPublicId = (url) => {
  if (!url || !url.includes('cloudinary.com')) return null;
  // URL format: https://res.cloudinary.com/<cloud>/image/upload/v<version>/<folder>/<public_id>.<ext>
  const parts = url.split('/');
  const uploadIndex = parts.indexOf('upload');
  if (uploadIndex === -1) return null;
  // Take everything after 'upload/v<version>/' or 'upload/'
  const afterUpload = parts.slice(uploadIndex + 1);
  // Remove version segment if exists (starts with 'v' followed by numbers)
  if (/^v\d+$/.test(afterUpload[0])) afterUpload.shift();
  // Remove extension
  const withoutExt = afterUpload.join('/').replace(/\.[^.]+$/, '');
  return withoutExt;
};

// Helper: delete image from Cloudinary
const deleteFromCloudinary = async (url) => {
  const publicId = getPublicId(url);
  if (publicId) {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (e) {
      console.error('Failed to delete from Cloudinary:', e.message);
    }
  }
};

// Helper: parse children field
const parseChildren = (children) => {
  if (!children) return [];
  try {
    return JSON.parse(children);
  } catch (e) {
    if (typeof children === 'string') {
      return children.split(',').map(c => c.trim()).filter(Boolean);
    }
    return Array.isArray(children) ? children : [];
  }
};

// @route   GET /api/residents
// @desc    Get all residents
router.get('/', async (req, res) => {
  try {
    const residents = await Resident.find().sort({ createdAt: -1 });
    res.json(residents);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'حدث خطأ في السيرفر أثناء جلب البيانات' });
  }
});

// @route   POST /api/residents
// @desc    Add a new resident
router.post('/', uploadFields, async (req, res) => {
  try {
    const { name, apartmentNumber, carNumber, children, parcel } = req.body;

    if (!name || !apartmentNumber) {
      return res.status(400).json({ message: 'الاسم ورقم الشقة حقول مطلوبة' });
    }

    const parsedChildren = parseChildren(children);

    // Get Cloudinary URLs (multer-storage-cloudinary puts url in .path)
    let personalPhoto = '';
    let carPhoto = '';

    if (req.files) {
      if (req.files.personalPhoto && req.files.personalPhoto[0]) {
        personalPhoto = req.files.personalPhoto[0].path;
      }
      if (req.files.carPhoto && req.files.carPhoto[0]) {
        carPhoto = req.files.carPhoto[0].path;
      }
    }

    const newResident = new Resident({
      name,
      apartmentNumber,
      carNumber: carNumber || '',
      children: parsedChildren,
      parcel: parcel || '',
      personalPhoto,
      carPhoto
    });

    const savedResident = await newResident.save();
    res.status(201).json(savedResident);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || 'حدث خطأ أثناء حفظ الساكن' });
  }
});

// @route   DELETE /api/residents/:id
// @desc    Delete a resident and their Cloudinary photos
router.delete('/:id', async (req, res) => {
  try {
    const resident = await Resident.findById(req.params.id);
    if (!resident) {
      return res.status(404).json({ message: 'الساكن غير موجود' });
    }

    // Delete photos from Cloudinary
    await deleteFromCloudinary(resident.personalPhoto);
    await deleteFromCloudinary(resident.carPhoto);

    await Resident.findByIdAndDelete(req.params.id);
    res.json({ message: 'تم حذف الساكن وصوره بنجاح' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'حدث خطأ أثناء حذف الساكن' });
  }
});

// @route   PUT /api/residents/:id
// @desc    Update a resident's details
router.put('/:id', uploadFields, async (req, res) => {
  try {
    const resident = await Resident.findById(req.params.id);
    if (!resident) {
      return res.status(404).json({ message: 'الساكن غير موجود' });
    }

    const { name, apartmentNumber, carNumber, children, parcel } = req.body;

    if (!name || !apartmentNumber) {
      return res.status(400).json({ message: 'الاسم ورقم الشقة حقول مطلوبة' });
    }

    const parsedChildren = parseChildren(children);

    // Update text fields
    resident.name = name;
    resident.apartmentNumber = apartmentNumber;
    resident.carNumber = carNumber || '';
    resident.parcel = parcel || '';
    resident.children = parsedChildren;

    // Handle new file uploads - delete old from Cloudinary then save new URL
    if (req.files) {
      if (req.files.personalPhoto && req.files.personalPhoto[0]) {
        await deleteFromCloudinary(resident.personalPhoto);
        resident.personalPhoto = req.files.personalPhoto[0].path;
      }
      if (req.files.carPhoto && req.files.carPhoto[0]) {
        await deleteFromCloudinary(resident.carPhoto);
        resident.carPhoto = req.files.carPhoto[0].path;
      }
    }

    const updatedResident = await resident.save();
    res.json(updatedResident);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || 'حدث خطأ أثناء تحديث بيانات الساكن' });
  }
});

module.exports = router;
