const db = require('../config/db');

const User = {
  async create({ fullname, email, password }) {
    try {
      console.log('📝 [User.create] Executing INSERT for email:', email);
      const [result] = await db.execute(
        'INSERT INTO users (fullname, email, password) VALUES (?, ?, ?)',
        [fullname, email, password]
      );
      console.log('✅ [User.create] INSERT successful, ID:', result.insertId);
      return { id: result.insertId, fullname, email };
    } catch (error) {
      console.error('❌ [User.create] Database error:', error.message);
      console.error('Stack:', error.stack);
      console.error('Code:', error.code);
      console.error('SQL Message:', error.sqlMessage);
      console.error('SQL State:', error.sqlState);
      console.error('Errno:', error.errno);
      throw error;
    }
  },

  async findByEmail(email) {
    try {
      console.log('🔍 [User.findByEmail] Executing SELECT for email:', email);
      const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
      console.log('✅ [User.findByEmail] Query successful, rows found:', rows.length);
      return rows[0] || null;
    } catch (error) {
      console.error('❌ [User.findByEmail] Database error:', error.message);
      console.error('Stack:', error.stack);
      console.error('Code:', error.code);
      console.error('SQL Message:', error.sqlMessage);
      console.error('SQL State:', error.sqlState);
      throw error;
    }
  },

  async findById(id) {
    try {
      console.log('🔍 [User.findById] Executing SELECT for ID:', id);
      const [rows] = await db.execute(
        'SELECT id, fullname, email, photo, created_at, updated_at FROM users WHERE id = ?',
        [id]
      );
      console.log('✅ [User.findById] Query successful, rows found:', rows.length);
      return rows[0] || null;
    } catch (error) {
      console.error('❌ [User.findById] Database error:', error.message);
      console.error('Stack:', error.stack);
      console.error('Code:', error.code);
      console.error('SQL Message:', error.sqlMessage);
      throw error;
    }
  },

  async updateProfile(id, { fullname, email, photo }) {
    try {
      console.log('📝 [User.updateProfile] Executing UPDATE for ID:', id);
      await db.execute(
        'UPDATE users SET fullname = ?, email = ?, photo = ? WHERE id = ?',
        [fullname, email, photo, id]
      );
      console.log('✅ [User.updateProfile] UPDATE successful');
      return this.findById(id);
    } catch (error) {
      console.error('❌ [User.updateProfile] Database error:', error.message);
      console.error('Stack:', error.stack);
      console.error('Code:', error.code);
      console.error('SQL Message:', error.sqlMessage);
      throw error;
    }
  },

  async updatePassword(id, hashedPassword) {
    try {
      console.log('📝 [User.updatePassword] Executing UPDATE password for ID:', id);
      const [result] = await db.execute(
        'UPDATE users SET password = ? WHERE id = ?',
        [hashedPassword, id]
      );
      console.log('✅ [User.updatePassword] UPDATE successful, affected rows:', result.affectedRows);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('❌ [User.updatePassword] Database error:', error.message);
      console.error('Stack:', error.stack);
      console.error('Code:', error.code);
      console.error('SQL Message:', error.sqlMessage);
      throw error;
    }
  }
};

module.exports = User;

module.exports = User;
