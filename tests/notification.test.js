const request = require('supertest');
const app = require('../server');

describe('Notification Endpoints', () => {
  let authToken = '';
  let notificationId = 0;
  
  const testUser = {
    fullname: 'Notification Test User',
    email: `notif${Date.now()}@example.com`,
    password: 'password123'
  };

  // Setup: Register and login first
  beforeAll(async () => {
    // Register
    await request(app)
      .post('/register')
      .send(testUser);
    
    // Login
    const loginRes = await request(app)
      .post('/login')
      .send({
        email: testUser.email,
        password: testUser.password
      });
    
    authToken = loginRes.body.token;
  });

  describe('POST /notifications', () => {
    it('should create a notification log', async () => {
      const res = await request(app)
        .post('/notifications')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          task_id: null,
          title: 'Test Notification',
          message: 'This is a test notification message'
        });
      
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('notification');
      expect(res.body.notification.title).toBe('Test Notification');
      
      notificationId = res.body.notification.id;
    });

    it('should fail without title or message', async () => {
      const res = await request(app)
        .post('/notifications')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          task_id: null
        });
      
      expect(res.statusCode).toBe(400);
    });

    it('should fail without authentication', async () => {
      const res = await request(app)
        .post('/notifications')
        .send({
          title: 'Test',
          message: 'Test'
        });
      
      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /notifications', () => {
    it('should get all notifications', async () => {
      const res = await request(app)
        .get('/notifications')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('notifications');
      expect(Array.isArray(res.body.notifications)).toBe(true);
      expect(res.body.notifications.length).toBeGreaterThan(0);
    });

    it('should fail without authentication', async () => {
      const res = await request(app)
        .get('/notifications');
      
      expect(res.statusCode).toBe(401);
    });
  });

  describe('PUT /notifications/:id/read', () => {
    it('should mark notification as read', async () => {
      const res = await request(app)
        .put(`/notifications/${notificationId}/read`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toContain('dibaca');
    });
  });

  describe('PUT /notifications/read-all', () => {
    it('should mark all notifications as read', async () => {
      const res = await request(app)
        .put('/notifications/read-all')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toContain('Semua');
    });
  });

  describe('DELETE /notifications/:id', () => {
    it('should delete a notification', async () => {
      const res = await request(app)
        .delete(`/notifications/${notificationId}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toContain('dihapus');
    });
  });

  describe('DELETE /notifications', () => {
    it('should delete all notifications', async () => {
      // Create another notification first
      await request(app)
        .post('/notifications')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          task_id: null,
          title: 'Another Test',
          message: 'Another test message'
        });

      const res = await request(app)
        .delete('/notifications')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toContain('Semua');
    });
  });
});
