require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const residentRoutes = require('./routes/residentRoutes');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mivida';

// Enable CORS
app.use(cors());

// Parse JSON and form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Uploads static folder
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

// Middleware to check database connection status
const checkDbConnection = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ 
      message: 'قاعدة البيانات غير متصلة حالياً. يرجى إعداد رابط اتصال MongoDB Atlas في ملف .env بالخلفية.' 
    });
  }
  next();
};

// API Routes (checking db connection before routing)
app.use('/api/residents', checkDbConnection, residentRoutes);

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

