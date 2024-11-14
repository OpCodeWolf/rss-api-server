import request from 'supertest';
import RssServer from '../RssServer';

const app = new RssServer().app;

describe('POST /login', () => {
  it('should log in with valid credentials', async () => {
    const response = await request(app)
      .post('/login')
      .send({ username: 'admin', password: 'admin' });
    expect(response.status).toBe(200);
    expect(response.body.token).toBeDefined(); // Ensure a token is returned
  });

  it('should return an error for invalid credentials', async () => {
    const response = await request(app)
      .post('/login')
      .send({ username: 'wronguser', password: 'wrongpassword' });
    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Invalid username or password');
  });
});
