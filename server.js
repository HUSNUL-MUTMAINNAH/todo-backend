const express = require('express');
const cors = require('cors');
require('dotenv').config();

const pool = require('./config/db');
const taskRoutes = require('./routes/taskRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Global Middlewares
app.use(cors({
  origin: ['http://localhost:8081', 'exp://localhost:8081', 'https://todo-backend-eight-woad.vercel.app'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.options('*', cors()); // Enable preflight across all routes
// Support large JSON payloads for profile pictures
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'todo-backend'
  });
});

// Debug DB connection status
app.get('/debug/db', async (req, res) => {
  try {
    // Log current configuration
    console.log('Attempting database connection...');
    
    const conn = await pool.getConnection();
    await conn.ping(); // simple ping
    conn.release();
    
    // Try to get some data
    const [rows] = await conn.query('SELECT COUNT(*) as user_count FROM users');
    
    res.json({ 
      status: 'ok', 
      message: 'Database connection successful',
      user_count: rows[0].user_count
    });
  } catch (err) {
    console.error('DB debug error:', err);
    
    // Check if it's an environment variable issue
    const missingVars = [];
    if (!process.env.DB_HOST && !process.env.MYSQL_HOST) missingVars.push('DB_HOST/MYSQL_HOST');
    if (!process.env.DB_USER && !process.env.MYSQL_USER) missingVars.push('DB_USER/MYSQL_USER');
    if (!process.env.DB_NAME && !process.env.MYSQL_DATABASE) missingVars.push('DB_NAME/MYSQL_DATABASE');
    
    const errorResponse = { 
      status: 'error', 
      message: err.message,
      code: err.code,
      errno: err.errno,
      suggestion: 'Check environment variables in Vercel dashboard'
    };
    
    if (missingVars.length > 0) {
      errorResponse.missing_environment_variables = missingVars;
      errorResponse.detailed_suggestion = `The following environment variables are missing: ${missingVars.join(', ')}. Please set them in Vercel dashboard.`;
    }
    
    res.status(500).json(errorResponse);
  }
});

// Debug environment variables (safe version - hide sensitive data)
app.get('/debug/env', (req, res) => {
  const envVars = {
    NODE_ENV: process.env.NODE_ENV,
    // DB-style variables
    DB_HOST: process.env.DB_HOST ? 'Set' : 'Not set',
    DB_PORT: process.env.DB_PORT,
    DB_USER: process.env.DB_USER ? 'Set' : 'Not set',
    DB_NAME: process.env.DB_NAME,
    DB_SSL: process.env.DB_SSL,
    // MYSQL-style variables (Aiven)
    MYSQL_HOST: process.env.MYSQL_HOST ? 'Set' : 'Not set',
    MYSQL_PORT: process.env.MYSQL_PORT,
    MYSQL_USER: process.env.MYSQL_USER ? 'Set' : 'Not set',
    MYSQL_DATABASE: process.env.MYSQL_DATABASE,
    MYSQL_PASSWORD: process.env.MYSQL_PASSWORD ? 'Set' : 'Not set',
    MYSQL_SSL: process.env.MYSQL_SSL,
    // JWT
    JWT_SECRET: process.env.JWT_SECRET ? 'Set' : 'Not set',
    // SSL certificates
    MYSQL_SSL_CA: process.env.MYSQL_SSL_CA ? 'Set' : 'Not set',
    CA_CERT: process.env.CA_CERT ? 'Set' : 'Not set',
    SSL_CA_CERT: process.env.SSL_CA_CERT ? 'Set' : 'Not set'
  };
  res.json(envVars);
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
