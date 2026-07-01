const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkeyfortodolistapp123!@#';

const authController = {
  async register(req, res) {
    try {
      console.log('🔐 Register request body:', req.body);
      const { fullname, email, password } = req.body;

      if (!fullname || !email || !password) {
        return res.status(400).json({ message: 'Semua field (fullname, email, password) wajib diisi.' });
      }

      // Check if email already exists
      try {
        const existingUser = await User.findByEmail(email);
        console.log('✅ Existing user check completed:', existingUser ? 'User exists' : 'New email');
        if (existingUser) {
          return res.status(400).json({ message: 'Email sudah terdaftar. Gunakan email lain.' });
        }
      } catch (dbError) {
        console.error('❌ Database error in findByEmail:', dbError.message);
        console.error('Stack:', dbError.stack);
        return res.status(500).json({ 
          message: 'Terjadi kesalahan database saat memeriksa email.',
          error: dbError.message 
        });
      }

      // Hash password
      try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        console.log('✅ Password hashed successfully');

        // Create user
        const user = await User.create({
          fullname,
          email,
          password: hashedPassword
        });
        console.log('✅ User created:', { id: user.id, email: user.email });

        res.status(201).json({
          message: 'Registrasi berhasil! Silakan login dengan akun Anda.',
          user: {
            id: user.id,
            fullname: user.fullname,
            email: user.email
          }
        });
      } catch (bcryptError) {
        console.error('❌ Bcrypt or User.create error:', bcryptError.message);
        console.error('Stack:', bcryptError.stack);
        return res.status(500).json({ 
          message: 'Terjadi kesalahan saat membuat akun.',
          error: bcryptError.message 
        });
      }
    } catch (error) {
      console.error('❌ REGISTER ERROR - Top Level:', error.message);
      console.error('Stack:', error.stack);
      res.status(500).json({ 
        message: 'Terjadi kesalahan pada server saat registrasi.', 
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  },

  async login(req, res) {
    try {
      console.log('🔐 Login request body:', req.body);
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: 'Email dan password wajib diisi.' });
      }

      // Find user by email
      let user;
      try {
        console.log('🔍 Searching for user with email:', email);
        user = await User.findByEmail(email);
        console.log('✅ User search completed:', user ? 'Found' : 'Not found');
      } catch (dbError) {
        console.error('❌ Database error in findByEmail:', dbError.message);
        console.error('Stack:', dbError.stack);
        return res.status(500).json({ 
          message: 'Terjadi kesalahan database saat mencari user.',
          error: dbError.message 
        });
      }

      if (!user) {
        return res.status(400).json({ message: 'Email atau password salah.' });
      }

      // Validate password
      try {
        console.log('🔐 Comparing passwords...');
        const isMatch = await bcrypt.compare(password, user.password);
        console.log('✅ Password comparison completed:', isMatch ? 'Match' : 'No match');
        
        if (!isMatch) {
          return res.status(400).json({ message: 'Email atau password salah.' });
        }

        // Generate JWT Token
        const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkeyfortodolistapp123!@#';
        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });
        console.log('✅ JWT token generated for user:', user.id);

        // Omit password from output
        const { password: _, ...userWithoutPassword } = user;

        res.status(200).json({
          message: 'Login berhasil!',
          token,
          user: userWithoutPassword
        });
      } catch (bcryptError) {
        console.error('❌ Bcrypt or JWT error:', bcryptError.message);
        console.error('Stack:', bcryptError.stack);
        return res.status(500).json({ 
          message: 'Terjadi kesalahan saat login.',
          error: bcryptError.message 
        });
      }
    } catch (error) {
      console.error('❌ LOGIN ERROR - Top Level:', error.message);
      console.error('Stack:', error.stack);
      res.status(500).json({ 
        message: 'Terjadi kesalahan pada server saat login.', 
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
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
