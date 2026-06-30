const validateRegister = (req, res, next) => {
  const { fullname, email, password } = req.body;

  if (!fullname || !email || !password) {
    return res.status(400).json({ message: 'Semua field (fullname, email, password) wajib diisi.' });
  }

  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Format email tidak valid.' });
  }

  // Password validation: min 8 characters
  if (password.length < 8) {
    return res.status(400).json({ message: 'Password minimal terdiri dari 8 karakter.' });
  }

  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email dan password wajib diisi.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Format email tidak valid.' });
  }

  next();
};

const validateTask = (req, res, next) => {
  const { title, deadline_date, deadline_time, reminder_type, reminder_datetime } = req.body;

  // Title validation: required, min 3 characters
  if (!title || title.trim().length < 3) {
    return res.status(400).json({ message: 'Judul task wajib diisi dan minimal terdiri dari 3 karakter.' });
  }

  if (!deadline_date || !deadline_time) {
    return res.status(400).json({ message: 'Tanggal dan jam deadline wajib diisi.' });
  }

  // Deadline not in the past validation
  const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  if (deadline_date < todayStr) {
    return res.status(400).json({ message: 'Tanggal deadline tidak boleh kurang dari tanggal saat ini.' });
  }

  // If reminder is set and reminder_datetime is provided, validate it's before deadline
  if (reminder_type && reminder_type !== 'none' && reminder_datetime) {
    const deadlineDateTime = new Date(`${deadline_date}T${deadline_time}`);
    const reminderDateTime = new Date(reminder_datetime);

    if (reminderDateTime >= deadlineDateTime) {
      return res.status(400).json({ message: 'Waktu reminder harus sebelum waktu deadline.' });
    }
  }

  next();
};

const validateCategory = (req, res, next) => {
  const { name, color, icon } = req.body;

  if (!name || !color || !icon) {
    return res.status(400).json({ message: 'Semua field (name, color, icon) wajib diisi.' });
  }

  // Color hex code validation
  const hexColorRegex = /^#[0-9A-F]{6}$/i;
  if (!hexColorRegex.test(color)) {
    return res.status(400).json({ message: 'Warna harus berupa kode HEX valid (contoh: #FF5733).' });
  }

  next();
};

module.exports = {
  validateRegister,
  validateLogin,
  validateTask,
  validateCategory
};
