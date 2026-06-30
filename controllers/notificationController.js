const Notification = require('../models/Notification');

const notificationController = {
  async getNotifications(req, res) {
    try {
      const userId = req.user.id;
      const notifications = await Notification.findAllByUserId(userId);
      res.status(200).json({ notifications });
    } catch (error) {
      console.error('Get Notifications Error:', error);
      res.status(500).json({ message: 'Terjadi kesalahan saat mengambil riwayat notifikasi.' });
    }
  },

  async markAsRead(req, res) {
    try {
      const userId = req.user.id;
      const notificationId = req.params.id;

      await Notification.markAsRead(notificationId, userId);
      res.status(200).json({ message: 'Notifikasi ditandai sebagai telah dibaca.' });
    } catch (error) {
      console.error('Mark As Read Error:', error);
      res.status(500).json({ message: 'Terjadi kesalahan saat memperbarui status notifikasi.' });
    }
  },

  async markAllAsRead(req, res) {
    try {
      const userId = req.user.id;

      await Notification.markAllAsRead(userId);
      res.status(200).json({ message: 'Semua notifikasi ditandai sebagai telah dibaca.' });
    } catch (error) {
      console.error('Mark All As Read Error:', error);
      res.status(500).json({ message: 'Terjadi kesalahan saat memperbarui status notifikasi.' });
    }
  },

  async deleteNotification(req, res) {
    try {
      const userId = req.user.id;
      const notificationId = req.params.id;

      await Notification.delete(notificationId, userId);
      res.status(200).json({ message: 'Notifikasi berhasil dihapus.' });
    } catch (error) {
      console.error('Delete Notification Error:', error);
      res.status(500).json({ message: 'Terjadi kesalahan saat menghapus notifikasi.' });
    }
  },

  async deleteAllNotifications(req, res) {
    try {
      const userId = req.user.id;

      await Notification.deleteAll(userId);
      res.status(200).json({ message: 'Semua riwayat notifikasi berhasil dihapus.' });
    } catch (error) {
      console.error('Delete All Notifications Error:', error);
      res.status(500).json({ message: 'Terjadi kesalahan saat menghapus semua notifikasi.' });
    }
  },

  async createNotification(req, res) {
    try {
      const userId = req.user.id;
      const { task_id, title, message } = req.body;

      if (!title || !message) {
        return res.status(400).json({ message: 'Judul dan isi pesan notifikasi wajib diisi.' });
      }

      const notification = await Notification.create({
        user_id: userId,
        task_id,
        title,
        message
      });

      res.status(201).json({
        message: 'Log notifikasi berhasil dicatat.',
        notification
      });
    } catch (error) {
      console.error('Create Notification Log Error:', error);
      res.status(500).json({ message: 'Terjadi kesalahan saat mencatat log notifikasi.' });
    }
  }
};

module.exports = notificationController;
