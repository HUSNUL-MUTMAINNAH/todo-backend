const Task = require('../models/Task');

const taskController = {
  async getTasks(req, res) {
    try {
      const userId = req.user.id;
      const { search, status, priority, category_id, deadlineRange, date, sortBy } = req.query;

      const filters = { search, status, priority, category_id, deadlineRange, date };
      const sorting = { sortBy };

      const tasks = await Task.findAll(userId, filters, sorting);
      res.status(200).json({ tasks });
    } catch (error) {
      console.error('Get Tasks Error:', error);
      res.status(500).json({ message: 'Terjadi kesalahan saat mengambil data tugas.' });
    }
  },

  async getTaskById(req, res) {
    try {
      const userId = req.user.id;
      const taskId = req.params.id;

      const task = await Task.findById(taskId, userId);
      if (!task) {
        return res.status(404).json({ message: 'Tugas tidak ditemukan.' });
      }

      res.status(200).json({ task });
    } catch (error) {
      console.error('Get Task By ID Error:', error);
      res.status(500).json({ message: 'Terjadi kesalahan saat mengambil detail tugas.' });
    }
  },

  async createTask(req, res) {
    try {
      const userId = req.user.id;
      const { category_id, title, description, priority, status, deadline_date, deadline_time, reminder_type, reminder_datetime } = req.body;

      const newTask = await Task.create({
        user_id: userId,
        category_id,
        title,
        description,
        priority,
        status,
        deadline_date,
        deadline_time,
        reminder_type,
        reminder_datetime
      });

      res.status(201).json({
        message: 'Tugas berhasil ditambahkan!',
        task: newTask
      });
    } catch (error) {
      console.error('Create Task Error:', error);
      res.status(500).json({ message: 'Terjadi kesalahan saat menambahkan tugas.' });
    }
  },

  async updateTask(req, res) {
    try {
      const userId = req.user.id;
      const taskId = req.params.id;
      const updates = req.body;

      // Verify task exists and belongs to user
      const task = await Task.findById(taskId, userId);
      if (!task) {
        return res.status(404).json({ message: 'Tugas tidak ditemukan.' });
      }

      const updatedTask = await Task.update(taskId, userId, updates);
      res.status(200).json({
        message: 'Tugas berhasil diperbarui!',
        task: updatedTask
      });
    } catch (error) {
      console.error('Update Task Error:', error);
      res.status(500).json({ message: 'Terjadi kesalahan saat memperbarui tugas.' });
    }
  },

  async toggleComplete(req, res) {
    try {
      const userId = req.user.id;
      const taskId = req.params.id;
      const { isCompleted } = req.body;

      // Verify task exists
      const task = await Task.findById(taskId, userId);
      if (!task) {
        return res.status(404).json({ message: 'Tugas tidak ditemukan.' });
      }

      const updatedTask = await Task.toggleComplete(taskId, userId, isCompleted);
      res.status(200).json({
        message: isCompleted ? 'Tugas ditandai selesai!' : 'Tugas diaktifkan kembali.',
        task: updatedTask
      });
    } catch (error) {
      console.error('Toggle Complete Error:', error);
      res.status(500).json({ message: 'Terjadi kesalahan saat mengubah status tugas.' });
    }
  },

  async deleteTask(req, res) {
    try {
      const userId = req.user.id;
      const taskId = req.params.id;

      // Verify task exists
      const task = await Task.findById(taskId, userId);
      if (!task) {
        return res.status(404).json({ message: 'Tugas tidak ditemukan.' });
      }

      await Task.delete(taskId, userId);
      res.status(200).json({ message: 'Tugas berhasil dihapus!' });
    } catch (error) {
      console.error('Delete Task Error:', error);
      res.status(500).json({ message: 'Terjadi kesalahan saat menghapus tugas.' });
    }
  },

  async getDashboardStats(req, res) {
    try {
      const userId = req.user.id;
      const stats = await Task.getDashboardStats(userId);
      res.status(200).json({ stats });
    } catch (error) {
      console.error('Get Stats Error:', error);
      res.status(500).json({ message: 'Terjadi kesalahan saat mengambil statistik dashboard.' });
    }
  }
};

module.exports = taskController;
