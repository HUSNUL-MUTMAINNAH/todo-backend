const db = require('../config/db');

const User = {
  async create({ fullname, email, password }) {
    try {
      console.log('📝 Executing INSERT query for user:', email);
      const [result] = await db.execute(
        'INSERT INTO users (fullname, email, password) VALUES (?, ?, ?)',
        [fullname, email, password]
      );
      console.log('✅ INSERT successful, ID:', result.insertId);
      return { id: result.insertId, fullname, email };
    } catch (error) {
      console.error('❌ User.create error:', error.message);
      console.error('Code:', error.code);
      throw error;
    }
  },

  async findByEmail(email) {
    try {
      console.log('🔍 Executing SELECT query for email:', email);
      const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
      console.log('✅ SELECT successful, found:', rows.length, 'rows');
      return rows[0] || null;
    } catch (error) {
      console.error('❌ User.findByEmail error:', error.message);
      console.error('Code:', error.code);
      throw error;
    }
  },

  async findById(id) {
    try {
      console.log('🔍 Executing SELECT by ID:', id);
      const [rows] = await db.execute('SELECT id, fullname, email, photo, created_at, updated_at FROM users WHERE id = ?', [id]);
      console.log('✅ SELECT successful, found:', rows.length, 'rows');
      return rows[0] || null;
    } catch (error) {
      console.error('❌ User.findById error:', error.message);
      throw error;
    }
  },

  async updateProfile(id, { fullname, email, photo }) {
    try {
      console.log('📝 Executing UPDATE profile for ID:', id);
      await db.execute(
        'UPDATE users SET fullname = ?, email = ?, photo = ? WHERE id = ?',
        [fullname, email, photo, id]
      );
      console.log('✅ UPDATE successful');
      return this.findById(id);
    } catch (error) {
      console.error('❌ User.updateProfile error:', error.message);
      throw error;
    }
  },

  async updatePassword(id, hashedPassword) {
    try {
      console.log('📝 Executing UPDATE password for ID:', id);
      const [result] = await db.execute(
        'UPDATE users SET password = ? WHERE id = ?',
        [hashedPassword, id]
      );
      console.log('✅ UPDATE password successful');
      return result.affectedRows > 0;
    } catch (error) {
      console.error('❌ User.updatePassword error:', error.message);
      throw error;
    }
  }
};

module.exports = User;
