const db = require('../config/db');

const User = {
  async create({ fullname, email, password }) {
    const [result] = await db.execute(
      'INSERT INTO users (fullname, email, password) VALUES (?, ?, ?)',
      [fullname, email, password]
    );
    return { id: result.insertId, fullname, email };
  },

  async findByEmail(email) {
    const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0] || null;
  },

  async findById(id) {
    const [rows] = await db.execute('SELECT id, fullname, email, photo, created_at, updated_at FROM users WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async updateProfile(id, { fullname, email, photo }) {
    await db.execute(
      'UPDATE users SET fullname = ?, email = ?, photo = ? WHERE id = ?',
      [fullname, email, photo, id]
    );
    return this.findById(id);
  },

  async updatePassword(id, hashedPassword) {
    const [result] = await db.execute(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, id]
    );
    return result.affectedRows > 0;
  }
};

module.exports = User;
