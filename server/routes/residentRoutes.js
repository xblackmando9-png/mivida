const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Resident = require('../models/Resident');

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure Storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File Filter for Images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('عذراً، يُسمح فقط برفع ملفات الصور!'));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Upload fields config
const uploadFields = upload.fields([
  { name: 'personalPhoto', maxCount: 1 },
  { name: 'carPhoto', maxCount: 1 }
]);

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
    const { name, apartmentNumber, carNumber, children } = req.body;

    if (!name || !apartmentNumber) {
      return res.status(400).json({ message: 'الاسم ورقم الشقة حقول مطلوبة' });
    }

    // Parse children if passed as string (e.g., JSON stringified or comma-separated)
    let parsedChildren = [];
    if (children) {
      try {
        parsedChildren = JSON.parse(children);
      } catch (e) {
        if (typeof children === 'string') {
          parsedChildren = children.split(',').map(c => c.trim()).filter(Boolean);
        } else if (Array.isArray(children)) {
          parsedChildren = children;
        }
      }
    }

    // Get file paths
    let personalPhoto = '';
    let carPhoto = '';

    if (req.files) {
      if (req.files.personalPhoto && req.files.personalPhoto[0]) {
        personalPhoto = `/uploads/${req.files.personalPhoto[0].filename}`;
      }
      if (req.files.carPhoto && req.files.carPhoto[0]) {
        carPhoto = `/uploads/${req.files.carPhoto[0].filename}`;
      }
    }

    const newResident = new Resident({
      name,
      apartmentNumber,
      carNumber: carNumber || '',
      children: parsedChildren,
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
// @desc    Delete a resident
router.delete('/:id', async (req, res) => {
  try {
    const resident = await Resident.findById(req.params.id);
    if (!resident) {
      return res.status(404).json({ message: 'الساكن غير موجود' });
    }

    // Delete associated photos from disk
    const deleteFile = (filePath) => {
      if (filePath) {
        const fullPath = path.join(__dirname, '..', filePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      }
    };

    deleteFile(resident.personalPhoto);
    deleteFile(resident.carPhoto);

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

    const { name, apartmentNumber, carNumber, children } = req.body;

    if (!name || !apartmentNumber) {
      return res.status(400).json({ message: 'الاسم ورقم الشقة حقول مطلوبة' });
    }

    // Parse children
    let parsedChildren = [];
    if (children) {
      try {
        parsedChildren = JSON.parse(children);
      } catch (e) {
        if (typeof children === 'string') {
          parsedChildren = children.split(',').map(c => c.trim()).filter(Boolean);
        } else if (Array.isArray(children)) {
          parsedChildren = children;
        }
      }
    }

    // Helper to delete old file
    const deleteFile = (filePath) => {
      if (filePath) {
        const fullPath = path.join(__dirname, '..', filePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      }
    };

    // Update text fields
    resident.name = name;
    resident.apartmentNumber = apartmentNumber;
    resident.carNumber = carNumber || '';
    resident.children = parsedChildren;

    // Handle new file uploads
    if (req.files) {
      if (req.files.personalPhoto && req.files.personalPhoto[0]) {
        // Delete old personal photo if exists
        deleteFile(resident.personalPhoto);
        resident.personalPhoto = `/uploads/${req.files.personalPhoto[0].filename}`;
      }
      if (req.files.carPhoto && req.files.carPhoto[0]) {
        // Delete old car photo if exists
        deleteFile(resident.carPhoto);
        resident.carPhoto = `/uploads/${req.files.carPhoto[0].filename}`;
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
