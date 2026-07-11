const express = require('express');
const router = express.Router();
const Parcel = require('../models/Parcel');
const Resident = require('../models/Resident');

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
// @desc    Delete a parcel and clear it from all linked residents
router.delete('/:id', async (req, res) => {
  try {
    const parcel = await Parcel.findById(req.params.id);
    if (!parcel) {
      return res.status(404).json({ message: 'البارسيل غير موجود' });
    }

    // Clear the parcel field on all residents linked to this parcel
    await Resident.updateMany(
      { parcel: parcel.name },
      { $set: { parcel: '' } }
    );

    await Parcel.findByIdAndDelete(req.params.id);
    res.json({ message: 'تم حذف البارسيل وإلغاء ارتباطه بالسكان بنجاح' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'حدث خطأ أثناء حذف البارسيل' });
  }
});

// @route   PUT /api/parcels/:id
// @desc    Rename a parcel and update all linked residents
router.put('/:id', async (req, res) => {
  try {
    const parcel = await Parcel.findById(req.params.id);
    if (!parcel) {
      return res.status(404).json({ message: 'البارسيل غير موجود' });
    }

    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'الاسم الجديد مطلوب' });
    }

    const oldName = parcel.name;
    parcel.name = name.trim();
    await parcel.save();

    // Update all residents that had the old parcel name
    await Resident.updateMany(
      { parcel: oldName },
      { $set: { parcel: name.trim() } }
    );

    res.json(parcel);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'حدث خطأ أثناء تعديل البارسيل' });
  }
});

module.exports = router;
