const Category = require('../models/Category');

const categoryController = {
  async getCategories(req, res) {
    try {
      const userId = req.user.id;
      const categories = await Category.findAllByUserId(userId);
      res.status(200).json({ categories });
    } catch (error) {
      console.error('Get Categories Error:', error);
      res.status(500).json({ message: 'Terjadi kesalahan saat mengambil data kategori.' });
    }
  },

  async createCategory(req, res) {
    try {
      const userId = req.user.id;
      const { name, color, icon } = req.body;

      const newCategory = await Category.create({
        user_id: userId,
        name,
        color,
        icon
      });

      res.status(201).json({
        message: 'Kategori berhasil dibuat!',
        category: newCategory
      });
    } catch (error) {
      console.error('Create Category Error:', error);
      res.status(500).json({ message: 'Terjadi kesalahan saat membuat kategori.' });
    }
  },

  async updateCategory(req, res) {
    try {
      const userId = req.user.id;
      const categoryId = req.params.id;
      const { name, color, icon } = req.body;

      // Verify category exists and belongs to user
      const category = await Category.findById(categoryId);
      if (!category) {
        return res.status(404).json({ message: 'Kategori tidak ditemukan.' });
      }
      if (category.user_id !== userId) {
        return res.status(403).json({ message: 'Akses ditolak. Anda tidak berwenang mengubah kategori ini.' });
      }

      const updatedCategory = await Category.update(categoryId, userId, { name, color, icon });
      res.status(200).json({
        message: 'Kategori berhasil diperbarui!',
        category: updatedCategory
      });
    } catch (error) {
      console.error('Update Category Error:', error);
      res.status(500).json({ message: 'Terjadi kesalahan saat memperbarui kategori.' });
    }
  },

  async deleteCategory(req, res) {
    try {
      const userId = req.user.id;
      const categoryId = req.params.id;

      // Verify category exists and belongs to user
      const category = await Category.findById(categoryId);
      if (!category) {
        return res.status(404).json({ message: 'Kategori tidak ditemukan.' });
      }
      if (category.user_id !== userId) {
        return res.status(403).json({ message: 'Akses ditolak. Anda tidak berwenang menghapus kategori ini.' });
      }

      await Category.delete(categoryId, userId);
      res.status(200).json({ message: 'Kategori berhasil dihapus!' });
    } catch (error) {
      console.error('Delete Category Error:', error);
      res.status(500).json({ message: 'Terjadi kesalahan saat menghapus kategori.' });
    }
  }
};

module.exports = categoryController;
