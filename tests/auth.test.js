const request = require('supertest');
const app = require('../server');

describe('Auth Endpoints', () => {
  let authToken = '';
  const testUser = {
    fullname: 'Test User',
    email: `test${Date.now()}@example.com`,
    password: 'password123'
  };

  describe('POST /register', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/register')
        .send(testUser);
      
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toBe(testUser.email);
    });

    it('should fail with duplicate email', async () => {
      const res = await request(app)
        .post('/register')
        .send(testUser);
      
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('sudah terdaftar');
    });

    it('should fail with missing fields', async () => {
      const res = await request(app)
        .post('/register')
        .send({ email: 'test@example.com' });
      
      expect(res.statusCode).toBe(400);
    });
  });

  describe('POST /login', () => {
    it('should login successfully', async () => {
      const res = await request(app)
        .post('/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
      
      authToken = res.body.token;
    });

    it('should fail with wrong password', async () => {
      const res = await request(app)
        .post('/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword'
        });
      
      expect(res.statusCode).toBe(400);
    });

    it('should fail with non-existent email', async () => {
      const res = await request(app)
        .post('/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        });
      
      expect(res.statusCode).toBe(400);
    });
  });

  describe('GET /profile', () => {
    it('should get user profile with valid token', async () => {
      const res = await request(app)
        .get('/profile')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toBe(testUser.email);
    });

    it('should fail without token', async () => {
      const res = await request(app)
        .get('/profile');
      
      expect(res.statusCode).toBe(401);
    });

    it('should fail with invalid token', async () => {
      const res = await request(app)
        .get('/profile')
        .set('Authorization', 'Bearer invalidtoken');
      
      expect(res.statusCode).toBe(401);
    });
  });

  describe('PUT /profile', () => {
    it('should update profile successfully', async () => {
      const res = await request(app)
        .put('/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fullname: 'Updated Name',
          email: testUser.email,
          photo: null  // ✅ FIX: Use null instead of undefined
        });
      
      expect(res.statusCode).toBe(200);
      expect(res.body.user.fullname).toBe('Updated Name');
    });
  });

  describe('PUT /change-password', () => {
    it('should change password successfully', async () => {
      const res = await request(app)
        .put('/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          oldPassword: testUser.password,
          newPassword: 'newpassword123'
        });
      
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toContain('berhasil');
    });
  });
});
