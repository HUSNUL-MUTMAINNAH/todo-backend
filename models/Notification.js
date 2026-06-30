const db = require('../config/db');

const Notification = {
  async create({ user_id, task_id, title, message }) {
    const [result] = await db.execute(
      'INSERT INTO notifications (user_id, task_id, title, message, is_read) VALUES (?, ?, ?, ?, FALSE)',
      [user_id, task_id || null, title, message]
    );
    return { id: result.insertId, user_id, task_id, title, message, is_read: false };
  },

  async findAllByUserId(user_id) {
    const [rows] = await db.execute(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
      [user_id]
    );
    return rows;
  },

  async markAsRead(id, user_id) {
    const [result] = await db.execute(
      'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
      [id, user_id]
    );
    return result.affectedRows > 0;
  },

  async markAllAsRead(user_id) {
    const [result] = await db.execute(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = ?',
      [user_id]
    );
    return result.affectedRows > 0;
  },

  async delete(id, user_id) {
    const [result] = await db.execute(
      'DELETE FROM notifications WHERE id = ? AND user_id = ?',
      [id, user_id]
    );
    return result.affectedRows > 0;
  },

  async deleteAll(user_id) {
    const [result] = await db.execute(
      'DELETE FROM notifications WHERE user_id = ?',
      [user_id]
    );
    return result.affectedRows > 0;
  }
};

module.exports = Notification;
