const express = require('express');
const router = express.Router();
const Parcel = require('../models/Parcel');

// @route   GET /api/parcels
// @desc    Get all parcels
router.get('/', async (req, res) => {
  try {
    const parcels = await Parcel.find().sort({ createdAt: -1 });
    res.json(parcels);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'حدث خطأ في السيرفر أثناء جلب البارسيل' });
  }
});

// @route   POST /api/parcels
// @desc    Add a new parcel
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'اسم البارسيل مطلوب' });
    }

    const existingParcel = await Parcel.findOne({ name });
    if (existingParcel) {
      return res.status(400).json({ message: 'هذا البارسيل موجود بالفعل' });
    }

    const newParcel = new Parcel({ name });
    const savedParcel = await newParcel.save();
    
    res.status(201).json(savedParcel);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'حدث خطأ أثناء حفظ البارسيل' });
  }
});

// @route   DELETE /api/parcels/:id
// @desc    Delete a parcel
router.delete('/:id', async (req, res) => {
  try {
    const parcel = await Parcel.findById(req.params.id);
    if (!parcel) {
      return res.status(404).json({ message: 'البارسيل غير موجود' });
    }

    await Parcel.findByIdAndDelete(req.params.id);
    res.json({ message: 'تم حذف البارسيل بنجاح' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'حدث خطأ أثناء حذف البارسيل' });
  }
});

module.exports = router;
