const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Global Middlewares
app.use(cors());
// Support large JSON payloads for profile pictures
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'To Do List API is running.' });
});

// Mounting Routes
app.use('/', authRoutes); // Exposes POST /register, POST /login, PUT /change-password
app.use('/tasks', taskRoutes); // Exposes GET /tasks, GET /tasks/:id, etc.
app.use('/categories', categoryRoutes); // Exposes GET /categories, etc.
app.use('/notifications', notificationRoutes); // Exposes GET /notifications, etc.

// 404 Route Handler
app.use((req, res, next) => {
  res.status(404).json({ message: 'Resource yang Anda cari tidak ditemukan.' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Terjadi kesalahan internal pada server.' });
});

// Start Server
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

module.exports = app;
