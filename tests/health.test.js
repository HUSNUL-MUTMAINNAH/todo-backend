const request = require('supertest');
const app = require('../server');

describe('Health Check Endpoints', () => {
  describe('GET /health', () => {
    it('should return health status', async () => {
      const res = await request(app).get('/health');
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('status', 'ok');
      expect(res.body).toHaveProperty('timestamp');
    });
  });

  describe('GET /test-connection', () => {
    it('should test database connection', async () => {
      const res = await request(app).get('/test-connection');
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('status', 'ok');
      expect(res.body.message).toContain('successful');
    });
  });

  describe('GET /debug/env', () => {
    it('should return environment variables status', async () => {
      const res = await request(app).get('/debug/env');
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('DB_HOST');
      expect(res.body).toHaveProperty('JWT_SECRET');
    });
  });
});
