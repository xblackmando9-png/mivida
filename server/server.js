require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const residentRoutes = require('./routes/residentRoutes');
const parcelRoutes = require('./routes/parcelRoutes');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mivida';

// Enable CORS
app.use(cors());

// Parse JSON and form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Note: File uploads are now handled by Cloudinary (see config/cloudinary.js)

// Middleware to check database connection status
// API Routes
app.use('/api/residents', residentRoutes);
app.use('/api/parcels', parcelRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: mongoose.connection.readyState === 1 ? 'OK' : 'NO_DATABASE', 
    message: 'سيرفر ميفيدا يعمل بنجاح',
    databaseConnected: mongoose.connection.readyState === 1
  });
});

// Serve frontend in production (optional, but good practice)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client', 'dist', 'index.html'));
  });
}

// Connect to Database & Start Server
console.log('جاري الاتصال بقاعدة البيانات...');
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('تم الاتصال بقاعدة بيانات MongoDB بنجاح.');
  })
  .catch(err => {
    console.error('⚠️ تحذير: فشل الاتصال بقاعدة البيانات:', err.message);
    console.log('سيستمر السيرفر في العمل ولكن لن تتمكن من حفظ أو جلب البيانات حتى يتم الاتصال بقاعدة البيانات.');
  });

app.listen(PORT, () => {
  console.log(`السيرفر يعمل الآن على المنفذ: http://localhost:${PORT}`);
});

module.exports = app;


