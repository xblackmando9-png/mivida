const mongoose = require('mongoose');

const parcelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'اسم البارسيل مطلوب'],
    unique: true,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Parcel', parcelSchema);
