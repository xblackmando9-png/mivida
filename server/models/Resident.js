const mongoose = require('mongoose');

const residentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'الاسم مطلوب'],
    trim: true
  },
  apartmentNumber: {
    type: String,
    required: [true, 'رقم الشقة مطلوب'],
    trim: true
  },
  carNumber: {
    type: String,
    trim: true,
    default: ''
  },
  children: {
    type: [String],
    default: []
  },
  personalPhoto: {
    type: String,
    default: ''
  },
  carPhoto: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Resident', residentSchema);
