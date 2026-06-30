const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function setupDatabase() {
  const host = process.env.DB_HOST || 'localhost';
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const port = process.env.DB_PORT || 3306;

  console.log(`Connecting to MySQL on ${host}:${port} as ${user}...`);

  let connection;
  try {
    const dbConfig = {
      host,
      user,
      password,
      port,
      multipleStatements: true
    };
    
    if (process.env.DB_SSL === 'true') {
      dbConfig.ssl = {
        ca: fs.readFileSync(path.join(__dirname, '../ca.pem')),
        rejectUnauthorized: true
      };
    }

    connection = await mysql.createConnection(dbConfig);

    console.log('Connected! Reading init.sql...');
    const sqlPath = path.join(__dirname, 'init.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Executing database schema initialization...');
    await connection.query(sql);

    console.log('Database setup completed successfully!');
  } catch (error) {
    console.error('Error setting up the database:', error.message);
    console.log('Please make sure MySQL is running and your .env configuration is correct.');
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

setupDatabase();
