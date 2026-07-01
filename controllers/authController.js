const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkeyfortodolistapp123!@#';

const authController = {
  async register(req, res) {
    try {
      console.log('\n🔐 ===== REGISTER START =====');
      console.log('📋 Request body:', req.body);
      
      const { fullname, email, password } = req.body;

      // Validation
      if (!fullname || !email || !password) {
        console.log('❌ Missing required fields');
        return res.status(400).json({ message: 'Semua field (fullname, email, password) wajib diisi.' });
      }

      // Check existing user
      console.log('🔍 Step 1: Checking if email exists...');
      let existingUser;
      try {
        existingUser = await User.findByEmail(email);
        console.log('✅ Email check completed:', existingUser ? 'EXISTS' : 'NEW');
      } catch (dbError) {
        console.error('❌ [REGISTER] findByEmail failed:', dbError.message);
        console.error('Stack:', dbError.stack);
        console.error('Code:', dbError.code);
        console.error('SQL:', dbError.sqlMessage);
        console.error('Errno:', dbError.errno);
        return res.status(500).json({ 
          message: 'Database error saat memeriksa email',
          error: dbError.message,
          code: dbError.code 
        });
      }

      if (existingUser) {
        console.log('❌ Email sudah terdaftar');
        return res.status(400).json({ message: 'Email sudah terdaftar. Gunakan email lain.' });
      }

      // Hash password
      console.log('🔐 Step 2: Hashing password...');
      let hashedPassword;
      try {
        const salt = await bcrypt.genSalt(10);
        hashedPassword = await bcrypt.hash(password, salt);
        console.log('✅ Password hashed successfully');
      } catch (bcError) {
        console.error('❌ [REGISTER] bcrypt error:', bcError.message);
        return res.status(500).json({ 
          message: 'Error saat mengenkripsi password',
          error: bcError.message 
        });
      }

      // Create user
      console.log('📝 Step 3: Creating user in database...');
      let user;
      try {
        user = await User.create({
          fullname,
          email,
          password: hashedPassword
        });
        console.log('✅ User created successfully:', { id: user.id, email: user.email });
      } catch (createError) {
        console.error('❌ [REGISTER] User.create failed:', createError.message);
        console.error('Stack:', createError.stack);
        console.error('Code:', createError.code);
        console.error('SQL:', createError.sqlMessage);
        console.error('Errno:', createError.errno);
        return res.status(500).json({ 
          message: 'Error saat membuat akun di database',
          error: createError.message,
          code: createError.code
        });
      }

      console.log('✅ [REGISTER] SUCCESS');
      res.status(201).json({
        message: 'Registrasi berhasil! Silakan login dengan akun Anda.',
        user: {
          id: user.id,
          fullname: user.fullname,
          email: user.email
        }
      });
    } catch (error) {
      console.error('\n❌ [REGISTER] UNCAUGHT EXCEPTION');
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
      console.error('Code:', error.code);
      console.error('Errno:', error.errno);
      res.status(500).json({ 
        message: 'Terjadi kesalahan pada server saat registrasi.', 
        error: error.message,
        code: error.code
      });
    }
  },

  async login(req, res) {
    try {
      console.log('\n🔐 ===== LOGIN START =====');
      console.log('📋 Request body:', req.body);
      
      const { email, password } = req.body;

      // Validation
      if (!email || !password) {
        console.log('❌ Missing email or password');
        return res.status(400).json({ message: 'Email dan password wajib diisi.' });
      }

      // Find user
      console.log('🔍 Step 1: Finding user by email...');
      let user;
      try {
        user = await User.findByEmail(email);
        console.log('✅ User lookup completed:', user ? 'FOUND' : 'NOT_FOUND');
      } catch (dbError) {
        console.error('❌ [LOGIN] findByEmail failed:', dbError.message);
        console.error('Stack:', dbError.stack);
        console.error('Code:', dbError.code);
        console.error('SQL:', dbError.sqlMessage);
        console.error('Errno:', dbError.errno);
        return res.status(500).json({ 
          message: 'Database error saat mencari user',
          error: dbError.message,
          code: dbError.code 
        });
      }

      if (!user) {
        console.log('❌ User not found');
        return res.status(400).json({ message: 'Email atau password salah.' });
      }

      // Compare password
      console.log('🔐 Step 2: Comparing password...');
      let isMatch;
      try {
        isMatch = await bcrypt.compare(password, user.password);
        console.log('✅ Password comparison completed:', isMatch ? 'MATCH' : 'NO_MATCH');
      } catch (bcError) {
        console.error('❌ [LOGIN] bcrypt.compare failed:', bcError.message);
        return res.status(500).json({ 
          message: 'Error saat verifikasi password',
          error: bcError.message 
        });
      }

      if (!isMatch) {
        console.log('❌ Password mismatch');
        return res.status(400).json({ message: 'Email atau password salah.' });
      }

      // Generate token
      console.log('🎫 Step 3: Generating JWT token...');
      try {
        const token = jwt.sign(
          { id: user.id, email: user.email },
          JWT_SECRET,
          { expiresIn: '30d' }
        );
        console.log('✅ JWT token generated successfully');

        const { password: _, ...userWithoutPassword } = user;

        console.log('✅ [LOGIN] SUCCESS');
        res.status(200).json({
          message: 'Login berhasil!',
          token,
          user: userWithoutPassword
        });
      } catch (jwtError) {
        console.error('❌ [LOGIN] JWT sign failed:', jwtError.message);
        return res.status(500).json({ 
          message: 'Error saat membuat token',
          error: jwtError.message 
        });
      }
    } catch (error) {
      console.error('\n❌ [LOGIN] UNCAUGHT EXCEPTION');
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
      console.error('Code:', error.code);
      console.error('Errno:', error.errno);
      res.status(500).json({ 
        message: 'Terjadi kesalahan pada server saat login.', 
        error: error.message,
        code: error.code
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
