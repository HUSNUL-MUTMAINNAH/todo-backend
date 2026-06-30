const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkeyfortodolistapp123!@#';

const authController = {
  async register(req, res) {
    try {
      const { fullname, email, password } = req.body;

      // Check if email already exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'Email sudah terdaftar. Gunakan email lain.' });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create user
      const user = await User.create({
        fullname,
        email,
        password: hashedPassword
      });

      // Generate JWT Token
      const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });

      res.status(201).json({
        message: 'Registrasi berhasil!',
        token,
        user
      });
    } catch (error) {
      console.error('Register Error:', error);
      res.status(500).json({ message: 'Terjadi kesalahan pada server saat registrasi.' });
    }
  },

  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Find user by email
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(400).json({ message: 'Email atau password salah.' });
      }

      // Validate password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Email atau password salah.' });
      }

      // Generate JWT Token
      const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });

      // Omit password from output
      const { password: _, ...userWithoutPassword } = user;

      res.status(200).json({
        message: 'Login berhasil!',
        token,
        user: userWithoutPassword
      });
    } catch (error) {
      console.error('Login Error:', error);
      res.status(500).json({ message: 'Terjadi kesalahan pada server saat login.' });
    }
  },

  async getProfile(req, res) {
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User tidak ditemukan.' });
      }
      res.status(200).json({ user });
    } catch (error) {
      console.error('Get Profile Error:', error);
      res.status(500).json({ message: 'Terjadi kesalahan pada server saat mengambil profil.' });
    }
  },

  async updateProfile(req, res) {
    try {
      const { fullname, email, photo } = req.body;
      const userId = req.user.id;

      if (!fullname || !email) {
        return res.status(400).json({ message: 'Nama lengkap dan email wajib diisi.' });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Format email tidak valid.' });
      }

      // Check if email is already taken by another user
      const existingUser = await User.findByEmail(email);
      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({ message: 'Email sudah digunakan oleh user lain.' });
      }

      const updatedUser = await User.updateProfile(userId, { fullname, email, photo });
      res.status(200).json({
        message: 'Profil berhasil diperbarui!',
        user: updatedUser
      });
    } catch (error) {
      console.error('Update Profile Error:', error);
      res.status(500).json({ message: 'Terjadi kesalahan pada server saat memperbarui profil.' });
    }
  },

  async changePassword(req, res) {
    try {
      const { oldPassword, newPassword } = req.body;
      const userId = req.user.id;

      if (!oldPassword || !newPassword) {
        return res.status(400).json({ message: 'Password lama dan password baru wajib diisi.' });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ message: 'Password baru minimal terdiri dari 8 karakter.' });
      }

      // Find user to verify current password
      const [userRows] = await require('../config/db').execute('SELECT password FROM users WHERE id = ?', [userId]);
      const user = userRows[0];
      if (!user) {
        return res.status(404).json({ message: 'User tidak ditemukan.' });
      }

      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Password lama salah.' });
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      await User.updatePassword(userId, hashedPassword);
      res.status(200).json({ message: 'Password berhasil diubah!' });
    } catch (error) {
      console.error('Change Password Error:', error);
      res.status(500).json({ message: 'Terjadi kesalahan pada server saat mengubah password.' });
    }
  }
};

module.exports = authController;
