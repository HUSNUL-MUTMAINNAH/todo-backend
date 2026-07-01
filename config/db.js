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
  connectionLimit: 5,  // ✅ Reduced for serverless (was 10)
  queueLimit: 5,       // ✅ Added queue limit
  enableKeepAlive: true,  // ✅ Keep connections alive
  keepAliveInitialDelayMs: 0,
  idleTimeout: 5000,   // ✅ Close idle connections after 5s
  waitForConnectionsMs: 3000  // ✅ Timeout if can't get connection in 3s
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

// 🔥 DO NOT call initializeDatabase on startup in serverless
// This can timeout and crash the pool on cold starts
// Tables should already exist in production Aiven database

console.log('✅ Database pool created successfully');

// Test connection but don't block server startup
(async () => {
  try {
    console.log('🔍 Testing database connection...');
    const conn = await Promise.race([
      pool.getConnection(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection test timeout after 5s')), 5000)
      )
    ]);
    
    console.log('✅ Database connection test successful');
    conn.release();
  } catch (err) {
    console.error('⚠️  Database connection test failed (non-blocking):', err.message);
    console.error('Error code:', err.code);
    console.error('Stack:', err.stack);
    // Don't throw - let server start anyway, error will surface on first query
  }
})();

module.exports = pool;
