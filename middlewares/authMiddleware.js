const jwt = require('jsonwebtoken');
require('dotenv').config();

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader) {
    return res.status(401).json({ message: 'Akses ditolak. Token tidak ditemukan.' });
  }

  const token = authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ message: 'Format token tidak valid.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwtkeyfortodolistapp123!@#');
    req.user = decoded; // Should contain user id (e.g. req.user.id)
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token tidak valid atau telah kedaluwarsa.' });
  }
};

module.exports = authMiddleware;
