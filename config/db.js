const mysql = require('mysql2/promise');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Support multiple environment variable naming conventions
// Try Aiven-style first, then fallback to DB-style
const getEnv = (name) => {
  // Try MYSQL_ prefix (Aiven style)
  const mysqlName = `MYSQL_${name}`;
  if (process.env[mysqlName]) {
    console.log(`🔧 Using ${mysqlName} for ${name}`);
    return process.env[mysqlName];
  }
  // Try DB_ prefix (our style)
  const dbName = `DB_${name}`;
  if (process.env[dbName]) {
    console.log(`🔧 Using ${dbName} for ${name}`);
    return process.env[dbName];
  }
  // Return undefined if not found
  return undefined;
};

// Get environment variables with fallbacks
const dbHost = getEnv('HOST') || process.env.DB_HOST || 'localhost';
const dbUser = getEnv('USER') || process.env.DB_USER || 'root';
const dbPassword = getEnv('PASSWORD') || process.env.DB_PASSWORD || '';
const dbName = getEnv('DATABASE') || process.env.DB_NAME || 'todo_db';
const dbPort = getEnv('PORT') || process.env.DB_PORT || 3306;
const dbSsl = getEnv('SSL') || process.env.DB_SSL;

const dbConfig = {
  host: dbHost,
  user: dbUser,
  password: dbPassword,
  database: dbName,
  port: parseInt(dbPort) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Log configuration (without password)
console.log('🔧 Database configuration:', {
  host: dbConfig.host,
  port: dbConfig.port,
  database: dbConfig.database,
  user: dbConfig.user,
  ssl: !!dbSsl,
  hasPassword: !!dbConfig.password
});

if (dbSsl === 'true') {
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
  } else if (process.env.SSL_CA_CERT) {
    // Method 3: SSL certificate dari SSL_CA_CERT
    console.log('📄 Using SSL certificate from SSL_CA_CERT environment variable');
    dbConfig.ssl = {
      ca: process.env.SSL_CA_CERT,
      rejectUnauthorized: true
    };
  } else {
    // Method 4: SSL tanpa verification untuk testing
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
  ssl: !!dbConfig.ssl,
  DB_SSL: process.env.DB_SSL,
  DB_HOST: process.env.DB_HOST,
  MYSQL_SSL_CA: process.env.MYSQL_SSL_CA ? 'Set' : 'Not set',
  CA_CERT: process.env.CA_CERT ? 'Set' : 'Not set'
});

const pool = mysql.createPool(dbConfig);

// Initialize database schema on startup
async function initializeDatabase() {
  try {
    const conn = await pool.getConnection();
    
    console.log('📋 Checking and creating tables if needed...');
    
    // Create users table
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        fullname VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        photo LONGTEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✅ Users table ready');
    
    // Create categories table
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        name VARCHAR(100) NOT NULL,
        color VARCHAR(7) NOT NULL,
        icon VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✅ Categories table ready');
    
    // Create tasks table
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        category_id INT DEFAULT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT DEFAULT NULL,
        priority ENUM('Low', 'Medium', 'High') DEFAULT 'Medium',
        status ENUM('Pending', 'In Progress', 'Completed', 'Overdue') DEFAULT 'Pending',
        deadline_date DATE NOT NULL,
        deadline_time TIME NOT NULL,
        reminder_type VARCHAR(50) DEFAULT 'none',
        reminder_datetime DATETIME DEFAULT NULL,
        completed_at TIMESTAMP DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✅ Tasks table ready');
    
    // Create notifications table
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        task_id INT DEFAULT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✅ Notifications table ready');
    
    conn.release();
    console.log('✅ Database initialization complete');
  } catch (err) {
    console.error('⚠️  Database initialization error:', err.message);
  }
}

// Test connection on startup
pool.getConnection()
  .then(async (conn) => {
    console.log('✅ DB connection successful');
    conn.release();
    
    // Initialize database schema
    await initializeDatabase();
  })
  .catch(err => {
    console.error('❌ DB connection failed:', err.message);
    console.error('❌ Full error:', err);
  });

module.exports = pool;
