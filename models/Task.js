const db = require('../config/db');

const Task = {
  // Helper to automatically update overdue tasks
  async autoUpdateOverdue(user_id) {
    const query = `
      UPDATE tasks 
      SET status = 'Overdue' 
      WHERE user_id = ? 
        AND status IN ('Pending', 'In Progress') 
        AND CONCAT(deadline_date, ' ', deadline_time) < NOW()
    `;
    await db.execute(query, [user_id]);
  },

  async create({ user_id, category_id, title, description, priority, status, deadline_date, deadline_time, reminder_type, reminder_datetime }) {
    const [result] = await db.execute(
      `INSERT INTO tasks (user_id, category_id, title, description, priority, status, deadline_date, deadline_time, reminder_type, reminder_datetime) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [user_id, category_id || null, title, description, priority || 'Medium', status || 'Pending', deadline_date, deadline_time, reminder_type || 'none', reminder_datetime || null]
    );
    return this.findById(result.insertId, user_id);
  },

  async findById(id, user_id) {
    await this.autoUpdateOverdue(user_id);
    const query = `
      SELECT t.*, c.name as category_name, c.color as category_color, c.icon as category_icon 
      FROM tasks t 
      LEFT JOIN categories c ON t.category_id = c.id 
      WHERE t.id = ? AND t.user_id = ?
    `;
    const [rows] = await db.execute(query, [id, user_id]);
    return rows[0] || null;
  },

  async findAll(user_id, filters = {}, sorting = {}) {
    await this.autoUpdateOverdue(user_id);

    let query = `
      SELECT t.*, c.name as category_name, c.color as category_color, c.icon as category_icon 
      FROM tasks t 
      LEFT JOIN categories c ON t.category_id = c.id 
      WHERE t.user_id = ?
    `;
    const params = [user_id];

    // Filters
    if (filters.search) {
      query += ' AND (t.title LIKE ? OR t.description LIKE ?)';
      const searchWildcard = `%${filters.search}%`;
      params.push(searchWildcard, searchWildcard);
    }

    if (filters.status) {
      query += ' AND t.status = ?';
      params.push(filters.status);
    }

    if (filters.priority) {
      query += ' AND t.priority = ?';
      params.push(filters.priority);
    }

    if (filters.category_id) {
      query += ' AND t.category_id = ?';
      params.push(filters.category_id);
    }

    // Deadline date range filters
    if (filters.deadlineRange === 'today') {
      query += ' AND t.deadline_date = CURDATE()';
    } else if (filters.deadlineRange === 'week') {
      // This week (from today to 7 days later or standard calendar week)
      query += ' AND t.deadline_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)';
    } else if (filters.deadlineRange === 'month') {
      // This month (from today to 30 days later or calendar month)
      query += ' AND t.deadline_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)';
    } else if (filters.date) {
      // Specific date (for calendar click)
      query += ' AND t.deadline_date = ?';
      params.push(filters.date);
    }

    // Sorting
    let orderBy = ' ORDER BY t.created_at DESC'; // default
    const sortField = sorting.sortBy; // 'deadline_near', 'deadline_far', 'priority', 'name', 'created_at'
    
    if (sortField === 'deadline_near') {
      orderBy = ' ORDER BY t.deadline_date ASC, t.deadline_time ASC';
    } else if (sortField === 'deadline_far') {
      orderBy = ' ORDER BY t.deadline_date DESC, t.deadline_time DESC';
    } else if (sortField === 'priority') {
      orderBy = " ORDER BY CASE t.priority WHEN 'High' THEN 1 WHEN 'Medium' THEN 2 WHEN 'Low' THEN 3 END ASC, t.deadline_date ASC";
    } else if (sortField === 'name') {
      orderBy = ' ORDER BY t.title ASC';
    } else if (sortField === 'created_at') {
      orderBy = ' ORDER BY t.created_at DESC';
    }

    query += orderBy;

    const [rows] = await db.execute(query, params);
    return rows;
  },

  async update(id, user_id, updates) {
    const { category_id, title, description, priority, status, deadline_date, deadline_time, reminder_type, reminder_datetime } = updates;
    
    let completed_at = null;
    if (status === 'Completed') {
      // If task is being marked as Completed, set completed_at to now
      completed_at = new Date();
    }

    await db.execute(
      `UPDATE tasks 
       SET category_id = ?, title = ?, description = ?, priority = ?, status = ?, deadline_date = ?, deadline_time = ?, reminder_type = ?, reminder_datetime = ?, completed_at = ? 
       WHERE id = ? AND user_id = ?`,
      [
        category_id || null, 
        title, 
        description || null, 
        priority || 'Medium', 
        status || 'Pending', 
        deadline_date, 
        deadline_time, 
        reminder_type || 'none', 
        reminder_datetime || null,
        completed_at,
        id, 
        user_id
      ]
    );

    return this.findById(id, user_id);
  },

  async toggleComplete(id, user_id, isCompleted) {
    const status = isCompleted ? 'Completed' : 'Pending';
    const completed_at = isCompleted ? new Date() : null;

    await db.execute(
      'UPDATE tasks SET status = ?, completed_at = ? WHERE id = ? AND user_id = ?',
      [status, completed_at, id, user_id]
    );

    return this.findById(id, user_id);
  },

  async delete(id, user_id) {
    const [result] = await db.execute(
      'DELETE FROM tasks WHERE id = ? AND user_id = ?',
      [id, user_id]
    );
    return result.affectedRows > 0;
  },

  async getDashboardStats(user_id) {
    await this.autoUpdateOverdue(user_id);

    // Get basic stats counts
    const [counts] = await db.execute(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'Overdue' THEN 1 ELSE 0 END) as overdue,
        SUM(CASE WHEN deadline_date = CURDATE() THEN 1 ELSE 0 END) as deadline_today
       FROM tasks WHERE user_id = ?`,
      [user_id]
    );

    const stats = counts[0] || { total: 0, pending: 0, in_progress: 0, completed: 0, overdue: 0, deadline_today: 0 };
    stats.total = Number(stats.total || 0);
    stats.pending = Number(stats.pending || 0);
    stats.in_progress = Number(stats.in_progress || 0);
    stats.completed = Number(stats.completed || 0);
    stats.overdue = Number(stats.overdue || 0);
    stats.deadline_today = Number(stats.deadline_today || 0);

    // Calculate completion percentage
    stats.progress_percentage = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

    // Get closest deadline (Deadline Terdekat)
    const [upcoming] = await db.execute(
      `SELECT t.*, c.name as category_name, c.color as category_color 
       FROM tasks t
       LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.user_id = ? AND t.status IN ('Pending', 'In Progress') AND CONCAT(t.deadline_date, ' ', t.deadline_time) >= NOW()
       ORDER BY t.deadline_date ASC, t.deadline_time ASC
       LIMIT 1`,
      [user_id]
    );
    stats.upcoming_task = upcoming[0] || null;

    return stats;
  }
};

module.exports = Task;
