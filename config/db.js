const mysql = require('mysql2/promise');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'todo_db',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

if (process.env.DB_SSL === 'true') {
  // Untuk Aiven MySQL, SSL configuration
  console.log('🔧 Configuring SSL for database connection...');
  
  // Coba berbagai metode SSL configuration
  if (process.env.MYSQL_SSL_CA) {
    // Method 1: SSL certificate dari environment variable
    console.log('📄 Using SSL certificate from MYSQL_SSL_CA environment variable');
    dbConfig.ssl = {
      ca: process.env.MYSQL_SSL_CA,
      rejectUnauthorized: true
    };
  } else if (process.env.CA_CERT) {
    // Method 2: SSL certificate dari CA_CERT environment variable
    console.log('📄 Using SSL certificate from CA_CERT environment variable');
    dbConfig.ssl = {
      ca: process.env.CA_CERT,
      rejectUnauthorized: true
    };
  } else {
    // Method 3: SSL tanpa verification untuk testing
    console.log('⚠️  Using SSL without certificate verification (for testing)');
    dbConfig.ssl = {
      rejectUnauthorized: false
    };
  }
}

console.log('🔧 Database configuration:', {
  host: dbConfig.host,
  port: dbConfig.port,
  database: dbConfig.database,
  user: dbConfig.user,
  ssl: !!dbConfig.ssl
});

const pool = mysql.createPool(dbConfig);

// Test connection on startup (log result)
pool.getConnection()
  .then(conn => {
    console.log('✅ DB connection successful');
    conn.release();
  })
  .catch(err => {
    console.error('❌ DB connection failed:', err.message);
    console.error('❌ Full error:', err);
  });

module.exports = pool;
