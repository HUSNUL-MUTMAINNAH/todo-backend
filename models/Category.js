const db = require('../config/db');

const Category = {
  async create({ user_id, name, color, icon }) {
    const [result] = await db.execute(
      'INSERT INTO categories (user_id, name, color, icon) VALUES (?, ?, ?, ?)',
      [user_id, name, color, icon]
    );
    return { id: result.insertId, user_id, name, color, icon };
  },

  async findAllByUserId(user_id) {
    const [rows] = await db.execute(
      'SELECT * FROM categories WHERE user_id = ? ORDER BY name ASC',
      [user_id]
    );
    return rows;
  },

  async findById(id) {
    const [rows] = await db.execute('SELECT * FROM categories WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async update(id, user_id, { name, color, icon }) {
    await db.execute(
      'UPDATE categories SET name = ?, color = ?, icon = ? WHERE id = ? AND user_id = ?',
      [name, color, icon, id, user_id]
    );
    return this.findById(id);
  },

  async delete(id, user_id) {
    const [result] = await db.execute(
      'DELETE FROM categories WHERE id = ? AND user_id = ?',
      [id, user_id]
    );
    return result.affectedRows > 0;
  }
};

module.exports = Category;
